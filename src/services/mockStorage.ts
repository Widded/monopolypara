import { Room, Player, Debt, Transaction, DebtPayment, DebtSettlement } from '../types';

interface StorageData {
  rooms: Record<string, Room>;
  players: Record<string, Player>;
  debts: Record<string, Debt>;
  transactions: Record<string, Transaction>;
  debtPayments: Record<string, DebtPayment>;
  debtSettlements: Record<string, DebtSettlement>;
}

const STORAGE_KEY = 'monopoly_istanbul_data_v1';
const bc = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('monopoly_channel')
  : null;

function loadData(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { rooms: {}, players: {}, debts: {}, transactions: {}, debtPayments: {}, debtSettlements: {} };
    return JSON.parse(raw);
  } catch {
    return { rooms: {}, players: {}, debts: {}, transactions: {}, debtPayments: {}, debtSettlements: {} };
  }
}

function saveData(data: StorageData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    bc?.postMessage({ type: 'SYNC_UPDATE', timestamp: Date.now() });
  } catch (e) {
    console.error('Failed to save data to localStorage', e);
  }
}

export const mockStorage = {
  subscribe(callback: () => void): () => void {
    if (!bc) return () => {};
    const handler = () => callback();
    bc.addEventListener('message', handler);
    window.addEventListener('storage', handler);
    return () => {
      bc.removeEventListener('message', handler);
      window.removeEventListener('storage', handler);
    };
  },

  createRoomWithBanker(roomCode: string, playerName: string, sessionToken: string): { room: Room; player: Player } {
    const data = loadData();
    const roomId = 'room_' + Math.random().toString(36).substring(2, 9);
    const playerId = 'player_' + Math.random().toString(36).substring(2, 9);

    const player: Player = {
      id: playerId,
      room_id: roomId,
      name: playerName.trim(),
      balance: 1500,
      is_banker: true,
      session_token: sessionToken,
      recovery_pin: Math.floor(1000 + Math.random() * 9000).toString(),
      created_at: new Date().toISOString(),
    };

    const room: Room = {
      id: roomId,
      code: roomCode.toUpperCase(),
      banker_player_id: playerId,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    data.rooms[roomId] = room;
    data.players[playerId] = player;
    saveData(data);

    return { room, player };
  },

  joinRoom(roomCode: string, playerName: string, sessionToken: string): { room: Room; player: Player } {
    const data = loadData();
    const normalize = (c: string) => c.toUpperCase().replace(/^WID-/, '').trim();
    const room = Object.values(data.rooms).find(
      r => (normalize(r.code) === normalize(roomCode) || r.code.toUpperCase() === roomCode.trim().toUpperCase()) && r.status === 'active'
    );

    if (!room) {
      throw new Error('Oda bulunamadı veya kapatılmış.');
    }

    const cleanName = playerName.trim();
    // Akıllı Kontrol: Kullanıcı isim yerine 4 haneli PIN yazdıysa, PIN ile geri bağla
    if (/^\d{4}$/.test(cleanName)) {
      return this.reconnectWithPin(roomCode, cleanName, sessionToken);
    }

    // Check if player with this session already exists in room
    const existingPlayerBySession = Object.values(data.players).find(
      p => p.room_id === room.id && p.session_token === sessionToken
    );
    if (existingPlayerBySession) {
      return { room, player: existingPlayerBySession };
    }

    // Check duplicate name
    const existingPlayerByName = Object.values(data.players).find(
      p => p.room_id === room.id && p.name.trim().toLowerCase() === playerName.trim().toLowerCase()
    );
    if (existingPlayerByName) {
      throw new Error(`Masada "${playerName.trim()}" isminde bir oyuncu zaten var. Eğer bu sizseniz "Geri Dön (PIN)" sekmesinden PIN kodunuzla bağlanabilirsiniz.`);
    }

    const playerId = 'player_' + Math.random().toString(36).substring(2, 9);
    const newPlayer: Player = {
      id: playerId,
      room_id: room.id,
      name: playerName.trim(),
      balance: 1500,
      is_banker: false,
      session_token: sessionToken,
      recovery_pin: Math.floor(1000 + Math.random() * 9000).toString(),
      created_at: new Date().toISOString(),
    };

    data.players[playerId] = newPlayer;
    saveData(data);

    return { room, player: newPlayer };
  },

  reconnectWithPin(roomCode: string, pin: string, sessionToken: string): { room: Room; player: Player } {
    const data = loadData();
    const normalize = (c: string) => c.toUpperCase().replace(/^WID-/, '').trim();
    const room = Object.values(data.rooms).find(
      r => (normalize(r.code) === normalize(roomCode) || r.code.toUpperCase() === roomCode.trim().toUpperCase()) && r.status === 'active'
    );

    if (!room) {
      throw new Error('Oda bulunamadı veya kapatılmış.');
    }

    const cleanPin = pin.trim().padStart(4, '0');
    const player = Object.values(data.players).find(
      p => p.room_id === room.id && (p.recovery_pin === cleanPin || p.recovery_pin === pin.trim())
    );

    if (!player) {
      throw new Error('Bu koda sahip bir oyuncu bulunamadı. Lütfen odadaki arkadaşlarınıza kodunuzu sorun.');
    }

    // Rebind session token
    player.session_token = sessionToken;
    player.is_online = true;
    saveData(data);

    return { room, player };
  },

  getRoomState(roomId: string, sessionToken: string) {
    const data = loadData();
    const room = data.rooms[roomId];
    if (!room) return null;

    const players = Object.values(data.players).filter(p => p.room_id === roomId);
    const debts = Object.values(data.debts).filter(d => d.room_id === roomId);
    const transactions = Object.values(data.transactions)
      .filter(t => t.room_id === roomId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const activePlayerId = typeof window !== 'undefined' ? localStorage.getItem('monopoly_active_player_id') : null;
    let currentPlayer = players.find(p => p.session_token === sessionToken);
    if (!currentPlayer && activePlayerId) {
      const found = players.find(p => p.id === activePlayerId);
      if (found) {
        currentPlayer = found;
        found.session_token = sessionToken;
        saveData(data);
      }
    }

    // If no player matched, return null to return to WelcomeScreen instead of hijacking banker
    if (!currentPlayer) {
      return null;
    }

    // Compute player debt totals
    const populatedPlayers = players.map(p => {
      // Receivables: debts where p is creditor and remaining > 0
      const total_receivable = debts
        .filter(d => d.creditor_id === p.id && (d.status === 'active' || d.status === 'partially_paid'))
        .reduce((sum, d) => sum + d.remaining_amount, 0);

      // Debts: debts where p is debtor and remaining > 0
      const total_debt = debts
        .filter(d => d.debtor_id === p.id && (d.status === 'active' || d.status === 'partially_paid'))
        .reduce((sum, d) => sum + d.remaining_amount, 0);

      return {
        ...p,
        total_receivable,
        total_debt,
      };
    });

    // Populate debt player names
    const populatedDebts = debts.map(d => ({
      ...d,
      creditor_name: players.find(p => p.id === d.creditor_id)?.name || 'Bilinmeyen',
      debtor_name: players.find(p => p.id === d.debtor_id)?.name || 'Bilinmeyen',
    }));

    // Populate transaction player names
    const populatedTransactions = transactions.map(t => ({
      ...t,
      from_player_name: t.from_player_id ? (players.find(p => p.id === t.from_player_id)?.name || 'Oyuncu') : 'Banka',
      to_player_name: t.to_player_id ? (players.find(p => p.id === t.to_player_id)?.name || 'Oyuncu') : 'Banka',
    }));

    return {
      room,
      currentPlayer,
      players: populatedPlayers,
      debts: populatedDebts,
      transactions: populatedTransactions,
    };
  },

  transferMoney(roomId: string, fromId: string, toId: string, amount: number, description?: string) {
    if (amount <= 0) throw new Error('Transfer tutarı sıfırdan büyük olmalıdır.');
    if (fromId === toId) throw new Error('Kendinize para gönderemezsiniz.');

    const data = loadData();
    const sender = data.players[fromId];
    const receiver = data.players[toId];

    if (!sender || !receiver) throw new Error('Oyuncu bulunamadı.');
    if (sender.balance < amount) throw new Error(`Yetersiz bakiye! Mevcut: ${sender.balance} ₺`);

    sender.balance -= amount;
    receiver.balance += amount;

    const txId = 'tx_' + Math.random().toString(36).substring(2, 9);
    data.transactions[txId] = {
      id: txId,
      room_id: roomId,
      type: 'transfer',
      from_player_id: fromId,
      to_player_id: toId,
      amount,
      description: description || undefined,
      created_at: new Date().toISOString(),
    };

    saveData(data);
  },

  lendDebt(roomId: string, creditorId: string, debtorId: string, amount: number, description?: string) {
    if (amount <= 0) throw new Error('Borç tutarı sıfırdan büyük olmalıdır.');
    if (creditorId === debtorId) throw new Error('Kendinize borç veremezsiniz.');

    const data = loadData();
    const creditor = data.players[creditorId];
    const debtor = data.players[debtorId];

    if (!creditor || !debtor) throw new Error('Oyuncu bulunamadı.');
    if (creditor.balance < amount) throw new Error(`Yetersiz bakiye! Mevcut nakit: ${creditor.balance} ₺`);

    // Borç teklifi pending olarak oluşturulur, para borçlu onaylayana kadar düşmez
    const debtId = 'debt_' + Math.random().toString(36).substring(2, 9);
    data.debts[debtId] = {
      id: debtId,
      room_id: roomId,
      creditor_id: creditorId,
      debtor_id: debtorId,
      initial_amount: amount,
      paid_amount: 0,
      remaining_amount: amount,
      status: 'pending',
      description: description || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveData(data);
  },

  approveDebt(roomId: string, debtId: string) {
    const data = loadData();
    const debt = data.debts[debtId];
    if (!debt || debt.room_id !== roomId) throw new Error('Borç kaydı bulunamadı.');
    if (debt.status !== 'pending') throw new Error('Bu borç teklifi onay bekleyen durumda değil.');

    const creditor = data.players[debt.creditor_id];
    const debtor = data.players[debt.debtor_id];
    if (!creditor || !debtor) throw new Error('Oyuncu bulunamadı.');

    if (creditor.balance < debt.initial_amount) {
      throw new Error(`Alacaklı oyuncunun (${creditor.name}) bakiyesi yetersiz! (Mevcut: ${creditor.balance} ₺)`);
    }

    // Para hareketi şimdi gerçekleşir
    creditor.balance -= debt.initial_amount;
    debtor.balance += debt.initial_amount;
    debt.status = 'active';
    debt.updated_at = new Date().toISOString();

    const txId = 'tx_' + Math.random().toString(36).substring(2, 9);
    data.transactions[txId] = {
      id: txId,
      room_id: roomId,
      type: 'debt_lend',
      from_player_id: debt.creditor_id,
      to_player_id: debt.debtor_id,
      amount: debt.initial_amount,
      description: debt.description || 'Borç onaylandı ve verildi',
      created_at: new Date().toISOString(),
    };

    saveData(data);
  },

  rejectDebt(roomId: string, debtId: string) {
    const data = loadData();
    const debt = data.debts[debtId];
    if (!debt || debt.room_id !== roomId) throw new Error('Borç kaydı bulunamadı.');
    if (debt.status !== 'pending') throw new Error('Bu borç teklifi zaten onaylanmış veya sonuçlandırılmış.');

    debt.status = 'rejected';
    debt.updated_at = new Date().toISOString();

    saveData(data);
  },

  payDebt(roomId: string, debtId: string, amount: number) {
    if (amount <= 0) throw new Error('Ödeme tutarı sıfırdan büyük olmalıdır.');

    const data = loadData();
    const debt = data.debts[debtId];
    if (!debt || debt.status === 'settled' || debt.remaining_amount <= 0) {
      throw new Error('Borç kaydı bulunamadı veya zaten kapatılmış.');
    }

    if (amount > debt.remaining_amount) {
      throw new Error(`Ödeme tutarı kalan borçtan (${debt.remaining_amount} ₺) fazla olamaz.`);
    }

    const debtor = data.players[debt.debtor_id];
    const creditor = data.players[debt.creditor_id];

    if (!debtor || !creditor) throw new Error('Oyuncu bulunamadı.');
    if (debtor.balance < amount) throw new Error(`Yetersiz bakiye! Mevcut nakit: ${debtor.balance} ₺`);

    // Cash movement: debtor -> creditor
    debtor.balance -= amount;
    creditor.balance += amount;

    // Update debt
    debt.paid_amount += amount;
    debt.remaining_amount -= amount;
    debt.status = debt.remaining_amount === 0 ? 'settled' : 'partially_paid';
    debt.updated_at = new Date().toISOString();

    // Log payment
    const paymentId = 'pay_' + Math.random().toString(36).substring(2, 9);
    data.debtPayments[paymentId] = {
      id: paymentId,
      debt_id: debtId,
      amount,
      remaining_after: debt.remaining_amount,
      created_at: new Date().toISOString(),
    };

    // Log transaction
    const txId = 'tx_' + Math.random().toString(36).substring(2, 9);
    data.transactions[txId] = {
      id: txId,
      room_id: roomId,
      type: 'debt_payment',
      from_player_id: debt.debtor_id,
      to_player_id: debt.creditor_id,
      amount,
      description: `Borç ödemesi (Kalan: ${debt.remaining_amount} ₺)`,
      created_at: new Date().toISOString(),
    };

    saveData(data);
  },

  settleDebt(roomId: string, debtId: string, agreedPayment: number) {
    if (agreedPayment < 0) throw new Error('Anlaşılan tutar negatif olamaz.');

    const data = loadData();
    const debt = data.debts[debtId];
    if (!debt || debt.status === 'settled') {
      throw new Error('Borç bulunamadı veya zaten kapatılmış.');
    }

    if (agreedPayment > debt.remaining_amount) {
      throw new Error('Anlaşılan tutar kalan borçtan fazla olamaz.');
    }

    const debtor = data.players[debt.debtor_id];
    const creditor = data.players[debt.creditor_id];
    if (!debtor || !creditor) throw new Error('Oyuncu bulunamadı.');

    if (agreedPayment > 0) {
      if (debtor.balance < agreedPayment) {
        throw new Error(`Borçlunun bakiyesi yetersiz (${debtor.balance} ₺).`);
      }
      debtor.balance -= agreedPayment;
      creditor.balance += agreedPayment;
    }

    const forgivenAmount = debt.remaining_amount - agreedPayment;
    debt.paid_amount += agreedPayment;
    debt.remaining_amount = 0;
    debt.status = 'settled';
    debt.updated_at = new Date().toISOString();

    const settlementId = 'stl_' + Math.random().toString(36).substring(2, 9);
    data.debtSettlements[settlementId] = {
      id: settlementId,
      debt_id: debtId,
      agreed_payment: agreedPayment,
      forgiven_amount: forgivenAmount,
      created_at: new Date().toISOString(),
    };

    const txId = 'tx_' + Math.random().toString(36).substring(2, 9);
    data.transactions[txId] = {
      id: txId,
      room_id: roomId,
      type: 'debt_settlement',
      from_player_id: debt.debtor_id,
      to_player_id: debt.creditor_id,
      amount: agreedPayment,
      description: `Anlaşmalı kapatma (Ödenen: ${agreedPayment} ₺, Silinen: ${forgivenAmount} ₺)`,
      created_at: new Date().toISOString(),
    };

    saveData(data);
  },

  bankerAdjust(roomId: string, playerId: string, amountDelta: number, description: string) {
    if (amountDelta === 0) throw new Error('Değişiklik tutarı sıfır olamaz.');

    const data = loadData();
    const player = data.players[playerId];
    if (!player) throw new Error('Oyuncu bulunamadı.');

    const newBalance = player.balance + amountDelta;
    if (newBalance < 0) {
      throw new Error(`Oyuncu bakiyesi sıfırın altına düşemez. (Mevcut: ${player.balance} ₺)`);
    }

    player.balance = newBalance;

    const txId = 'tx_' + Math.random().toString(36).substring(2, 9);
    data.transactions[txId] = {
      id: txId,
      room_id: roomId,
      type: 'banker_adjust',
      from_player_id: amountDelta < 0 ? playerId : null,
      to_player_id: amountDelta > 0 ? playerId : null,
      amount: Math.abs(amountDelta),
      description: description || 'Bankacı bakiye düzeltmesi',
      created_at: new Date().toISOString(),
    };

    saveData(data);
  },

  getDebtDetails(debtId: string) {
    const data = loadData();
    const debt = data.debts[debtId];
    if (!debt) return null;

    const payments = Object.values(data.debtPayments)
      .filter(p => p.debt_id === debtId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const settlement = Object.values(data.debtSettlements).find(s => s.debt_id === debtId) || null;

    return {
      debt: {
        ...debt,
        creditor_name: data.players[debt.creditor_id]?.name || 'Bilinmeyen',
        debtor_name: data.players[debt.debtor_id]?.name || 'Bilinmeyen',
      },
      payments,
      settlement,
    };
  },

  payToBank(roomId: string, sessionToken: string, amount: number, description?: string) {
    if (amount <= 0) throw new Error('Ödeme tutarı pozitif olmalıdır.');
    const data = loadData();
    const player = Object.values(data.players).find(p => p.room_id === roomId && p.session_token === sessionToken);
    if (!player) throw new Error('Oyuncu bulunamadı.');
    if (player.balance < amount) {
      throw new Error(`Yetersiz bakiye! (Mevcut: ${player.balance} ₺, Gereken: ${amount} ₺)`);
    }
    player.balance -= amount;
    const txId = 'tx_' + Math.random().toString(36).substring(2, 9);
    data.transactions[txId] = {
      id: txId,
      room_id: roomId,
      type: 'bank_payment',
      from_player_id: player.id,
      to_player_id: null,
      amount,
      description: description || 'Bankaya Ödeme',
      created_at: new Date().toISOString(),
    };
    saveData(data);
  },

  declareBankruptcy(roomId: string, sessionToken: string, beneficiaryId?: string | null) {
    const data = loadData();
    const player = Object.values(data.players).find(p => p.room_id === roomId && p.session_token === sessionToken);
    if (!player) throw new Error('Oyuncu bulunamadı.');
    if (player.is_bankrupt) throw new Error('Bu oyuncu zaten iflas etmiş.');

    const cash = player.balance;
    let desc = `${player.name} Bankaya iflas etti ve oyundan çekildi.`;
    let targetId: string | null = null;

    if (beneficiaryId) {
      if (beneficiaryId === player.id) throw new Error('Kendinize iflas edemezsiniz.');
      const beneficiary = data.players[beneficiaryId];
      if (!beneficiary || beneficiary.room_id !== roomId) throw new Error('Hedef oyuncu bulunamadı.');
      if (beneficiary.is_bankrupt) throw new Error('İflas etmiş bir oyuncuya varlık aktarılamaz.');

      beneficiary.balance += cash;
      targetId = beneficiary.id;
      desc = `${player.name}, ${beneficiary.name}'e iflas etti. Kalan tüm parası (${cash} ₺) ${beneficiary.name}'e aktarıldı.`;
    }

    // Açık borçları kapat
    Object.values(data.debts)
      .filter(d => (d.debtor_id === player.id || d.creditor_id === player.id) && d.status !== 'settled')
      .forEach(d => {
        d.status = 'settled';
        d.remaining_amount = 0;
        d.description = (d.description || '') + ' (İflas ile kapatıldı)';
      });

    player.balance = 0;
    player.is_bankrupt = true;
    player.is_online = false;

    const txId = 'tx_' + Math.random().toString(36).substring(2, 9);
    data.transactions[txId] = {
      id: txId,
      room_id: roomId,
      type: 'bankruptcy',
      from_player_id: player.id,
      to_player_id: targetId,
      amount: cash,
      description: desc,
      created_at: new Date().toISOString(),
    };
    saveData(data);
  },

  reverseTransaction(roomId: string, sessionToken: string, transactionId: string) {
    const data = loadData();
    const banker = Object.values(data.players).find(p => p.room_id === roomId && p.session_token === sessionToken && p.is_banker);
    if (!banker) throw new Error('Bu işlemi yalnızca bankacı yetkisine sahip oyuncu geri alabilir.');

    const tx = data.transactions[transactionId];
    if (!tx || tx.room_id !== roomId) throw new Error('İşlem kaydı bulunamadı.');
    if (tx.is_reversed) throw new Error('Bu işlem zaten daha önce geri alınmış.');
    if (tx.type !== 'transfer' && tx.type !== 'bank_payment' && tx.type !== 'banker_adjust') {
      throw new Error('Yalnızca transfer, banka ödemesi ve bankacı düzeltmeleri geri alınabilir.');
    }

    if (tx.type === 'transfer') {
      const fromPlayer = data.players[tx.from_player_id!];
      const toPlayer = data.players[tx.to_player_id!];
      if (!fromPlayer || !toPlayer) throw new Error('İlgili oyuncular bulunamadı.');
      if (toPlayer.balance < tx.amount) {
        throw new Error(`Alıcının mevcut bakiyesi (${toPlayer.balance} ₺) iade edilecek tutardan (${tx.amount} ₺) az olduğu için geri alınamaz.`);
      }
      toPlayer.balance -= tx.amount;
      fromPlayer.balance += tx.amount;
    } else if (tx.type === 'bank_payment') {
      const fromPlayer = data.players[tx.from_player_id!];
      if (!fromPlayer) throw new Error('Oyuncu bulunamadı.');
      fromPlayer.balance += tx.amount;
    } else if (tx.type === 'banker_adjust') {
      if (tx.to_player_id) {
        const toPlayer = data.players[tx.to_player_id];
        if (toPlayer) {
          if (toPlayer.balance < tx.amount) throw new Error('Oyuncu bakiyesi yetersiz.');
          toPlayer.balance -= tx.amount;
        }
      } else if (tx.from_player_id) {
        const fromPlayer = data.players[tx.from_player_id];
        if (fromPlayer) fromPlayer.balance += tx.amount;
      }
    }

    tx.is_reversed = true;

    const revId = 'tx_' + Math.random().toString(36).substring(2, 9);
    data.transactions[revId] = {
      id: revId,
      room_id: roomId,
      type: 'reversal',
      from_player_id: tx.to_player_id,
      to_player_id: tx.from_player_id,
      amount: tx.amount,
      description: `İptal: Bankacı işlemi geri aldı (${tx.description || 'İşlem'} - ${tx.amount} ₺ iade edildi)`,
      created_at: new Date().toISOString(),
      is_reversed: false,
    };

    saveData(data);
    return data.transactions[revId];
  },

  endGame(roomId: string, sessionToken: string, status: 'active' | 'ended' = 'ended') {
    const data = loadData();
    const banker = Object.values(data.players).find(p => p.room_id === roomId && p.session_token === sessionToken && p.is_banker);
    if (!banker) throw new Error('Yalnızca bankacı oyunu bitirebilir.');

    const room = data.rooms[roomId];
    if (!room) throw new Error('Oda bulunamadı.');
    room.status = status;
    saveData(data);
    return room;
  }
};
