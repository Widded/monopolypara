-- 010_fix_reconnect_pin_isolation.sql
-- Fixes PIN reconnect to strictly isolate player sessions and prevent cross-player session collision

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
    v_clean_code TEXT;
    v_clean_pin TEXT;
    v_result JSONB;
BEGIN
    v_clean_code := UPPER(TRIM(p_room_code));
    v_clean_pin := TRIM(p_pin);

    -- 1. Odayı bul (hem WID- ile, hem WID- olmadan eşleşir)
    SELECT * INTO v_room 
    FROM rooms 
    WHERE UPPER(code) = v_clean_code
       OR UPPER(code) = UPPER('WID-' || v_clean_code)
       OR UPPER(code) = UPPER(REPLACE(v_clean_code, 'WID-', ''))
       OR UPPER(REPLACE(code, 'WID-', '')) = UPPER(REPLACE(v_clean_code, 'WID-', ''))
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Oda bulunamadı. Lütfen oda kodunu kontrol edin.';
    END IF;

    -- 2. PIN ile oyuncuyu bul (4 haneli LPAD toleranslı)
    SELECT * INTO v_player 
    FROM players 
    WHERE room_id = v_room.id 
      AND (recovery_pin = v_clean_pin OR recovery_pin = LPAD(v_clean_pin, 4, '0'))
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bu odada % PIN koduna sahip bir oyuncu bulunamadı. Lütfen odadakilerden kodunuzu teyit edin.', v_clean_pin;
    END IF;

    -- 3. KRİTİK: Eğer aynı odada bu p_session_token'a sahip BAŞKA bir oyuncu varsa,
    -- onun token'ını hemen sıfırla ki iki oyuncu asla aynı token'ı paylaşmasın!
    UPDATE players 
    SET session_token = 'sess_old_' || substr(md5(random()::text), 1, 10)
    WHERE room_id = v_room.id 
      AND session_token = p_session_token 
      AND id != v_player.id;

    -- 4. PIN'i doğru giren oyuncunun oturumunu yeni cihaza bağla ve çevrimiçi yap
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

GRANT EXECUTE ON FUNCTION public.reconnect_player_with_pin(TEXT, TEXT, TEXT) TO anon, authenticated;
