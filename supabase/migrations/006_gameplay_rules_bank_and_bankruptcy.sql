-- ==============================================================================
-- 006_gameplay_rules_bank_and_bankruptcy.sql
-- 1. Başkasının cüzdanından borç ödemeyi engelle (sadece borçlu ödeyebilir)
-- 2. Bankacının başkası adına borç onaylamasını engelle (sadece borçlu kabul edebilir)
-- 3. Bankaya Ödeme fonksiyonu (pay_to_bank)
-- 4. İflas mekanizması (declare_bankruptcy)
-- 5. is_bankrupt sütunu ve güncellemeler
-- ==============================================================================

-- 1. is_bankrupt sütunu ekle
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS is_bankrupt BOOLEAN NOT NULL DEFAULT false;

-- 2. transactions tablosuna 'bankruptcy' ve 'bank_payment' türlerini ekle
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('transfer', 'debt_lend', 'debt_payment', 'debt_settlement', 'banker_adjust', 'bank_payment', 'bankruptcy'));

-- 3. Başkasının cüzdanından borç ödemeyi ENGELLE (yalnızca borçlunun kendisi ödeyebilir)
CREATE OR REPLACE FUNCTION public.pay_debt(
    p_room_id UUID,
    p_session_token TEXT,
    p_debt_id UUID,
    p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_debt debts%ROWTYPE;
    v_debtor players%ROWTYPE;
    v_creditor players%ROWTYPE;
    v_new_remaining NUMERIC;
    v_new_status TEXT;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Ödeme tutarı sıfırdan büyük olmalıdır.';
    END IF;

    SELECT * INTO v_debt FROM debts WHERE id = p_debt_id AND room_id = p_room_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Borç kaydı bulunamadı.';
    END IF;

    IF v_debt.status = 'settled' OR v_debt.remaining_amount <= 0 THEN
        RAISE EXCEPTION 'Bu borç zaten kapatılmış.';
    END IF;

    IF p_amount > v_debt.remaining_amount THEN
        RAISE EXCEPTION 'Ödeme tutarı kalan borçtan (% ₺) fazla olamaz.', v_debt.remaining_amount;
    END IF;

    SELECT * INTO v_debtor FROM players WHERE id = v_debt.debtor_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Borçlu oyuncu bulunamadı.';
    END IF;

    -- SADECE VE SADECE BORÇLU KENDİ CÜZDANINDAN ÖDEYEBİLİR
    IF v_debtor.session_token <> p_session_token THEN
        RAISE EXCEPTION 'Yetkisiz işlem: Borç yalnızca borçlu olan oyuncunun kendi cüzdanından ödenebilir.';
    END IF;

    IF v_debtor.balance < p_amount THEN
        RAISE EXCEPTION 'Yetersiz bakiye! Ödeme için bakiyeniz: % ₺', v_debtor.balance;
    END IF;

    SELECT * INTO v_creditor FROM players WHERE id = v_debt.creditor_id FOR UPDATE;

    -- Nakit aktarımı: Borçlu -> Alacaklı
    UPDATE players SET balance = balance - p_amount WHERE id = v_debt.debtor_id;
    UPDATE players SET balance = balance + p_amount WHERE id = v_debt.creditor_id;

    v_new_remaining := v_debt.remaining_amount - p_amount;
    IF v_new_remaining = 0 THEN
        v_new_status := 'settled';
    ELSE
        v_new_status := 'partially_paid';
    END IF;

    UPDATE debts 
    SET paid_amount = paid_amount + p_amount,
        remaining_amount = v_new_remaining,
        status = v_new_status,
        updated_at = now()
    WHERE id = p_debt_id;

    INSERT INTO debt_payments (debt_id, amount, remaining_after)
    VALUES (p_debt_id, p_amount, v_new_remaining);

    INSERT INTO transactions (room_id, type, from_player_id, to_player_id, amount, description)
    VALUES (p_room_id, 'debt_payment', v_debt.debtor_id, v_debt.creditor_id, p_amount, 'Borç ödemesi');

    RETURN jsonb_build_object('success', true, 'remaining_amount', v_new_remaining);
END;
$$;

-- 4. Bankacının başkası adına borç onaylamasını ENGELLE (yalnızca borçlu kabul edebilir)
CREATE OR REPLACE FUNCTION public.approve_debt(
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

    -- SADECE BORÇLU KENDİSİ ONAYLAYABİLİR (Bankacı dahi başkası adına borçlanamaz)
    IF v_debtor.session_token <> p_session_token THEN
        RAISE EXCEPTION 'Yetkisiz işlem: Bu borç teklifini yalnızca borçlu olan oyuncu (%s) onaylayabilir.', v_debtor.name;
    END IF;

    SELECT * INTO v_creditor FROM players WHERE id = v_debt.creditor_id AND room_id = p_room_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Alacaklı oyuncu bulunamadı.';
    END IF;

    IF v_creditor.balance < v_debt.initial_amount THEN
        RAISE EXCEPTION 'Alacaklı oyuncunun (%s) bakiyesi borç tutarı için yetersiz! (Mevcut: % ₺)', v_creditor.name, v_creditor.balance;
    END IF;

    UPDATE players SET balance = balance - v_debt.initial_amount WHERE id = v_creditor.id;
    UPDATE players SET balance = balance + v_debt.initial_amount WHERE id = v_debtor.id;

    UPDATE debts 
    SET status = 'active', 
        updated_at = now() 
    WHERE id = v_debt.id;

    INSERT INTO transactions (room_id, type, from_player_id, to_player_id, amount, description)
    VALUES (
        p_room_id, 
        'debt_lend', 
        v_creditor.id, 
        v_debtor.id, 
        v_debt.initial_amount, 
        COALESCE(v_debt.description, 'Borç verildi')
    );

    RETURN jsonb_build_object('success', true, 'debt_id', v_debt.id);
END;
$$;

-- 5. BANKAYA ÖDEME FONKSİYONU (Tapu satın alımı, vergi, hapishane cezası vs.)
CREATE OR REPLACE FUNCTION public.pay_to_bank(
    p_room_id UUID,
    p_session_token TEXT,
    p_amount NUMERIC,
    p_description TEXT DEFAULT 'Bankaya Ödeme'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_player players%ROWTYPE;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Ödeme tutarı sıfırdan büyük olmalıdır.';
    END IF;

    SELECT * INTO v_player 
    FROM players 
    WHERE room_id = p_room_id AND session_token = p_session_token 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Oyuncu bulunamadı.';
    END IF;

    IF v_player.balance < p_amount THEN
        RAISE EXCEPTION 'Yetersiz bakiye! Mevcut bakiyeniz: % ₺', v_player.balance;
    END IF;

    -- Parayı oyuncunun bakiyesinden düş
    UPDATE players 
    SET balance = balance - p_amount 
    WHERE id = v_player.id;

    -- İşlem kaydı aç (to_player_id NULL = Banka)
    INSERT INTO transactions (room_id, type, from_player_id, to_player_id, amount, description)
    VALUES (p_room_id, 'bank_payment', v_player.id, NULL, p_amount, COALESCE(p_description, 'Bankaya Ödeme'));

    RETURN jsonb_build_object(
        'success', true, 
        'player_id', v_player.id, 
        'new_balance', v_player.balance - p_amount
    );
END;
$$;

-- 6. İFLAS ETME FONKSİYONU (Tasfiye ve Oyundan Çekilme)
CREATE OR REPLACE FUNCTION public.declare_bankruptcy(
    p_room_id UUID,
    p_session_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_player players%ROWTYPE;
    v_debt debts%ROWTYPE;
    v_remaining_cash NUMERIC;
BEGIN
    SELECT * INTO v_player 
    FROM players 
    WHERE room_id = p_room_id AND session_token = p_session_token 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Oyuncu bulunamadı.';
    END IF;

    IF v_player.is_bankrupt THEN
        RAISE EXCEPTION 'Bu oyuncu zaten iflas etmiş.';
    END IF;

    v_remaining_cash := v_player.balance;

    -- 1. Kalan nakit varsa alacaklılarına dağıt
    FOR v_debt IN 
        SELECT * FROM debts 
        WHERE debtor_id = v_player.id 
          AND status IN ('active', 'partially_paid') 
          AND remaining_amount > 0 
        ORDER BY created_at ASC
    LOOP
        IF v_remaining_cash > 0 THEN
            DECLARE
                v_pay NUMERIC := LEAST(v_remaining_cash, v_debt.remaining_amount);
            BEGIN
                UPDATE players SET balance = balance + v_pay WHERE id = v_debt.creditor_id;
                v_remaining_cash := v_remaining_cash - v_pay;
            END;
        END IF;

        UPDATE debts 
        SET status = 'settled', 
            remaining_amount = 0, 
            description = COALESCE(description, '') || ' (İflas ile kapatıldı)',
            updated_at = now()
        WHERE id = v_debt.id;
    END LOOP;

    -- 2. Alacaklı olduğu borçları sil
    UPDATE debts 
    SET status = 'settled',
        remaining_amount = 0,
        description = COALESCE(description, '') || ' (Alacaklı iflas ettiği için silindi)',
        updated_at = now()
    WHERE creditor_id = v_player.id AND status IN ('active', 'partially_paid', 'pending');

    -- 3. Oyuncuyu iflas etmiş ve çevrimdışı işaretle, bakiyesini 0 yap
    UPDATE players 
    SET balance = 0,
        is_bankrupt = true,
        is_online = false
    WHERE id = v_player.id;

    -- 4. İşlem geçmişine kaydet
    INSERT INTO transactions (room_id, type, from_player_id, to_player_id, amount, description)
    VALUES (p_room_id, 'bankruptcy', v_player.id, NULL, v_player.balance, v_player.name || ' iflas etti ve oyundan çekildi.');

    RETURN jsonb_build_object('success', true, 'player_id', v_player.id);
END;
$$;
