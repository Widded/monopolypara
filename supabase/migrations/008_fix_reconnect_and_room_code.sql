-- ==============================================================================
-- 008_fix_reconnect_and_room_code.sql
-- 1. Tüm oyuncuların PIN kodlarını garantiye al (NULL olanları doldur)
-- 2. reconnect_player_with_pin fonksiyonunu esnet (WID- ön eki toleransı + PIN ile tam yetki)
-- 3. join_room_player fonksiyonuna WID- esnekliği ve net yönlendirme ekle
-- 4. create_room_with_banker fonksiyonuna PIN üretimini garantiye al
-- ==============================================================================

-- 1. NULL veya boş recovery_pin olan tüm mevcut oyunculara 4 haneli PIN ata
UPDATE public.players 
SET recovery_pin = LPAD(FLOOR(1000 + RANDOM() * 9000)::TEXT, 4, '0') 
WHERE recovery_pin IS NULL OR TRIM(recovery_pin) = '';

-- Yanlışlıkla PIN girilerek oluşturulmuş sahte 4 haneli isimli oyuncuları temizle
DELETE FROM public.players WHERE name ~ '^[0-9]{4}$';

-- 2. OYUNCU KURTARMA KODUYLA (PIN) GERİ BAĞLANMA
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

    -- Odayı bul (hem WID- ile, hem WID- olmadan eşleşir)
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

    -- PIN ile oyuncuyu bul (4 haneli LPAD toleranslı)
    SELECT * INTO v_player 
    FROM players 
    WHERE room_id = v_room.id 
      AND (recovery_pin = v_clean_pin OR recovery_pin = LPAD(v_clean_pin, 4, '0'))
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bu odada % PIN koduna sahip bir oyuncu bulunamadı. Lütfen odadakilerden kodunuzu teyit edin.', v_clean_pin;
    END IF;

    -- PIN doğru girildiğinde oturumu yeni cihaza devret ve çevrimiçi yap
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

-- 3. ODAYA YENİ OYUNCU KATILMA FONKSİYONU
CREATE OR REPLACE FUNCTION public.join_room_player(
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
    v_clean_code TEXT;
    v_clean_name TEXT;
    v_pin TEXT;
    v_result JSONB;
BEGIN
    v_clean_code := UPPER(TRIM(p_room_code));
    v_clean_name := TRIM(p_player_name);

    -- Odayı bul (WID- toleranslı)
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

    -- Eğer aynı session_token ile zaten bu odada bir oyuncu varsa, doğrudan onu döndür (sessiz kurtarma)
    SELECT * INTO v_player 
    FROM players 
    WHERE room_id = v_room.id AND session_token = p_session_token;

    IF FOUND THEN
        UPDATE players SET is_online = true WHERE id = v_player.id;
        v_player.is_online := true;
        SELECT jsonb_build_object(
            'room', row_to_json(v_room),
            'player', row_to_json(v_player)
        ) INTO v_result;
        RETURN v_result;
    END IF;

    -- Akıllı PIN Algılama: Kullanıcı isim alanına yanlışlıkla 4 haneli PIN yazdıysa
    IF v_clean_name ~ '^[0-9]{4}$' THEN
        SELECT * INTO v_player 
        FROM players 
        WHERE room_id = v_room.id 
          AND (recovery_pin = v_clean_name OR recovery_pin = LPAD(v_clean_name, 4, '0'))
        LIMIT 1;

        IF FOUND THEN
            -- Kullanıcının adı PIN olmasın, gerçek oyuncu hesabına geri bağlansın!
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
        ELSE
            RAISE EXCEPTION 'Oyuncu adı 4 haneli PIN olamaz. Masaya geri dönmek için "Geri Dön (PIN)" sekmesini kullanın.';
        END IF;
    END IF;

    -- Aynı isimde oyuncu var mı kontrol et
    SELECT * INTO v_player 
    FROM players 
    WHERE room_id = v_room.id AND LOWER(TRIM(name)) = LOWER(v_clean_name);

    IF FOUND THEN
        RAISE EXCEPTION 'Masada "%" adında bir oyuncu zaten var! Eğer bu sizseniz "Geri Dön (PIN)" sekmesinden PIN kodunuzla bağlanabilirsiniz.', v_clean_name;
    END IF;

    -- 4 haneli PIN üret
    v_pin := LPAD(FLOOR(1000 + RANDOM() * 9000)::TEXT, 4, '0');

    -- Yeni oyuncuyu ekle (başlangıç bakiyesi 1.500 ₺, is_online = true)
    INSERT INTO players (room_id, name, balance, is_banker, session_token, recovery_pin, is_online)
    VALUES (v_room.id, v_clean_name, 1500, false, p_session_token, v_pin, true)
    RETURNING * INTO v_player;

    SELECT jsonb_build_object(
        'room', row_to_json(v_room),
        'player', row_to_json(v_player)
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- 4. ODA VE BANKACI OLUŞTURMA FONKSİYONU
CREATE OR REPLACE FUNCTION public.create_room_with_banker(
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
    v_pin TEXT;
    v_result JSONB;
BEGIN
    -- Odayı oluştur
    INSERT INTO rooms (code, status)
    VALUES (UPPER(TRIM(p_room_code)), 'active')
    RETURNING id INTO v_room_id;

    -- 4 haneli PIN üret
    v_pin := LPAD(FLOOR(1000 + RANDOM() * 9000)::TEXT, 4, '0');

    -- Bankacı oyuncuyu oluştur (başlangıç bakiyesi 1.500 ₺, is_online = true)
    INSERT INTO players (room_id, name, balance, is_banker, session_token, recovery_pin, is_online)
    VALUES (v_room_id, TRIM(p_player_name), 1500, true, p_session_token, v_pin, true)
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

-- 5. RPC İzinlerini Aç
GRANT EXECUTE ON FUNCTION public.reconnect_player_with_pin(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.join_room_player(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_room_with_banker(TEXT, TEXT, TEXT) TO anon, authenticated;
