-- ==============================================================================
-- GÜNCELLEME: BORÇ VERMEDE BORÇLU ONAYI SİSTEMİ
-- Borç verildiğinde hemen aktarılmaz; borcu alan oyuncu onaylayana kadar bekler.
-- ==============================================================================

-- 1. Debts tablosunun status kontrolünü 'pending' ve 'rejected' içerecek şekilde güncelle
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'debts'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%status%'
    ) LOOP
        EXECUTE 'ALTER TABLE debts DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

ALTER TABLE debts ADD CONSTRAINT debts_status_check 
CHECK (status IN ('pending', 'rejected', 'active', 'partially_paid', 'settled'));

-- 2. lend_debt fonksiyonunu güncelle: Borç 'pending' olarak oluşturulur, onaylanana kadar para kesilmez.
CREATE OR REPLACE FUNCTION lend_debt(
    p_room_id UUID,
    p_session_token TEXT,
    p_creditor_id UUID,
    p_debtor_id UUID,
    p_amount NUMERIC,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_creditor players%ROWTYPE;
    v_debtor players%ROWTYPE;
    v_debt debts%ROWTYPE;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Borç tutarı sıfırdan büyük olmalıdır.';
    END IF;

    IF p_creditor_id = p_debtor_id THEN
        RAISE EXCEPTION 'Kendinize borç veremezsiniz.';
    END IF;

    SELECT * INTO v_creditor FROM players WHERE id = p_creditor_id AND room_id = p_room_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Alacaklı oyuncu bulunamadı.';
    END IF;

    IF v_creditor.session_token <> p_session_token THEN
        IF NOT EXISTS (SELECT 1 FROM players WHERE room_id = p_room_id AND session_token = p_session_token AND is_banker = true) THEN
            RAISE EXCEPTION 'Yetkisiz işlem: Sadece parayı veren oyuncu veya bankacı borç verebilir.';
        END IF;
    END IF;

    IF v_creditor.balance < p_amount THEN
        RAISE EXCEPTION 'Yetersiz bakiye. Mevcut bakiye: % ₺', v_creditor.balance;
    END IF;

    SELECT * INTO v_debtor FROM players WHERE id = p_debtor_id AND room_id = p_room_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Borçlu oyuncu bulunamadı.';
    END IF;

    -- Borç teklifi 'pending' durumunda oluşturulur.
    -- Para transferi borcu alan onaylayana kadar yapılmaz.
    INSERT INTO debts (room_id, creditor_id, debtor_id, initial_amount, paid_amount, remaining_amount, status, description)
    VALUES (p_room_id, p_creditor_id, p_debtor_id, p_amount, 0, p_amount, 'pending', p_description)
    RETURNING * INTO v_debt;

    RETURN jsonb_build_object(
        'success', true,
        'debt', row_to_json(v_debt),
        'pending_approval', true
    );
END;
$$;

-- 3. Borcu alan kişinin borcu kabul etmesi (Para transferi burada gerçekleşir)
CREATE OR REPLACE FUNCTION approve_debt(
    p_room_id UUID,
    p_session_token TEXT,
    p_debt_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_debt debts%ROWTYPE;
    v_creditor players%ROWTYPE;
    v_debtor players%ROWTYPE;
BEGIN
    SELECT * INTO v_debt FROM debts WHERE id = p_debt_id AND room_id = p_room_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Borç kaydı bulunamadı.';
    END IF;

    IF v_debt.status <> 'pending' THEN
        RAISE EXCEPTION 'Bu borç teklifi onay bekleyen durumda değil (Durum: %).', v_debt.status;
    END IF;

    SELECT * INTO v_debtor FROM players WHERE id = v_debt.debtor_id AND room_id = p_room_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Borçlu oyuncu bulunamadı.';
    END IF;

    -- Borcu sadece borcu alan kişi veya bankacı onaylayabilir
    IF v_debtor.session_token <> p_session_token THEN
        IF NOT EXISTS (SELECT 1 FROM players WHERE room_id = p_room_id AND session_token = p_session_token AND is_banker = true) THEN
            RAISE EXCEPTION 'Yetkisiz işlem: Bu borcu yalnızca borcu alan kişi onaylayabilir.';
        END IF;
    END IF;

    SELECT * INTO v_creditor FROM players WHERE id = v_debt.creditor_id AND room_id = p_room_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Alacaklı oyuncu bulunamadı.';
    END IF;

    -- Alacaklının şu anki bakiyesi hala yeterli mi?
    IF v_creditor.balance < v_debt.initial_amount THEN
        RAISE EXCEPTION 'Alacaklı oyuncunun (%s) bakiyesi borç tutarı için yetersiz! (Mevcut: % ₺)', v_creditor.name, v_creditor.balance;
    END IF;

    -- Para transferini şimdi gerçekleştir: Alacaklıdan düş, borçluya aktar
    UPDATE players SET balance = balance - v_debt.initial_amount WHERE id = v_creditor.id;
    UPDATE players SET balance = balance + v_debt.initial_amount WHERE id = v_debtor.id;

    -- Borcu aktif yap
    UPDATE debts 
    SET status = 'active', 
        updated_at = now() 
    WHERE id = v_debt.id;

    -- İşlem geçmişine kaydet
    INSERT INTO transactions (room_id, type, from_player_id, to_player_id, amount, description)
    VALUES (
        p_room_id, 
        'debt_lend', 
        v_creditor.id, 
        v_debtor.id, 
        v_debt.initial_amount, 
        COALESCE(v_debt.description, 'Borç onaylandı ve verildi')
    );

    RETURN jsonb_build_object(
        'success', true,
        'debt_id', v_debt.id,
        'status', 'active'
    );
END;
$$;

-- 4. Borç teklifini reddetme (Borçlu reddeder) veya iptal etme (Alacaklı iptal eder)
CREATE OR REPLACE FUNCTION reject_debt(
    p_room_id UUID,
    p_session_token TEXT,
    p_debt_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_debt debts%ROWTYPE;
    v_caller players%ROWTYPE;
BEGIN
    SELECT * INTO v_debt FROM debts WHERE id = p_debt_id AND room_id = p_room_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Borç kaydı bulunamadı.';
    END IF;

    IF v_debt.status <> 'pending' THEN
        RAISE EXCEPTION 'Bu borç teklifi zaten onaylanmış veya sonuçlandırılmış.';
    END IF;

    -- İşlemi çağıran oyuncu borçlu, alacaklı veya bankacı olmalı
    SELECT * INTO v_caller FROM players WHERE room_id = p_room_id AND session_token = p_session_token;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Geçersiz oturum.';
    END IF;

    IF v_caller.id <> v_debt.debtor_id AND v_caller.id <> v_debt.creditor_id AND NOT v_caller.is_banker THEN
        RAISE EXCEPTION 'Yetkisiz işlem: Bu teklifi yalnızca borçlu veya borç veren iptal edebilir.';
    END IF;

    UPDATE debts 
    SET status = 'rejected', 
        updated_at = now() 
    WHERE id = v_debt.id;

    RETURN jsonb_build_object(
        'success', true,
        'debt_id', v_debt.id,
        'status', 'rejected'
    );
END;
$$;
