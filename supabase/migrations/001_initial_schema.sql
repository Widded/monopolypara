-- ==============================================================================
-- MONOPOLY İSTANBUL — PARA TAKİP UYGULAMASI VERİTABANI ŞEMASI
-- Supabase PostgreSQL + Realtime + RLS + Atomik İşlem Fonksiyonları
-- ==============================================================================

-- 1. UUID ve Gerekli Uzantılar
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Odalar Tablosu
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    banker_player_id UUID,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Oyuncular Tablosu
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    balance NUMERIC NOT NULL DEFAULT 1500 CHECK (balance >= 0),
    is_banker BOOLEAN NOT NULL DEFAULT false,
    session_token TEXT NOT NULL,
    recovery_pin TEXT NOT NULL DEFAULT LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_room_player_name UNIQUE (room_id, name)
);

-- Odalardaki banker referansını bağla
ALTER TABLE rooms 
ADD CONSTRAINT fk_rooms_banker 
FOREIGN KEY (banker_player_id) REFERENCES players(id) ON DELETE SET NULL;

-- 4. İşlem Geçmişi Tablosu
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('transfer', 'debt_lend', 'debt_payment', 'debt_settlement', 'banker_adjust')),
    from_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    to_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Borçlar Tablosu
CREATE TABLE IF NOT EXISTS debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    creditor_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE, -- Borç veren (Alacaklı)
    debtor_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,   -- Borç alan (Borçlu)
    initial_amount NUMERIC NOT NULL CHECK (initial_amount > 0),
    paid_amount NUMERIC NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    remaining_amount NUMERIC NOT NULL CHECK (remaining_amount >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'partially_paid', 'settled')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_diff_players CHECK (creditor_id <> debtor_id)
);

