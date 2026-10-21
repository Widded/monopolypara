-- ==============================================================================
-- 007_bankruptcy_beneficiary_reversal_game_summary.sql
-- 1. İflas ederken kalan varlığın devredileceği alacaklı oyuncuyu / bankayı seçme
-- 2. Bankacının hatalı işlemi geri alması (reverse_transaction)
-- 3. Oyun sonu ve oda durumu yönetimi (end_room_game)
-- ==============================================================================

-- 1. transactions tablosuna is_reversed sütunu ve 'reversal' tipini ekle
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS is_reversed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('transfer', 'debt_lend', 'debt_payment', 'debt_settlement', 'banker_adjust', 'bank_payment', 'bankruptcy', 'reversal'));

-- 2. GELİŞMİŞ İFLAS ETME FONKSİYONU (Hedef Oyuncuya veya Bankaya İflas)
CREATE OR REPLACE FUNCTION public.declare_bankruptcy(
    p_room_id UUID,
    p_session_token TEXT,
    p_beneficiary_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_player players%ROWTYPE;
    v_beneficiary players%ROWTYPE;
    v_remaining_cash NUMERIC;
    v_desc TEXT;
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

    -- Hedef bir oyuncu seçilmişse (Örn: Tapusuna denk gelinen oyuncu)
    IF p_beneficiary_id IS NOT NULL THEN
        IF p_beneficiary_id = v_player.id THEN
            RAISE EXCEPTION 'Kendinize iflas edemezsiniz.';
        END IF;

        SELECT * INTO v_beneficiary 
        FROM players 
        WHERE id = p_beneficiary_id AND room_id = p_room_id 
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Varlığın aktarılacağı oyuncu bulunamadı.';
        END IF;

        IF v_beneficiary.is_bankrupt THEN
            RAISE EXCEPTION 'İflas etmiş bir oyuncuya varlık aktarılamaz.';
        END IF;

        -- Kalan tüm nakit hedef oyuncuya aktarılır
        IF v_remaining_cash > 0 THEN
            UPDATE players 
            SET balance = balance + v_remaining_cash 
            WHERE id = v_beneficiary.id;
        END IF;

        v_desc := v_player.name || ', ' || v_beneficiary.name || '''e iflas etti. Kalan tüm parası (' || v_remaining_cash || ' ₺) ' || v_beneficiary.name || '''e aktarıldı.';
        
        INSERT INTO transactions (room_id, type, from_player_id, to_player_id, amount, description)
        VALUES (p_room_id, 'bankruptcy', v_player.id, v_beneficiary.id, v_remaining_cash, v_desc);
    ELSE
        -- Bankaya İflas (Kalan para devlete/kasaya gider)
        v_desc := v_player.name || ' Bankaya iflas etti ve oyundan çekildi.';
        
        INSERT INTO transactions (room_id, type, from_player_id, to_player_id, amount, description)
        VALUES (p_room_id, 'bankruptcy', v_player.id, NULL, v_remaining_cash, v_desc);
    END IF;

    -- Borçlu olduğu tüm borçları kapat
    UPDATE debts 
    SET status = 'settled', 
        remaining_amount = 0, 
        description = COALESCE(description, '') || ' (İflas ile tasfiye edildi)',
        updated_at = now()
    WHERE debtor_id = v_player.id AND status IN ('active', 'partially_paid', 'pending');

    -- Alacaklı olduğu borçları kapat
    UPDATE debts 
    SET status = 'settled',
        remaining_amount = 0,
        description = COALESCE(description, '') || ' (Alacaklı iflas ettiği için silindi)',
        updated_at = now()
    WHERE creditor_id = v_player.id AND status IN ('active', 'partially_paid', 'pending');

    -- Oyuncuyu iflas etmiş ve çevrimdışı işaretle, bakiyesini 0 yap
    UPDATE players 
    SET balance = 0,
        is_bankrupt = true,
        is_online = false
    WHERE id = v_player.id;

    RETURN jsonb_build_object(
        'success', true, 
        'player_id', v_player.id,
        'transferred_amount', v_remaining_cash,
        'beneficiary_id', p_beneficiary_id
    );
END;
$$;

-- 3. BANKACI İŞLEM GERİ ALMA FONKSİYONU (reverse_transaction)
CREATE OR REPLACE FUNCTION public.reverse_transaction(
    p_room_id UUID,
    p_session_token TEXT,
    p_transaction_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_banker players%ROWTYPE;
    v_tx transactions%ROWTYPE;
    v_from_player players%ROWTYPE;
    v_to_player players%ROWTYPE;
BEGIN
    -- 1. İşlemi yapanın bankacı olduğunu doğrula
    SELECT * INTO v_banker 
    FROM players 
    WHERE room_id = p_room_id AND session_token = p_session_token AND is_banker = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bu işlemi yalnızca bankacı yetkisine sahip oyuncu geri alabilir.';
    END IF;

    -- 2. Geri alınacak işlemi kilitle
    SELECT * INTO v_tx 
    FROM transactions 
    WHERE id = p_transaction_id AND room_id = p_room_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'İşlem kaydı bulunamadı.';
    END IF;

    IF v_tx.is_reversed THEN
        RAISE EXCEPTION 'Bu işlem zaten daha önce geri alınmış.';
    END IF;

    IF v_tx.type NOT IN ('transfer', 'bank_payment', 'banker_adjust') THEN
        RAISE EXCEPTION 'Yalnızca normal para transferleri, banka ödemeleri ve bankacı düzeltmeleri geri alınabilir.';
    END IF;

    -- 3. İşlem tipine göre parayı tersine çevir
    IF v_tx.type = 'transfer' THEN
        -- Alıcı ve gönderen oyuncuları bul
        SELECT * INTO v_to_player FROM players WHERE id = v_tx.to_player_id FOR UPDATE;
        SELECT * INTO v_from_player FROM players WHERE id = v_tx.from_player_id FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'İlgili oyuncular bulunamadı.';
        END IF;

        IF v_to_player.balance < v_tx.amount THEN
            RAISE EXCEPTION 'Alıcının mevcut bakiyesi (% ₺) iade edilecek tutardan (% ₺) az olduğu için işlem geri alınamaz.', v_to_player.balance, v_tx.amount;
        END IF;

        -- Parayı alıcıdan düş, gönderene iade et
        UPDATE players SET balance = balance - v_tx.amount WHERE id = v_to_player.id;
        UPDATE players SET balance = balance + v_tx.amount WHERE id = v_from_player.id;

    ELSIF v_tx.type = 'bank_payment' THEN
        -- Bankaya ödeme yapılmıştı: Parayı oyuncuya iade et
        SELECT * INTO v_from_player FROM players WHERE id = v_tx.from_player_id FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Oyuncu bulunamadı.';
        END IF;

        UPDATE players SET balance = balance + v_tx.amount WHERE id = v_from_player.id;

    ELSIF v_tx.type = 'banker_adjust' THEN
        -- Bankacı düzeltmesi yapılmıştı
        IF v_tx.to_player_id IS NOT NULL THEN
            SELECT * INTO v_to_player FROM players WHERE id = v_tx.to_player_id FOR UPDATE;
            IF v_to_player.balance < v_tx.amount THEN
                RAISE EXCEPTION 'Oyuncunun bakiyesi yetersiz olduğu için düzeltme geri alınamaz.';
            END IF;
            UPDATE players SET balance = balance - v_tx.amount WHERE id = v_to_player.id;
        ELSIF v_tx.from_player_id IS NOT NULL THEN
            UPDATE players SET balance = balance + v_tx.amount WHERE id = v_tx.from_player_id;
        END IF;
    END IF;

    -- Orijinal işlemi 'geri alındı' olarak işaretle
    UPDATE transactions SET is_reversed = true WHERE id = v_tx.id;

    -- İptal işlemini yeni kayıt olarak ekle
    INSERT INTO transactions (room_id, type, from_player_id, to_player_id, amount, description, is_reversed)
    VALUES (
        p_room_id, 
        'reversal', 
        v_tx.to_player_id, 
        v_tx.from_player_id, 
        v_tx.amount, 
        'İptal: Bankacı işlemi geri aldı (' || COALESCE(v_tx.description, 'İşlem') || ' - ' || v_tx.amount || ' ₺ iade edildi)',
        false
    );

    RETURN jsonb_build_object(
        'success', true, 
        'reversed_transaction_id', v_tx.id,
        'amount', v_tx.amount
    );
END;
$$;

-- 4. ODA VE OYUN DURUMU GÜNCELLEME (end_room_game)
CREATE OR REPLACE FUNCTION public.end_room_game(
    p_room_id UUID,
    p_session_token TEXT,
    p_status TEXT DEFAULT 'ended'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_banker players%ROWTYPE;
BEGIN
    SELECT * INTO v_banker 
    FROM players 
    WHERE room_id = p_room_id AND session_token = p_session_token AND is_banker = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Yalnızca bankacı oyunu bitirebilir veya durumu değiştirebilir.';
    END IF;

    UPDATE rooms SET status = p_status WHERE id = p_room_id;

    RETURN jsonb_build_object('success', true, 'status', p_status);
END;
$$;
