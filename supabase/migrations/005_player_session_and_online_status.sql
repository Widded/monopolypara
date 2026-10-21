-- ==============================================================================
-- 005_player_session_and_online_status.sql
-- 1. Oyuncunun aktif masada olup olmadığını belirten 'is_online' sütunu
-- 2. Çıkış yapınca oyuncuyu çevrimdışı işaretleyen 'leave_room_player' fonksiyonu
-- 3. Oyuncu aktif oturumdaysa başkasının PIN ile girişini engelleyen 'reconnect_player_with_pin'
-- 4. RLS güncelleme politikası
-- ==============================================================================

-- 1. is_online sütunu ekle (varsayılan true)
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT true;

-- 2. Players tablosuna update izni ver (güvenli durum güncellemeleri için)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'players' AND policyname = 'Players can update status'
  ) THEN
    CREATE POLICY "Players can update status" ON public.players 
    FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. Oyuncu çıkış yapınca is_online = false yapan fonksiyon
-- (Hem player_id, hem room UUID, hem Room Code, hem session_token destekler - asla hata vermez)
CREATE OR REPLACE FUNCTION public.leave_room_player(
    p_room_id TEXT DEFAULT NULL,
    p_session_token TEXT DEFAULT NULL,
    p_player_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_player_id UUID;
BEGIN
    -- 1. Öncelik: p_player_id verildiyse doğrudan kapat
    IF p_player_id IS NOT NULL THEN
        UPDATE players SET is_online = false WHERE id = p_player_id;
        RETURN jsonb_build_object('success', true, 'player_id', p_player_id);
    END IF;

    -- 2. session_token ile eşleşen oyuncuyu kapat
    IF p_session_token IS NOT NULL THEN
        SELECT id INTO v_player_id FROM players WHERE session_token = p_session_token LIMIT 1;
        IF v_player_id IS NOT NULL THEN
            UPDATE players SET is_online = false WHERE id = v_player_id;
            RETURN jsonb_build_object('success', true, 'player_id', v_player_id);
        END IF;
    END IF;

    -- 3. Room ID (veya Oda Kodu) ve session_token ile eşleşen oyuncuyu kapat
    IF p_room_id IS NOT NULL AND p_session_token IS NOT NULL THEN
        SELECT p.id INTO v_player_id 
        FROM players p
        JOIN rooms r ON r.id = p.room_id
        WHERE (r.id::TEXT = p_room_id OR UPPER(r.code) = UPPER(p_room_id))
          AND p.session_token = p_session_token
        LIMIT 1;

        IF v_player_id IS NOT NULL THEN
            UPDATE players SET is_online = false WHERE id = v_player_id;
            RETURN jsonb_build_object('success', true, 'player_id', v_player_id);
        END IF;
    END IF;

    RETURN jsonb_build_object('success', false);
END;
$$;

-- 4. PIN ile bağlanma fonksiyonu:
-- AKTİF OTURUMDAYSA BAŞKASI GİREMEZ! Sadece çıkış yapılmışsa girebilir.
CREATE OR REPLACE FUNCTION public.reconnect_player_with_pin(
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
        RAISE EXCEPTION 'Bu kurtarma koduna (PIN) sahip bir oyuncu bulunamadı.';
    END IF;

    -- KULLANICI AKTİF OTURUMDAYSA BAŞKASI GİREMEZ
    IF v_player.is_online = true AND v_player.session_token IS NOT NULL AND v_player.session_token != p_session_token THEN
        RAISE EXCEPTION '% şu anda masada aktif oturumda! Çıkış yapmadan başka cihazdan bu PIN ile giriş yapılamaz.', v_player.name;
    END IF;

    -- Masaya bağla ve is_online = true yap
    UPDATE players 
    SET is_online = true, 
        session_token = p_session_token 
    WHERE id = v_player.id;

    v_player.session_token := p_session_token;
    v_player.is_online := true;

    SELECT jsonb_build_object(
        'room', row_to_json(v_room),
        'player', row_to_json(v_player)
    ) INTO v_result;

    RETURN v_result;
END;
$$;
