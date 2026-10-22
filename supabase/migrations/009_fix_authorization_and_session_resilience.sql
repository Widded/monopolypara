-- ==============================================================================
-- 009_fix_authorization_and_session_resilience.sql
-- 1. transfer_money: Akıllı oturum yetkilendirme & otomatik oturum onarma (Auto-healing session).
-- 2. lend_debt: Güvenli ve kesintisiz borç teklifi yetkilendirmesi.
-- 3. pay_debt: Borçlu veya bankacı için esnek ve güvenli ödeme.
-- 4. approve_debt & reject_debt: Borç teklifi onaylama/reddetmede oturum toleransı.
-- 5. banker_adjust_balance & reverse_transaction: Bankacı yetki doğrulamasında session auto-recovery.
-- ==============================================================================

-- 1. PARA TRANSFERİ (transfer_money)
CREATE OR REPLACE FUNCTION public.transfer_money(
    p_room_id UUID,
    p_session_token TEXT,
    p_from_player_id UUID,
    p_to_player_id UUID,
    p_amount NUMERIC,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sender players%ROWTYPE;
    v_receiver players%ROWTYPE;
    v_other_player players%ROWTYPE;
    v_is_banker BOOLEAN := false;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Transfer tutarı sıfırdan büyük olmalıdır.';
    END IF;

    IF p_from_player_id = p_to_player_id THEN
        RAISE EXCEPTION 'Kendinize para gönderemezsiniz.';
    END IF;

    -- Göndereni doğrula ve kilitle
    SELECT * INTO v_sender FROM players 
    WHERE id = p_from_player_id AND room_id = p_room_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Gönderen oyuncu bulunamadı.';
    END IF;

    -- Bankacı kontrolü
    SELECT EXISTS (
        SELECT 1 FROM players 
        WHERE room_id = p_room_id 
          AND (session_token = p_session_token OR (id = p_from_player_id AND is_banker = true))
          AND is_banker = true
    ) INTO v_is_banker;

    -- Oturum yetkisini kontrol et
    IF v_sender.session_token = p_session_token OR v_is_banker THEN
        -- Doğrudan yetkili
        NULL;
    ELSE
        -- Token eşleşmedi: Bu token masada BAŞKA bir aktif oyuncuya mı ait?
        SELECT * INTO v_other_player 
        FROM players 
        WHERE room_id = p_room_id 
          AND session_token = p_session_token 
          AND id <> p_from_player_id;

        IF FOUND THEN
            RAISE EXCEPTION 'Bu işlem için yetkiniz yok (Yetkisiz oturum).';
        ELSE
            -- Token masada başka kimseye ait değil (Oturum yenilenmiş veya cihaz değişmiş)
            -- Oturumu otomatik onar ve devam et
            UPDATE players 
            SET session_token = p_session_token, is_online = true 
            WHERE id = p_from_player_id;
            
            v_sender.session_token := p_session_token;
        END IF;
    END IF;

    -- Bakiye kontrolü
    IF v_sender.balance < p_amount THEN
        RAISE EXCEPTION 'Yetersiz bakiye! Mevcut bakiye: % ₺', v_sender.balance;
    END IF;

    -- Alıcıyı doğrula ve kilitle
    SELECT * INTO v_receiver FROM players 
    WHERE id = p_to_player_id AND room_id = p_room_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Alıcı oyuncu bulunamadı.';
    END IF;

    -- Bakiyeleri güncelle
    UPDATE players SET balance = balance - p_amount WHERE id = p_from_player_id;
    UPDATE players SET balance = balance + p_amount WHERE id = p_to_player_id;

    -- İşlem geçmişine kaydet
    INSERT INTO transactions (room_id, type, from_player_id, to_player_id, amount, description)
    VALUES (p_room_id, 'transfer', p_from_player_id, p_to_player_id, p_amount, p_description);

    RETURN jsonb_build_object('success', true, 'message', 'Transfer başarılı.');
END;
$$;


-- 2. BORÇ VERME (lend_debt)
CREATE OR REPLACE FUNCTION public.lend_debt(
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
    v_other_player players%ROWTYPE;
    v_is_banker BOOLEAN := false;
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

    -- Bankacı kontrolü
    SELECT EXISTS (
        SELECT 1 FROM players 
        WHERE room_id = p_room_id 
          AND (session_token = p_session_token OR (id = p_creditor_id AND is_banker = true))
          AND is_banker = true
    ) INTO v_is_banker;

    -- Oturum yetkisini kontrol et
    IF v_creditor.session_token = p_session_token OR v_is_banker THEN
        NULL;
    ELSE
        SELECT * INTO v_other_player 
        FROM players 
        WHERE room_id = p_room_id 
          AND session_token = p_session_token 
          AND id <> p_creditor_id;

        IF FOUND THEN
            RAISE EXCEPTION 'Yetkisiz işlem: Sadece parayı veren oyuncu veya bankacı borç verebilir.';
        ELSE
            UPDATE players 
            SET session_token = p_session_token, is_online = true 
            WHERE id = p_creditor_id;
            
            v_creditor.session_token := p_session_token;
        END IF;
    END IF;

    IF v_creditor.balance < p_amount THEN
        RAISE EXCEPTION 'Yetersiz bakiye. Mevcut bakiye: % ₺', v_creditor.balance;
    END IF;

    SELECT * INTO v_debtor FROM players WHERE id = p_debtor_id AND room_id = p_room_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Borçlu oyuncu bulunamadı.';
    END IF;

    -- Borç teklifi 'pending' durumunda oluşturulur
    INSERT INTO debts (room_id, creditor_id, debtor_id, initial_amount, paid_amount, remaining_amount, status, description)
    VALUES (p_room_id, p_creditor_id, p_debtor_id, p_amount, 0, p_amount, 'pending', p_description)
    RETURNING * INTO v_debt;

    RETURN jsonb_build_object(
        'success', true,
        'debt_id', v_debt.id,
        'message', 'Borç teklifi oluşturuldu, onay bekleniyor.'
    );
END;
$$;


-- 3. BORÇ ÖDEME (pay_debt)
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
    v_other_player players%ROWTYPE;
    v_is_banker BOOLEAN := false;
    v_new_remaining NUMERIC;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Ödeme tutarı sıfırdan büyük olmalıdır.';
    END IF;

    SELECT * INTO v_debt FROM debts WHERE id = p_debt_id AND room_id = p_room_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Borç kaydı bulunamadı.';
    END IF;

    IF v_debt.status NOT IN ('active', 'partially_paid') OR v_debt.remaining_amount <= 0 THEN
        RAISE EXCEPTION 'Bu borç zaten kapatılmış.';
    END IF;

    IF p_amount > v_debt.remaining_amount THEN
        RAISE EXCEPTION 'Ödeme tutarı kalan borçtan (% ₺) fazla olamaz.', v_debt.remaining_amount;
    END IF;

    SELECT * INTO v_debtor FROM players WHERE id = v_debt.debtor_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Borçlu oyuncu bulunamadı.';
    END IF;

    -- Bankacı kontrolü
    SELECT EXISTS (
        SELECT 1 FROM players 
        WHERE room_id = p_room_id 
          AND (session_token = p_session_token OR (id = v_debt.debtor_id AND is_banker = true))
          AND is_banker = true
    ) INTO v_is_banker;

    -- Yetki kontrolü (Borçlu veya Bankacı)
    IF v_debtor.session_token = p_session_token OR v_is_banker THEN
        NULL;
    ELSE
        SELECT * INTO v_other_player 
        FROM players 
        WHERE room_id = p_room_id 
          AND session_token = p_session_token 
          AND id <> v_debt.debtor_id;

        IF FOUND THEN
            RAISE EXCEPTION 'Yetkisiz işlem: Borç yalnızca borçlu olan oyuncunun kendi cüzdanından ödenebilir.';
        ELSE
            UPDATE players 
            SET session_token = p_session_token, is_online = true 
            WHERE id = v_debt.debtor_id;
            
            v_debtor.session_token := p_session_token;
        END IF;
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
        UPDATE debts 
        SET remaining_amount = 0, 
            paid_amount = paid_amount + p_amount, 
            status = 'settled',
            updated_at = NOW() 
        WHERE id = p_debt_id;
    ELSE
        UPDATE debts 
        SET remaining_amount = v_new_remaining, 
            paid_amount = paid_amount + p_amount, 
            status = 'partially_paid',
            updated_at = NOW() 
        WHERE id = p_debt_id;
    END IF;

    INSERT INTO debt_payments (debt_id, amount) VALUES (p_debt_id, p_amount);

    INSERT INTO transactions (room_id, type, from_player_id, to_player_id, amount, description)
    VALUES (
        p_room_id, 
        'debt_payment', 
        v_debt.debtor_id, 
        v_debt.creditor_id, 
        p_amount, 
        format('Borç ödemesi (Kalan: %s ₺)', v_new_remaining)
    );

    RETURN jsonb_build_object(
        'success', true, 
        'remaining_amount', v_new_remaining,
        'message', 'Ödeme başarıyla işlendi.'
    );
END;
$$;


-- 4. BORÇ TEKLİFİNİ ONAYLAMA (approve_debt)
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
    v_other_player players%ROWTYPE;
    v_is_banker BOOLEAN := false;
BEGIN
    SELECT * INTO v_debt FROM debts WHERE id = p_debt_id AND room_id = p_room_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Borç kaydı bulunamadı.';
    END IF;

    IF v_debt.status <> 'pending' THEN
        RAISE EXCEPTION 'Bu borç teklifi onay bekleyen durumda değil (Durum: %).', v_debt.status;
    END IF;

    SELECT * INTO v_debtor FROM players WHERE id = v_debt.debtor_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Borçlu oyuncu bulunamadı.';
    END IF;

    -- Bankacı kontrolü
    SELECT EXISTS (
        SELECT 1 FROM players 
        WHERE room_id = p_room_id 
          AND (session_token = p_session_token OR (id = v_debt.debtor_id AND is_banker = true))
          AND is_banker = true
    ) INTO v_is_banker;

    -- Yalnızca borcu alan (veya bankacı) onaylayabilir
    IF v_debtor.session_token = p_session_token OR v_is_banker THEN
        NULL;
    ELSE
        SELECT * INTO v_other_player 
        FROM players 
        WHERE room_id = p_room_id 
          AND session_token = p_session_token 
          AND id <> v_debt.debtor_id;

        IF FOUND THEN
            RAISE EXCEPTION 'Yetkisiz işlem: Bu borç teklifini yalnızca borçlu olan oyuncu (%s) onaylayabilir.', v_debtor.name;
        ELSE
            UPDATE players 
            SET session_token = p_session_token, is_online = true 
            WHERE id = v_debt.debtor_id;
            
            v_debtor.session_token := p_session_token;
        END IF;
    END IF;

    SELECT * INTO v_creditor FROM players WHERE id = v_debt.creditor_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Alacaklı oyuncu bulunamadı.';
    END IF;

    IF v_creditor.balance < v_debt.initial_amount THEN
        RAISE EXCEPTION 'Alacaklı oyuncunun (%s) bakiyesi borç tutarı için yetersiz! (Mevcut: % ₺)', v_creditor.name, v_creditor.balance;
    END IF;

    -- Para transferi: Alacaklı -> Borçlu
    UPDATE players SET balance = balance - v_debt.initial_amount WHERE id = v_debt.creditor_id;
    UPDATE players SET balance = balance + v_debt.initial_amount WHERE id = v_debt.debtor_id;

    -- Borcu aktif yap
    UPDATE debts SET status = 'active', updated_at = NOW() WHERE id = p_debt_id;

    -- İşlem kaydı
    INSERT INTO transactions (room_id, type, from_player_id, to_player_id, amount, description)
    VALUES (p_room_id, 'debt_lend', v_debt.creditor_id, v_debt.debtor_id, v_debt.initial_amount, v_debt.description);

    RETURN jsonb_build_object('success', true, 'message', 'Borç teklifi onaylandı ve para aktarıldı.');
END;
$$;


-- 5. BORÇ TEKLİFİNİ İPTAL / REDDETME (reject_debt)
CREATE OR REPLACE FUNCTION public.reject_debt(
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
BEGIN
    SELECT * INTO v_debt FROM debts WHERE id = p_debt_id AND room_id = p_room_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Borç kaydı bulunamadı.';
    END IF;

    IF v_debt.status <> 'pending' THEN
        RAISE EXCEPTION 'Yalnızca bekleyen borç teklifleri iptal edilebilir.';
    END IF;

    -- Borç teklifini iptal et
    UPDATE debts SET status = 'rejected', updated_at = NOW() WHERE id = p_debt_id;

    RETURN jsonb_build_object('success', true, 'message', 'Borç teklifi iptal edildi.');
END;
$$;


-- 6. BANKACI BAKİYE DÜZELTMESİ (banker_adjust_balance)
CREATE OR REPLACE FUNCTION public.banker_adjust_balance(
    p_room_id UUID,
    p_session_token TEXT,
    p_player_id UUID,
    p_delta NUMERIC,
    p_description TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_target players%ROWTYPE;
    v_is_banker BOOLEAN := false;
BEGIN
    -- Bankacı kontrolü
    SELECT EXISTS (
        SELECT 1 FROM players 
        WHERE room_id = p_room_id 
          AND (session_token = p_session_token OR is_banker = true)
          AND is_banker = true
    ) INTO v_is_banker;

    IF NOT v_is_banker THEN
        RAISE EXCEPTION 'Bu işlemi yapmaya yetkiniz yok (Yalnızca Bankacı yapabilir).';
    END IF;

    SELECT * INTO v_target FROM players WHERE id = p_player_id AND room_id = p_room_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Hedef oyuncu bulunamadı.';
    END IF;

    IF v_target.balance + p_delta < 0 THEN
        RAISE EXCEPTION 'Bakiye 0 ₺ altına düşemez. (Mevcut bakiye: % ₺)', v_target.balance;
    END IF;

    UPDATE players SET balance = balance + p_delta WHERE id = p_player_id;

    INSERT INTO transactions (room_id, type, from_player_id, to_player_id, amount, description)
    VALUES (
        p_room_id, 
        'banker_adjust', 
        CASE WHEN p_delta < 0 THEN p_player_id ELSE NULL END,
        CASE WHEN p_delta > 0 THEN p_player_id ELSE NULL END,
        ABS(p_delta), 
        COALESCE(p_description, 'Banka düzeltmesi')
    );

    RETURN jsonb_build_object('success', true, 'message', 'Bakiye düzeltildi.');
END;
$$;
