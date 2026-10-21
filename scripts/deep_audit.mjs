// scripts/deep_audit.mjs
// Comprehensive test suite & logic audit for Monopoly Para Takibi
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://spnorrpqygvbuozbxbrq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbm9ycnBxeWd2YnVvemJ4YnJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1OTE3NTcsImV4cCI6MjEwODE2Nzc1N30.1ZJZqxLzlwOcCZc23YQud7plIBi_ePQu350WOva6Pbw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runAudit() {
  console.log('=== MONOPOLY GENEL MANTIK & EKSİK DENETİMİ (AUDIT) BAŞLADI ===\n');
  const findings = [];

  const testRoomCode = 'AUDIT-' + Math.floor(1000 + Math.random() * 9000);
  const tokenBanker = 'sess_audit_banker_' + Date.now();
  const tokenPlayer2 = 'sess_audit_p2_' + Date.now();
  const tokenPlayer3 = 'sess_audit_p3_' + Date.now();

  try {
    // 1. ODA OLUŞTURMA
    const createRes = await supabase.rpc('create_room_with_banker', {
      p_room_code: testRoomCode,
      p_player_name: 'AuditBanker',
      p_session_token: tokenBanker
    });
    if (createRes.error) throw new Error('Create room failed: ' + createRes.error.message);
    const room = createRes.data.room;
    const banker = createRes.data.player;
    console.log(`✓ Test Odası Açıldı: ${room.code} (ID: ${room.id})`);

    // 2. İKİNCİ & ÜÇÜNCÜ OYUNCU KATILIMI
    const p2Res = await supabase.rpc('join_room_player', {
      p_room_code: testRoomCode,
      p_player_name: 'AuditAli',
      p_session_token: tokenPlayer2
    });
    const ali = p2Res.data.player;
    console.log(`✓ Ali Katıldı (PIN: ${ali.recovery_pin})`);

    const p3Res = await supabase.rpc('join_room_player', {
      p_room_code: testRoomCode,
      p_player_name: 'AuditVeli',
      p_session_token: tokenPlayer3
    });
    const veli = p3Res.data.player;
    console.log(`✓ Veli Katıldı (PIN: ${veli.recovery_pin})`);

    // TEST A: KENDİNE PARA TRANSFERİ
    const selfTransferRes = await supabase.rpc('transfer_money', {
      p_room_id: room.id,
      p_session_token: tokenPlayer2,
      p_from_player_id: ali.id,
      p_to_player_id: ali.id,
      p_amount: 100,
      p_description: 'Kendine transfer'
    });
    if (!selfTransferRes.error) {
      findings.push({
        type: 'LOGIC_FLAW',
        title: 'Kendine Para Transferi Yapılabiliyor',
        desc: 'Veritabanı RPC seviyesinde from_player_id == to_player_id kontrolü yok. Oyuncu kendine para gönderebiliyor ve bu işlem geçmişine boş yere kayıt düşüyor.'
      });
      console.log('⚠️ BULGU: Kendine para transferi engellenmiyor!');
    } else {
      console.log('✓ Kendine para transferi engellendi.');
    }

    // TEST B: NEGATİF / SIFIR TRANSFER
    const negTransferRes = await supabase.rpc('transfer_money', {
      p_room_id: room.id,
      p_session_token: tokenPlayer2,
      p_from_player_id: ali.id,
      p_to_player_id: veli.id,
      p_amount: -50,
      p_description: 'Negatif transfer'
    });
    if (!negTransferRes.error) {
      findings.push({
        type: 'SECURITY_BUG',
        title: 'Negatif Para Transferi Yapılabiliyor',
        desc: 'Negatif tutar gönderildiğinde karşı tarafın bakiyesi azalabilir veya hile yapılabilir.'
      });
      console.log('⚠️ BULGU: Negatif transfer engellenmedi!');
    } else {
      console.log('✓ Negatif transfer başarıyla engellendi.');
    }

    // TEST C: YETERSİZ BAKİYE TRANSFERİ
    const overTransferRes = await supabase.rpc('transfer_money', {
      p_room_id: room.id,
      p_session_token: tokenPlayer2,
      p_from_player_id: ali.id,
      p_to_player_id: veli.id,
      p_amount: 999999,
      p_description: 'Bakiye aşımı'
    });
    if (!overTransferRes.error) {
      findings.push({
        type: 'BALANCE_BUG',
        title: 'Yetersiz Bakiye ile Para Transferi Yapılabiliyor',
        desc: 'Oyuncu elinde olmayan parayı transfer edebiliyor.'
      });
      console.log('⚠️ BULGU: Yetersiz bakiye engellenmedi!');
    } else {
      console.log('✓ Yetersiz bakiye transferi engellendi.');
    }

    // TEST D: KENDİ KENDİNE BORÇ VERME
    const selfDebtRes = await supabase.rpc('lend_debt', {
      p_room_id: room.id,
      p_session_token: tokenPlayer2,
      p_creditor_id: ali.id,
      p_debtor_id: ali.id,
      p_amount: 200,
      p_description: 'Kendine borç'
    });
    if (!selfDebtRes.error) {
      findings.push({
        type: 'LOGIC_FLAW',
        title: 'Kendine Borç Verme Kaydı Açılabiliyor',
        desc: 'Veritabanında alacaklı ile borçlunun aynı kişi olması engellenmemiş.'
      });
      console.log('⚠️ BULGU: Kendine borç kaydı açılabiliyor!');
    } else {
      console.log('✓ Kendine borç verme engellendi.');
    }

    // TEST E: BAŞKASININ BORCUNU ONAYLAMA
    // Ali Veli'ye 300 TL borç teklif ediyor
    const lendRes = await supabase.rpc('lend_debt', {
      p_room_id: room.id,
      p_session_token: tokenPlayer2,
      p_creditor_id: ali.id,
      p_debtor_id: veli.id,
      p_amount: 300,
      p_description: 'Kira borcu'
    });
    const debtId = lendRes.data?.debt?.id || lendRes.data?.id;

    // Şimdi Banker (üçüncü şahıs) Veli adına bu borcu onaylamaya çalışıyor
    const hijackApproveRes = await supabase.rpc('approve_debt', {
      p_room_id: room.id,
      p_session_token: tokenBanker,
      p_debt_id: debtId
    });
    if (!hijackApproveRes.error) {
      findings.push({
        type: 'AUTH_LEAK',
        title: 'Borcu Borçlu Dışında Başka Biri Onaylayabiliyor',
        desc: 'approve_debt fonksiyonu session_token ile debtor_id eşleşmesini denetlemiyor olabilir.'
      });
      console.log('⚠️ BULGU: Borcu borçlu olmayan üçüncü şahıs onaylayabildi!');
    } else {
      console.log('✓ Üçüncü şahsın borç onaylaması engellendi.');
    }

    // TEST F: AKTİF OTURUMDAKİ OYUNCUNUN PIN'İYLE BAĞLANMA
    const stealPinRes = await supabase.rpc('reconnect_player_with_pin', {
      p_room_code: testRoomCode,
      p_pin: veli.recovery_pin,
      p_session_token: 'sess_hacker_' + Date.now()
    });
    if (!stealPinRes.error) {
      findings.push({
        type: 'SECURITY_PIN',
        title: 'Aktif Masadaki Oyuncunun Hesabı PIN ile Çalınabiliyor',
        desc: 'Oyuncu çıkış yapmamışken başka cihaz aynı PIN ile giriş yapabildi.'
      });
      console.log('⚠️ BULGU: Aktif oturumdaki oyuncunun PIN ile devralınması engellenemedi!');
    } else {
      console.log('✓ Aktif oturumdaki oyuncunun PIN ile devralınması başarıyla engellendi.');
    }

    // TEST G: ÇIKIŞ YAPILINCA PIN İLE BAĞLANMA
    // Veli çıkış yapıyor
    const leaveRes = await supabase.rpc('leave_room_player', {
      p_room_id: room.id,
      p_session_token: tokenPlayer3,
      p_player_id: veli.id
    });
    console.log('✓ Veli çıkış yaptı:', leaveRes.data);

    // Veli çıkış yaptıktan sonra PIN ile giriş deneniyor
    const legitPinRes = await supabase.rpc('reconnect_player_with_pin', {
      p_room_code: testRoomCode,
      p_pin: veli.recovery_pin,
      p_session_token: 'sess_new_device_' + Date.now()
    });
    if (legitPinRes.error) {
      findings.push({
        type: 'PIN_FAILURE',
        title: 'Çıkış Yapan Oyuncu PIN ile Geri Dönemedi',
        desc: 'Oyuncu çıkış yapmasına rağmen PIN ile odaya geri bağlanamadı: ' + legitPinRes.error.message
      });
      console.log('⚠️ BULGU: Çıkış yapan oyuncu PIN ile geri dönemedi!');
    } else {
      console.log('✓ Çıkış yapan Veli yeni cihazdan PIN ile başarıyla geri bağlandı!');
    }

    // TEST H: BANKACI ODADAN ÇIKINCA ODA SAHİPSİZ KALIYOR MU?
    const bankerLeaveRes = await supabase.rpc('leave_room_player', {
      p_room_id: room.id,
      p_session_token: tokenBanker,
      p_player_id: banker.id
    });
    const { data: activePlayersInRoom } = await supabase
      .from('players')
      .select('name, is_banker, is_online')
      .eq('room_id', room.id)
      .eq('is_online', true);

    const hasActiveBanker = activePlayersInRoom.some(p => p.is_banker);
    if (!hasActiveBanker) {
      findings.push({
        type: 'GAMEPLAY_ISSUE',
        title: 'Bankacı Çıkınca Masada Bankacı Kalmıyor (Oda Kilitleniyor)',
        desc: 'Odayı kuran Bankacı çıkış yaptığında odadaki diğer oyuncular arasında yeni bir Bankacı atanmıyor. Kimse başlangıç maaşını (+200 ₺) dağıtamıyor veya banka paneline erişemiyor.'
      });
      console.log('⚠️ BULGU: Bankacı çıkınca odada aktif bankacı kalmıyor!');
    } else {
      console.log('✓ Bankacı çıkınca yeni bankacı devredildi.');
    }

  } catch (err) {
    console.error('Audit execution error:', err);
  }

  console.log('\n=== DENETİM TAMAMLANDI ===');
  console.log('Tespit Edilen Maddeler:', JSON.stringify(findings, null, 2));
}

runAudit();