-- 6. Borç Ödemeleri Geçmişi
CREATE TABLE IF NOT EXISTS debt_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    remaining_after NUMERIC NOT NULL CHECK (remaining_after >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Anlaşmalı Borç Kapatma Geçmişi
CREATE TABLE IF NOT EXISTS debt_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    agreed_payment NUMERIC NOT NULL CHECK (agreed_payment >= 0),
    forgiven_amount NUMERIC NOT NULL CHECK (forgiven_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- İndeksler (Hızlı sorgulama için)
CREATE INDEX IF NOT EXISTS idx_players_room ON players(room_id);
CREATE INDEX IF NOT EXISTS idx_players_session ON players(session_token);
CREATE INDEX IF NOT EXISTS idx_transactions_room ON transactions(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_debts_room ON debts(room_id);
CREATE INDEX IF NOT EXISTS idx_debts_debtor ON debts(debtor_id);
CREATE INDEX IF NOT EXISTS idx_debts_creditor ON debts(creditor_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_settlements ENABLE ROW LEVEL SECURITY;

-- Okuma Politikaları (Herkese açık odalar için okuma izni)
CREATE POLICY "Public rooms are readable" ON rooms FOR SELECT USING (true);
CREATE POLICY "Players in rooms are readable" ON players FOR SELECT USING (true);
CREATE POLICY "Transactions in rooms are readable" ON transactions FOR SELECT USING (true);
CREATE POLICY "Debts are readable" ON debts FOR SELECT USING (true);
CREATE POLICY "Debt payments are readable" ON debt_payments FOR SELECT USING (true);
CREATE POLICY "Debt settlements are readable" ON debt_settlements FOR SELECT USING (true);

-- İstemciden doğrudan bakiye manipülasyonunu engelle; değişiklikler atomik RPC ile yapılır.
-- (Insert / Update işlemleri için SECURITY DEFINER fonksiyonları kullanılır)

-- ==============================================================================
-- SUPABASE REALTIME ETKİNLEŞTİRME
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE debts;
ALTER PUBLICATION supabase_realtime ADD TABLE debt_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE debt_settlements;

-- ==============================================================================
-- ATOMİK İŞLEM FONKSİYONLARI (RPCs)
-- ==============================================================================

-- 1. ODA VE BANKACI OLUŞTURMA
CREATE OR REPLACE FUNCTION create_room_with_banker(
    p_room_code TEXT,
    p_player_name TEXT,
    p_session_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_room_id UUID;
    v_player_id UUID;
    v_result JSONB;
BEGIN
    -- Odayı oluştur
    INSERT INTO rooms (code, status)
    VALUES (p_room_code, 'active')
    RETURNING id INTO v_room_id;

    -- Bankacı oyuncuyu oluştur (başlangıç bakiyesi 1.500 ₺)
    INSERT INTO players (room_id, name, balance, is_banker, session_token)
    VALUES (v_room_id, p_player_name, 1500, true, p_session_token)
    RETURNING id INTO v_player_id;

    -- Odanın bankacı referansını güncelle
    UPDATE rooms SET banker_player_id = v_player_id WHERE id = v_room_id;

    -- Oluşturulan veriyi döndür
    SELECT jsonb_build_object(
        'room', (SELECT row_to_json(r) FROM rooms r WHERE r.id = v_room_id),
        'player', (SELECT row_to_json(p) FROM players p WHERE p.id = v_player_id)
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- 2. ODAYA KATILMA
CREATE OR REPLACE FUNCTION join_room_player(
    p_room_code TEXT,
    p_player_name TEXT,
    p_session_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_room rooms%ROWTYPE;
    v_player players%ROWTYPE;
    v_result JSONB;
BEGIN
    -- Odayı bul
    SELECT * INTO v_room FROM rooms WHERE UPPER(code) = UPPER(p_room_code) AND status = 'active';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Oda bulunamadı veya kapalı.';
    END IF;

    -- Bu session token ile daha önce bu odada bir oyuncu var mı? (Oturum kurtarma)
    SELECT * INTO v_player FROM players WHERE room_id = v_room.id AND session_token = p_session_token;
    IF FOUND THEN
        SELECT jsonb_build_object(
            'room', row_to_json(v_room),
            'player', row_to_json(v_player)
        ) INTO v_result;
        RETURN v_result;
    END IF;

    -- Aynı isimde oyuncu var mı kontrol et
    SELECT * INTO v_player FROM players WHERE room_id = v_room.id AND LOWER(name) = LOWER(p_player_name);
    IF FOUND THEN
        RAISE EXCEPTION 'Bu isimde bir oyuncu zaten odada var. Lütfen farklı bir isim seçin.';
    END IF;

    -- Yeni oyuncuyu ekle (başlangıç bakiyesi 1.500 ₺)
    INSERT INTO players (room_id, name, balance, is_banker, session_token)
    VALUES (v_room.id, p_player_name, 1500, false, p_session_token)
    RETURNING * INTO v_player;

    SELECT jsonb_build_object(
        'room', row_to_json(v_room),
        'player', row_to_json(v_player)
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- 3. PARA TRANSFERİ (GÖNDEREN -> ALICI)
CREATE OR REPLACE FUNCTION transfer_money(
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

    -- Oturum yetkisini kontrol et (gönderen oyuncu veya bankacı yapabilir)
    IF v_sender.session_token <> p_session_token THEN
        -- Bankacı mı?
        IF NOT EXISTS (SELECT 1 FROM players WHERE room_id = p_room_id AND session_token = p_session_token AND is_banker = true) THEN
            RAISE EXCEPTION 'Bu işlem için yetkiniz yok.';
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

-- 4. BORÇ VERME
CREATE OR REPLACE FUNCTION lend_debt(
    p_room_id UUID,
    p_session_token TEXT,
    p_creditor_id UUID, -- Borç veren
    p_debtor_id UUID,   -- Borç alan
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
    v_debt_id UUID;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Borç tutarı sıfırdan büyük olmalıdır.';
    END IF;

    IF p_creditor_id = p_debtor_id THEN
        RAISE EXCEPTION 'Kendinize borç veremezsiniz.';
    END IF;

    -- Borç vereni doğrula ve kilitle
    SELECT * INTO v_creditor FROM players 
    WHERE id = p_creditor_id AND room_id = p_room_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Borç veren oyuncu bulunamadı.';
    END IF;

    -- Yetki kontrolü (kendi adına borç veriyor mu veya bankacı mı)
    IF v_creditor.session_token <> p_session_token THEN
        IF NOT EXISTS (SELECT 1 FROM players WHERE room_id = p_room_id AND session_token = p_session_token AND is_banker = true) THEN
            RAISE EXCEPTION 'Bu işlem için yetkiniz yok.';
        END IF;
    END IF;

    -- Borç verenin yeterli nakiti var mı?
    IF v_creditor.balance < p_amount THEN
        RAISE EXCEPTION 'Yetersiz nakit bakiye! Borç vermek için bakiyeniz: % ₺', v_creditor.balance;
    END IF;

    -- Borç alanı doğrula ve kilitle
    SELECT * INTO v_debtor FROM players 
    WHERE id = p_debtor_id AND room_id = p_room_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Borç alan oyuncu bulunamadı.';
    END IF;

    -- Nakit aktarımı yap
    UPDATE players SET balance = balance - p_amount WHERE id = p_creditor_id;
    UPDATE players SET balance = balance + p_amount WHERE id = p_debtor_id;

    -- Borç kaydı oluştur
    INSERT INTO debts (room_id, creditor_id, debtor_id, initial_amount, paid_amount, remaining_amount, status, description)
    VALUES (p_room_id, p_creditor_id, p_debtor_id, p_amount, 0, p_amount, 'active', p_description)
    RETURNING id INTO v_debt_id;

    -- İşlem kaydı oluştur
    INSERT INTO transactions (room_id, type, from_player_id, to_player_id, amount, description)
    VALUES (p_room_id, 'debt_lend', p_creditor_id, p_debtor_id, p_amount, p_description);

    RETURN jsonb_build_object('success', true, 'debt_id', v_debt_id);
END;
$$;

-- 5. KISMİ YA DA TAM BORÇ ÖDEME
CREATE OR REPLACE FUNCTION pay_debt(
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
    v_new_remaining NUMERIC;
    v_new_status TEXT;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Ödeme tutarı sıfırdan büyük olmalıdır.';
    END IF;

    -- Borcu kilitle
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

    -- Borçluyu doğrula ve kilitle
    SELECT * INTO v_debtor FROM players WHERE id = v_debt.debtor_id FOR UPDATE;

    -- Yetki kontrolü (ödeyen oyuncu veya bankacı)
    IF v_debtor.session_token <> p_session_token THEN
        IF NOT EXISTS (SELECT 1 FROM players WHERE room_id = p_room_id AND session_token = p_session_token AND is_banker = true) THEN
            RAISE EXCEPTION 'Bu borcu ödeme yetkiniz yok.';
        END IF;
    END IF;

    -- Borçlunun yeterli parası var mı?
    IF v_debtor.balance < p_amount THEN
        RAISE EXCEPTION 'Yetersiz bakiye! Ödeme için bakiyeniz: % ₺', v_debtor.balance;
    END IF;

    -- Nakit aktarımı: Borçlu -> Alacaklı
    UPDATE players SET balance = balance - p_amount WHERE id = v_debt.debtor_id;
    UPDATE players SET balance = balance + p_amount WHERE id = v_debt.creditor_id;

    -- Borç durumunu güncelle
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

    -- Ödeme detay kaydı
    INSERT INTO debt_payments (debt_id, amount, remaining_after)
    VALUES (p_debt_id, p_amount, v_new_remaining);

    -- İşlem geçmişi kaydı
    INSERT INTO transactions (room_id, type, from_player_id, to_player_id, amount, description)
    VALUES (p_room_id, 'debt_payment', v_debt.debtor_id, v_debt.creditor_id, p_amount, 'Borç ödemesi');

    RETURN jsonb_build_object('success', true, 'remaining_amount', v_new_remaining);
END;
$$;

-- 6. ANLAŞMALI BORÇ KAPATMA (HAIRCUT / SETTLEMENT)
CREATE OR REPLACE FUNCTION settle_debt(
    p_room_id UUID,
    p_session_token TEXT,
    p_debt_id UUID,
    p_agreed_payment NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_debt debts%ROWTYPE;
    v_debtor players%ROWTYPE;
    v_creditor players%ROWTYPE;
    v_forgiven NUMERIC;
BEGIN
    IF p_agreed_payment < 0 THEN
        RAISE EXCEPTION 'Anlaşılan ödeme tutarı negatif olamaz.';
    END IF;

    -- Borcu kilitle
    SELECT * INTO v_debt FROM debts WHERE id = p_debt_id AND room_id = p_room_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Borç kaydı bulunamadı.';
    END IF;

    IF v_debt.status = 'settled' OR v_debt.remaining_amount <= 0 THEN
        RAISE EXCEPTION 'Bu borç zaten kapatılmış.';
    END IF;

    IF p_agreed_payment > v_debt.remaining_amount THEN
        RAISE EXCEPTION 'Anlaşılan tutar kalan borçtan fazla olamaz.';
    END IF;

    v_forgiven := v_debt.remaining_amount - p_agreed_payment;

    -- Borçlu ve Alacaklıyı doğrula
    SELECT * INTO v_debtor FROM players WHERE id = v_debt.debtor_id FOR UPDATE;
    SELECT * INTO v_creditor FROM players WHERE id = v_debt.creditor_id FOR UPDATE;

    -- Yetki kontrolü (taraflardan biri veya bankacı)
    IF v_debtor.session_token <> p_session_token AND v_creditor.session_token <> p_session_token THEN
        IF NOT EXISTS (SELECT 1 FROM players WHERE room_id = p_room_id AND session_token = p_session_token AND is_banker = true) THEN
            RAISE EXCEPTION 'Bu işlemi yapmaya yetkiniz yok.';
        END IF;
    END IF;

    -- Eğer ödeme yapılacaksa borçlunun bakiyesi yetiyor mu?
    IF p_agreed_payment > 0 THEN
        IF v_debtor.balance < p_agreed_payment THEN
            RAISE EXCEPTION 'Borçlunun bakiyesi yetersiz (% ₺).', v_debtor.balance;
        END IF;

        -- Nakiti aktar
        UPDATE players SET balance = balance - p_agreed_payment WHERE id = v_debt.debtor_id;
        UPDATE players SET balance = balance + p_agreed_payment WHERE id = v_debt.creditor_id;
    END IF;

    -- Borcu tamamen kapatıldı olarak işaretle
    UPDATE debts 
    SET paid_amount = paid_amount + p_agreed_payment,
        remaining_amount = 0,
        status = 'settled',
        updated_at = now()
    WHERE id = p_debt_id;

    -- Anlaşmalı kapatma kaydı
    INSERT INTO debt_settlements (debt_id, agreed_payment, forgiven_amount)
    VALUES (p_debt_id, p_agreed_payment, v_forgiven);

    -- İşlem geçmişine kaydet
    INSERT INTO transactions (room_id, type, from_player_id, to_player_id, amount, description)
    VALUES (
        p_room_id, 
        'debt_settlement', 
        v_debt.debtor_id, 
        v_debt.creditor_id, 
        p_agreed_payment, 
        format('Anlaşmalı kapatma (Ödenen: %s ₺, Silinen: %s ₺)', p_agreed_payment, v_forgiven)
    );

    RETURN jsonb_build_object('success', true, 'forgiven_amount', v_forgiven);
END;
$$;

-- 7. BANKACI BAKİYE DÜZELTMESİ / PARA EKLEME VEYA DÜŞME
CREATE OR REPLACE FUNCTION banker_adjust_balance(
    p_room_id UUID,
    p_session_token TEXT,
    p_player_id UUID,
    p_amount_delta NUMERIC,
    p_description TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_player players%ROWTYPE;
    v_new_balance NUMERIC;
BEGIN
    IF p_amount_delta = 0 THEN
        RAISE EXCEPTION 'Değişiklik tutarı 0 olamaz.';
    END IF;

    -- Bankacı yetkisini doğrula
    IF NOT EXISTS (
        SELECT 1 FROM players 
        WHERE room_id = p_room_id AND session_token = p_session_token AND is_banker = true
    ) THEN
        RAISE EXCEPTION 'Yalnızca oda sahibi / bankacı bakiye düzeltmesi yapabilir.';
    END IF;

    -- Oyuncuyu kilitle
    SELECT * INTO v_player FROM players WHERE id = p_player_id AND room_id = p_room_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Oyuncu bulunamadı.';
    END IF;

    v_new_balance := v_player.balance + p_amount_delta;
    IF v_new_balance < 0 THEN
        RAISE EXCEPTION 'Oyuncu bakiyesi sıfırın altına düşemez. (Mevcut: % ₺)', v_player.balance;
    END IF;

    -- Güncelle
    UPDATE players SET balance = v_new_balance WHERE id = p_player_id;

    -- İşlem geçmişine bankacı kaydı olarak ekle
    IF p_amount_delta > 0 THEN
        INSERT INTO transactions (room_id, type, from_player_id, to_player_id, amount, description)
        VALUES (p_room_id, 'banker_adjust', NULL, p_player_id, p_amount_delta, p_description);
    ELSE
        INSERT INTO transactions (room_id, type, from_player_id, to_player_id, amount, description)
        VALUES (p_room_id, 'banker_adjust', p_player_id, NULL, ABS(p_amount_delta), p_description);
    END IF;

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- 8. KURTARMA KODUYLA OYUNA GERİ BAĞLANMA (ODADAN ÇIKAN VEYA OTURUMU KAYBEDEN OYUNCU)
CREATE OR REPLACE FUNCTION reconnect_player_with_pin(
    p_room_code TEXT,
    p_pin TEXT,
    p_session_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_room rooms%ROWTYPE;
    v_player players%ROWTYPE;
    v_result JSONB;
BEGIN
    SELECT * INTO v_room FROM rooms WHERE UPPER(code) = UPPER(p_room_code) AND status = 'active';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Oda bulunamadı veya kapatılmış.';
    END IF;

    SELECT * INTO v_player FROM players WHERE room_id = v_room.id AND recovery_pin = p_pin;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bu kurtarma koduna sahip bir oyuncu bulunamadı. Lütfen odadakilerden kodunuzu teyit edin.';
    END IF;

    -- Oturum anahtarını bu yeni cihaza/tarayıcıya ata
    UPDATE players SET session_token = p_session_token WHERE id = v_player.id;
    v_player.session_token := p_session_token;

    SELECT jsonb_build_object(
        'room', row_to_json(v_room),
        'player', row_to_json(v_player)
    ) INTO v_result;

    RETURN v_result;
END;
$$;
