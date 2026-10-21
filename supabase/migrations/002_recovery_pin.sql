-- ==============================================================================
-- GÜNCELLEME: OYUNCU KURTARMA KODU (PIN) VE GERİ BAĞLANMA
-- Daha önce 001_initial_schema.sql çalıştırdıysanız SADECE bu kodu çalıştırmanız yeterlidir.
-- ==============================================================================

-- 1. Oyuncular tablosuna 4 haneli kurtarma PIN kodu sütununu ekle
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS recovery_pin TEXT NOT NULL DEFAULT LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

-- 2. Kurtarma koduyla odaya ve bakiyesine geri bağlanma fonksiyonu
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
