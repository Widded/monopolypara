import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Room, Player, Debt, Transaction, RoomState } from '../types';
import { generateRoomCode, getOrCreateSessionToken, savePlayerSessionToken } from '../utils/formatters';

// Legacy mockStorage temizliği - tüm veri %100 Supabase'te tutulur
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('monopoly_istanbul_data_v1');
  } catch {}
}

export const dataService = {
  isLiveSupabase(): boolean {
    return isSupabaseConfigured();
  },

  async createRoom(playerName: string): Promise<{ room: Room; player: Player }> {
    const sessionToken = getOrCreateSessionToken();
    const roomCode = generateRoomCode();

    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase veritabanı bağlantısı bulunamadı.');
    }

    const { data, error } = await supabase.rpc('create_room_with_banker', {
      p_room_code: roomCode,
      p_player_name: playerName.trim(),
      p_session_token: sessionToken,
    });

    if (error) {
      throw new Error(error.message || 'Oda oluşturulamadı.');
    }

    const room: Room = data.room;
    const player: Player = data.player;
    savePlayerSessionToken(player.id, player.session_token || sessionToken, room.id);

    return {
      room,
      player,
    };
  },

  async joinRoom(roomCode: string, playerName: string): Promise<{ room: Room; player: Player }> {
    const sessionToken = getOrCreateSessionToken();

    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase veritabanı bağlantısı bulunamadı.');
    }

    const cleanDigits = roomCode.replace(/\D/g, '');
    const normalizedCode = cleanDigits ? `WID-${cleanDigits}` : roomCode.trim().toUpperCase();
    const cleanName = playerName.trim();

    // Akıllı Kontrol: Kullanıcı isim yerine 4 haneli PIN yazdıysa, yeni oyuncu açmak yerine PIN ile geri bağla!
    if (/^\d{4}$/.test(cleanName)) {
      return this.reconnectWithPin(normalizedCode, cleanName);
    }

    const { data, error } = await supabase.rpc('join_room_player', {
      p_room_code: normalizedCode,
      p_player_name: cleanName,
      p_session_token: sessionToken,
    });

    if (error) {
      if (error.message && (error.message.includes('aynı isimde') || error.message.includes('zaten var'))) {
        throw new Error(`Masada "${playerName.trim()}" isminde bir oyuncu zaten var. Eğer bu sizseniz "Geri Dön (PIN)" sekmesinden PIN kodunuzla bağlanabilirsiniz.`);
      }
      throw new Error(error.message || 'Odaya katılınamadı.');
    }

    const room: Room = data.room;
    const player: Player = data.player;
    savePlayerSessionToken(player.id, player.session_token || sessionToken, room.id);

    return {
      room,
      player,
    };
  },

  async reconnectWithPin(roomCode: string, pin: string): Promise<{ room: Room; player: Player }> {
    const sessionToken = getOrCreateSessionToken();

    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase veritabanı bağlantısı bulunamadı.');
    }

    const cleanPin = pin.trim().replace(/\D/g, '').padStart(4, '0');
    const cleanDigits = roomCode.replace(/\D/g, '');
    const normalizedCode = cleanDigits ? `WID-${cleanDigits}` : roomCode.trim().toUpperCase();

    // 1. RPC çağrısı dene
    const { data, error } = await supabase.rpc('reconnect_player_with_pin', {
      p_room_code: normalizedCode,
      p_pin: cleanPin,
      p_session_token: sessionToken,
    });

    if (!error && data?.room && data?.player) {
      const room: Room = data.room;
      const player: Player = data.player;
      savePlayerSessionToken(player.id, player.session_token || sessionToken, room.id);
      return {
        room,
        player,
      };
    }

    // 2. İstemci tarafı doğrudan kurtarma yedeği (RPC henüz güncellenmemişse veya is_online hatası veriyorsa)
    try {
      let roomQuery = supabase.from('rooms').select('*');
      if (cleanDigits) {
        roomQuery = roomQuery.or(`code.eq.WID-${cleanDigits},code.eq.${cleanDigits},code.eq.${roomCode.trim().toUpperCase()}`);
      } else {
        roomQuery = roomQuery.eq('code', normalizedCode);
      }
      const { data: targetRoom } = await roomQuery.single();

      if (targetRoom) {
        const { data: targetPlayer } = await supabase
          .from('players')
          .select('*')
          .eq('room_id', targetRoom.id)
          .or(`recovery_pin.eq.${cleanPin},recovery_pin.eq.${cleanPin.replace(/^0+/, '')}`)
          .single();

        if (targetPlayer) {
          await supabase.from('players').update({ is_online: true, session_token: sessionToken }).eq('id', targetPlayer.id);
          savePlayerSessionToken(targetPlayer.id, sessionToken, targetRoom.id);
          return {
            room: targetRoom,
            player: {
              ...targetPlayer,
              session_token: sessionToken,
              is_online: true,
            },
          };
        }
      }
    } catch (fallbackErr) {
      console.warn('reconnect fallback error:', fallbackErr);
    }

    if (error) {
      throw new Error(error.message || 'Geri bağlanılamadı.');
    }
    throw new Error('Oyuncu bulunamadı. Lütfen oda kodunu ve PIN kodunuzu kontrol edin.');
  },

  async leaveRoom(roomId?: string, playerId?: string): Promise<void> {
    const sessionToken = getOrCreateSessionToken(playerId, roomId);
    if (!isSupabaseConfigured() || !supabase) return;

    try {
      if (playerId) {
        await supabase.rpc('leave_room_player', {
          p_player_id: playerId,
          p_session_token: sessionToken,
          p_room_id: roomId || null,
        });
        await supabase.from('players').update({ is_online: false }).eq('id', playerId);
      } else if (sessionToken) {
        await supabase.rpc('leave_room_player', {
          p_session_token: sessionToken,
          p_room_id: roomId || null,
        });
        await supabase.from('players').update({ is_online: false }).eq('session_token', sessionToken);
      }
    } catch (err) {
      console.warn('leaveRoom RPC failed, falling back:', err);
    }
  },

  async getRoomState(roomId: string): Promise<RoomState | null> {
    const sessionToken = getOrCreateSessionToken(undefined, roomId);

    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase bağlantısı bulunamadı.');
    }

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return null;
    }

    // Fetch players, debts, and transactions in parallel for maximum performance
    const [playersRes, debtsRes, txRes] = await Promise.all([
      supabase.from('players').select('*').eq('room_id', roomId).order('created_at', { ascending: true }),
      supabase.from('debts').select('*').eq('room_id', roomId).order('created_at', { ascending: false }),
      supabase.from('transactions').select('*').eq('room_id', roomId).order('created_at', { ascending: false }).limit(60),
    ]);

    if (playersRes.data) {
      const playersList: Player[] = playersRes.data || [];
      const debtsList: Debt[] = debtsRes.data || [];
      const txList: Transaction[] = txRes.data || [];

      // Compute receivables and debts for each player
      const populatedPlayers = playersList.map(p => {
        const total_receivable = debtsList
          .filter(d => d.creditor_id === p.id && (d.status === 'active' || d.status === 'partially_paid'))
          .reduce((sum, d) => sum + Number(d.remaining_amount), 0);

        const total_debt = debtsList
          .filter(d => d.debtor_id === p.id && (d.status === 'active' || d.status === 'partially_paid'))
          .reduce((sum, d) => sum + Number(d.remaining_amount), 0);

        const isCurrent = p.session_token === sessionToken;
        return {
          ...p,
          balance: Number(p.balance),
          total_receivable,
          total_debt,
          recovery_pin: p.recovery_pin,
          is_online: p.is_online !== false,
          is_bankrupt: p.is_bankrupt === true,
          session_token: isCurrent ? p.session_token : '',
        };
      });

      const populatedDebts = debtsList.map(d => ({
        ...d,
        initial_amount: Number(d.initial_amount),
        paid_amount: Number(d.paid_amount),
        remaining_amount: Number(d.remaining_amount),
        creditor_name: playersList.find(p => p.id === d.creditor_id)?.name || 'Bilinmeyen',
        debtor_name: playersList.find(p => p.id === d.debtor_id)?.name || 'Bilinmeyen',
      }));

      const populatedTransactions = txList.map(t => ({
        ...t,
        amount: Number(t.amount),
        from_player_name: t.from_player_id ? (playersList.find(p => p.id === t.from_player_id)?.name || 'Oyuncu') : 'Banka',
        to_player_name: t.to_player_id ? (playersList.find(p => p.id === t.to_player_id)?.name || 'Oyuncu') : 'Banka',
      }));

      const activePlayerId = typeof window !== 'undefined' ? localStorage.getItem('monopoly_active_player_id') : null;

      // 1. Session token ile doğrudan eşleşen oyuncu
      let currentPlayer = populatedPlayers.find(p => p.session_token === sessionToken);

      // 2. Eğer session token doğrudan eşleşmedi ama kayıtlı playerId varsa ve odadaysa
      if (!currentPlayer && activePlayerId) {
        const found = populatedPlayers.find(p => p.id === activePlayerId);
        if (found) {
          currentPlayer = found;
          // Oturum anahtarını bu oyuncuyla senkronize et
          if (found.session_token) {
            savePlayerSessionToken(found.id, found.session_token, room.id);
          } else {
            savePlayerSessionToken(found.id, sessionToken, room.id);
            try {
              supabase.from('players').update({ session_token: sessionToken, is_online: true }).eq('id', found.id);
            } catch {}
          }
        }
      } else if (currentPlayer) {
        savePlayerSessionToken(currentPlayer.id, sessionToken, room.id);
      }

      // CRITICAL: Eğer bu cihazdaki kullanıcı bu odada geçerli bir oyuncu değilse,
      // ASLA bankacının (veya 0. oyuncunun) yerine sokma! null döndür ki login ekranına dönsün.
      if (!currentPlayer) {
        return null;
      }

      return {
        room,
        currentPlayer,
        players: populatedPlayers,
        debts: populatedDebts,
        transactions: populatedTransactions,
      };
    }

    return null;
  },

  subscribeToRoom(roomId: string, onChange: () => void): () => void {
    if (!isSupabaseConfigured() || !supabase) {
      return () => {};
    }

    let isSubscribed = true;

    const channel = supabase
      .channel(`monopoly_room_realtime_${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        () => { if (isSubscribed) onChange(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
        () => { if (isSubscribed) onChange(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'debts', filter: `room_id=eq.${roomId}` },
        () => { if (isSubscribed) onChange(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `room_id=eq.${roomId}` },
        () => { if (isSubscribed) onChange(); }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          onChange();
        }
      });

    return () => {
      isSubscribed = false;
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  },

  ensureConnection(): void {
    if (isSupabaseConfigured() && supabase) {
      try {
        const state = supabase.realtime.connectionState();
        if (state !== 'open' && state !== 'connecting') {
          supabase.realtime.connect();
        }
      } catch (err) {
        console.warn('Realtime reconnect failed:', err);
      }
    }
  },

  async transferMoney(roomId: string, fromId: string, toId: string, amount: number, description?: string): Promise<void> {
    const sessionToken = getOrCreateSessionToken(fromId, roomId);

    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase bağlantısı bulunamadı.');
    }

    const { error } = await supabase.rpc('transfer_money', {
      p_room_id: roomId,
      p_session_token: sessionToken,
      p_from_player_id: fromId,
      p_to_player_id: toId,
      p_amount: amount,
      p_description: description || null,
    });

    if (error) {
      throw new Error(error.message || 'Transfer başarısız.');
    }
  },

  async lendDebt(roomId: string, creditorId: string, debtorId: string, amount: number, description?: string): Promise<void> {
    const sessionToken = getOrCreateSessionToken(creditorId, roomId);

    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase bağlantısı bulunamadı.');
    }

    const { error } = await supabase.rpc('lend_debt', {
      p_room_id: roomId,
      p_session_token: sessionToken,
      p_creditor_id: creditorId,
      p_debtor_id: debtorId,
      p_amount: amount,
      p_description: description || null,
    });

    if (error) {
      throw new Error(error.message || 'Borç verme başarısız.');
    }
  },

  async approveDebt(roomId: string, debtId: string): Promise<void> {
    const sessionToken = getOrCreateSessionToken(undefined, roomId);

    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase bağlantısı bulunamadı.');
    }

    const { error } = await supabase.rpc('approve_debt', {
      p_room_id: roomId,
      p_session_token: sessionToken,
      p_debt_id: debtId,
    });

    if (error) {
      throw new Error(error.message || 'Borç onaylama başarısız.');
    }
  },

  async rejectDebt(roomId: string, debtId: string): Promise<void> {
    const sessionToken = getOrCreateSessionToken(undefined, roomId);

    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase bağlantısı bulunamadı.');
    }

    const { error } = await supabase.rpc('reject_debt', {
      p_room_id: roomId,
      p_session_token: sessionToken,
      p_debt_id: debtId,
    });

    if (error) {
      throw new Error(error.message || 'Borç iptal/reddetme başarısız.');
    }
  },

  async payDebt(roomId: string, debtId: string, amount: number): Promise<void> {
    const sessionToken = getOrCreateSessionToken(undefined, roomId);

    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase bağlantısı bulunamadı.');
    }

    const { error } = await supabase.rpc('pay_debt', {
      p_room_id: roomId,
      p_session_token: sessionToken,
      p_debt_id: debtId,
      p_amount: amount,
    });

    if (error) {
      throw new Error(error.message || 'Borç ödemesi başarısız.');
    }
  },

  async settleDebt(roomId: string, debtId: string, agreedPayment: number): Promise<void> {
    const sessionToken = getOrCreateSessionToken(undefined, roomId);

    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase bağlantısı bulunamadı.');
    }

    const { error } = await supabase.rpc('settle_debt', {
      p_room_id: roomId,
      p_session_token: sessionToken,
      p_debt_id: debtId,
      p_agreed_payment: agreedPayment,
    });

    if (error) {
      throw new Error(error.message || 'Anlaşmalı kapatma başarısız.');
    }
  },

  async bankerAdjust(roomId: string, playerId: string, amountDelta: number, description: string): Promise<void> {
    const sessionToken = getOrCreateSessionToken(undefined, roomId);

    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase bağlantısı bulunamadı.');
    }

    const { error } = await supabase.rpc('banker_adjust_balance', {
      p_room_id: roomId,
      p_session_token: sessionToken,
      p_player_id: playerId,
      p_amount_delta: amountDelta,
      p_description: description,
    });

    if (error) {
      throw new Error(error.message || 'Bakiye düzeltmesi başarısız.');
    }
  },

  async getDebtDetails(debtId: string) {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }

    const { data: debt } = await supabase.from('debts').select('*').eq('id', debtId).single();
    const { data: payments } = await supabase
      .from('debt_payments')
      .select('*')
      .eq('debt_id', debtId)
      .order('created_at', { ascending: false });

    const { data: settlements } = await supabase
      .from('debt_settlements')
      .select('*')
      .eq('debt_id', debtId)
      .limit(1);

    if (!debt) return null;

    const { data: players } = await supabase.from('players').select('id, name');
    const playerMap = new Map((players || []).map(p => [p.id, p.name]));

    return {
      debt: {
        ...debt,
        creditor_name: playerMap.get(debt.creditor_id) || 'Bilinmeyen',
        debtor_name: playerMap.get(debt.debtor_id) || 'Bilinmeyen',
      },
      payments: payments || [],
      settlement: settlements && settlements.length > 0 ? settlements[0] : null,
    };
  },

  async payToBank(roomId: string, amount: number, description?: string): Promise<void> {
    const sessionToken = getOrCreateSessionToken(undefined, roomId);
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase bağlantısı bulunamadı.');
    }

    const { error } = await supabase.rpc('pay_to_bank', {
      p_room_id: roomId,
      p_session_token: sessionToken,
      p_amount: amount,
      p_description: description || 'Bankaya Ödeme',
    });

    if (error) {
      throw new Error(error.message || 'Bankaya ödeme yapılamadı.');
    }
  },

  async declareBankruptcy(roomId: string, beneficiaryId?: string | null): Promise<void> {
    const sessionToken = getOrCreateSessionToken(undefined, roomId);
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase bağlantısı bulunamadı.');
    }

    const { error } = await supabase.rpc('declare_bankruptcy', {
      p_room_id: roomId,
      p_session_token: sessionToken,
      p_beneficiary_id: beneficiaryId || null,
    });

    if (error) {
      throw new Error(error.message || 'İflas işlemi gerçekleştirilemedi.');
    }
  },

  async reverseTransaction(roomId: string, transactionId: string): Promise<void> {
    const sessionToken = getOrCreateSessionToken(undefined, roomId);
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase bağlantısı bulunamadı.');
    }

    const { error } = await supabase.rpc('reverse_transaction', {
      p_room_id: roomId,
      p_session_token: sessionToken,
      p_transaction_id: transactionId,
    });

    if (error) {
      throw new Error(error.message || 'İşlem geri alınamadı.');
    }
  },

  async endGame(roomId: string, status: 'active' | 'ended' = 'ended'): Promise<void> {
    const sessionToken = getOrCreateSessionToken(undefined, roomId);
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase bağlantısı bulunamadı.');
    }

    const { error } = await supabase.rpc('end_room_game', {
      p_room_id: roomId,
      p_session_token: sessionToken,
      p_status: status,
    });

    if (error) {
      throw new Error(error.message || 'Oyun durumu güncellenemedi.');
    }
  }
};
