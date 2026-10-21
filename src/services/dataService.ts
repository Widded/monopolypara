import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Room, Player, Debt, Transaction, RoomState } from '../types';
import { generateRoomCode, getOrCreateSessionToken } from '../utils/formatters';

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

    return {
      room: data.room,
      player: data.player,
    };
  },

  async joinRoom(roomCode: string, playerName: string): Promise<{ room: Room; player: Player }> {
    const sessionToken = getOrCreateSessionToken();

    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase veritabanı bağlantısı bulunamadı.');
    }

    const { data, error } = await supabase.rpc('join_room_player', {
      p_room_code: roomCode.trim().toUpperCase(),
      p_player_name: playerName.trim(),
      p_session_token: sessionToken,
    });

    if (error) {
      throw new Error(error.message || 'Odaya katılınamadı.');
    }

    return {
      room: data.room,
      player: data.player,
    };
  },

  async reconnectWithPin(roomCode: string, pin: string): Promise<{ room: Room; player: Player }> {
    const sessionToken = getOrCreateSessionToken();

    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase veritabanı bağlantısı bulunamadı.');
    }

    // Kullanıcı oturumdaysa başkası giremesin kontrolü
    try {
      const { data: targetPlayer } = await supabase
        .from('players')
        .select('id, name, is_online, session_token')
        .eq('recovery_pin', pin.trim())
        .maybeSingle();

      if (
        targetPlayer &&
        targetPlayer.is_online === true &&
        targetPlayer.session_token &&
        targetPlayer.session_token !== sessionToken
      ) {
        throw new Error(
          `'${targetPlayer.name}' şu anda oyunda aktif! Masadan çıkış yapmadan başka cihazdan bu PIN ile giriş yapılamaz.`
        );
      }
    } catch (err: any) {
      if (err.message && err.message.includes('aktif')) {
        throw err;
      }
    }

    const { data, error } = await supabase.rpc('reconnect_player_with_pin', {
      p_room_code: roomCode.trim().toUpperCase(),
      p_pin: pin.trim(),
      p_session_token: sessionToken,
    });

    if (error) {
      throw new Error(error.message || 'Kurtarma kodu ile geri bağlanılamadı.');
    }

    // Masaya tekrar bağlandığı için is_online = true yap
    try {
      await supabase.from('players').update({ is_online: true }).eq('id', data.player.id);
    } catch {}

    return {
      room: data.room,
      player: data.player,
    };
  },

  async leaveRoom(roomId?: string, playerId?: string): Promise<void> {
    const sessionToken = getOrCreateSessionToken();
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.rpc('leave_room_player', {
          p_player_id: playerId || null,
          p_room_id: roomId || null,
          p_session_token: sessionToken,
        });
      } catch (e) {
        console.warn('leave_room_player RPC call failed:', e);
      }

      // Güvenlik yedeği: Doğrudan ID ile de kapatmayı dene
      try {
        if (playerId) {
          await supabase.from('players').update({ is_online: false }).eq('id', playerId);
        } else if (sessionToken) {
          await supabase.from('players').update({ is_online: false }).eq('session_token', sessionToken);
        }
      } catch {}
    }
  },

  async getRoomState(roomId: string): Promise<RoomState | null> {
    const sessionToken = getOrCreateSessionToken();

    if (isSupabaseConfigured() && supabase) {
      // Odayı ID veya Kod ile bul
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
      let roomQuery = supabase.from('rooms').select('*');
      if (isUuid) {
        roomQuery = roomQuery.eq('id', roomId);
      } else {
        roomQuery = roomQuery.eq('code', roomId.trim().toUpperCase());
      }
      const roomRes = await roomQuery.maybeSingle();

      if (roomRes.error || !roomRes.data) return null;

      const room = roomRes.data;
      const actualRoomId = room.id;

      // Parallel fetch for lightning-fast response (1 roundtrip instead of 4)
      const [playersRes, debtsRes, txRes] = await Promise.all([
        supabase.from('players').select('*').eq('room_id', actualRoomId).order('created_at', { ascending: true }),
        supabase.from('debts').select('*').eq('room_id', actualRoomId).order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').eq('room_id', actualRoomId).order('created_at', { ascending: false }).limit(50),
      ]);

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
          // Kullanıcı isteği: PIN herkese görünür olsun
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

      const currentPlayer = populatedPlayers.find(p => p.session_token === sessionToken) || populatedPlayers[0];

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
    if (isSupabaseConfigured() && supabase) {
      const channelId = `room_live_${roomId.replace(/-/g, '')}_${Math.random().toString(36).substring(2, 6)}`;
      const channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'players' },
          (payload: any) => {
            if (!payload?.new?.room_id || payload.new.room_id === roomId || payload?.old?.room_id === roomId) {
              onChange();
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions' },
          (payload: any) => {
            if (!payload?.new?.room_id || payload.new.room_id === roomId || payload?.old?.room_id === roomId) {
              onChange();
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'debts' },
          (payload: any) => {
            if (!payload?.new?.room_id || payload.new.room_id === roomId || payload?.old?.room_id === roomId) {
              onChange();
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            onChange();
          }
        });

      return () => {
        supabase?.removeChannel(channel);
      };
    }

    return () => {};
  },

  ensureConnection(): void {
    if (isSupabaseConfigured() && supabase) {
      try {
        if (supabase.realtime && typeof supabase.realtime.connect === 'function') {
          supabase.realtime.connect();
        }
      } catch (err) {
        console.warn('Realtime reconnect failed:', err);
      }
    }
  },

  async transferMoney(roomId: string, fromId: string, toId: string, amount: number, description?: string): Promise<void> {
    const sessionToken = getOrCreateSessionToken();

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
    const sessionToken = getOrCreateSessionToken();

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
    const sessionToken = getOrCreateSessionToken();

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
    const sessionToken = getOrCreateSessionToken();

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
    const sessionToken = getOrCreateSessionToken();

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
    const sessionToken = getOrCreateSessionToken();

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
    const sessionToken = getOrCreateSessionToken();

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
    const sessionToken = getOrCreateSessionToken();
    if (!isSupabaseConfigured() || !supabase) {
      mockStorage.payToBank(roomId, sessionToken, amount, description);
      return;
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

  async declareBankruptcy(roomId: string): Promise<void> {
    const sessionToken = getOrCreateSessionToken();
    if (!isSupabaseConfigured() || !supabase) {
      mockStorage.declareBankruptcy(roomId, sessionToken);
      return;
    }

    const { error } = await supabase.rpc('declare_bankruptcy', {
      p_room_id: roomId,
      p_session_token: sessionToken,
    });

    if (error) {
      throw new Error(error.message || 'İflas işlemi gerçekleştirilemedi.');
    }
  }
};
