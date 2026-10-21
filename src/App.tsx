import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { dataService } from './services/dataService';
import { Room, Player, Debt, Transaction, RoomState } from './types';
import { Navbar } from './components/Navbar';
import { SummaryCard } from './components/SummaryCard';
import { PlayerList } from './components/PlayerList';
import { ActionDock } from './components/ActionDock';
import { WelcomeScreen } from './components/WelcomeScreen';
import { TransferModal } from './components/TransferModal';
import { LendDebtModal } from './components/LendDebtModal';
import { PayDebtModal } from './components/PayDebtModal';
import { DebtDetailModal } from './components/DebtDetailModal';
import { BankerPanelModal } from './components/BankerPanelModal';
import { PlayerDetailModal } from './components/PlayerDetailModal';
import { HistoryViewModal } from './components/HistoryViewModal';
import { PendingDebtBanner } from './components/PendingDebtBanner';
import { Toast, ToastMessage } from './components/Toast';

const CURRENT_ROOM_KEY = 'monopoly_active_room_id';

export const App: React.FC = () => {
  const [roomId, setRoomId] = useState<string | null>(() => {
    return localStorage.getItem(CURRENT_ROOM_KEY);
  });
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [preSelectedReceiver, setPreSelectedReceiver] = useState<Player | null>(null);

  const [isLendOpen, setIsLendOpen] = useState(false);
  const [preSelectedDebtor, setPreSelectedDebtor] = useState<Player | null>(null);

  const [isPayOpen, setIsPayOpen] = useState(false);
  const [preSelectedDebtId, setPreSelectedDebtId] = useState<string | null>(null);

  const [isBankerOpen, setIsBankerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [detailPlayer, setDetailPlayer] = useState<Player | null>(null);
  const [detailDebt, setDetailDebt] = useState<Debt | null>(null);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#72E3A1', '#39D98A', '#F3F4F6'],
      });
    } catch {}
  };

  // Fetch / Sync Room State
  const refreshRoomState = useCallback(async () => {
    if (!roomId) {
      setLoading(false);
      return;
    }
    try {
      const state = await dataService.getRoomState(roomId);
      if (state) {
        setRoomState(state);
      } else {
        // Room not found or invalid
        localStorage.removeItem(CURRENT_ROOM_KEY);
        setRoomId(null);
        setRoomState(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch room state', err);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    refreshRoomState();
  }, [refreshRoomState]);

  // Subscribe to real-time events for this room
  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = dataService.subscribeToRoom(roomId, () => {
      refreshRoomState();
    });
    return () => {
      unsubscribe();
    };
  }, [roomId, refreshRoomState]);

  const isAnyModalOpen = isTransferOpen || isLendOpen || isPayOpen || isBankerOpen;

  // 5 saniyede bir otomatik verileri yenile (Polling) + Ön plana gelindiğinde anında güncelle
  useEffect(() => {
    if (!roomId) return;

    const handleSync = () => {
      dataService.ensureConnection();
      refreshRoomState();
    };

    // Sekmeye/uygulamaya her dönüldüğünde anında çek
    document.addEventListener('visibilitychange', handleSync);
    window.addEventListener('focus', handleSync);
    window.addEventListener('pageshow', handleSync);

    // Her 5 saniyede bir düzenli ve otomatik olarak tüm verileri güncelle
    // Kullanıcı bir modalda para/borç tutarı yazarken polling duraklatılır
    const interval = setInterval(() => {
      if (!isAnyModalOpen) {
        refreshRoomState();
      }
    }, 5000);

    return () => {
      document.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('pageshow', handleSync);
      clearInterval(interval);
    };
  }, [roomId, refreshRoomState, isAnyModalOpen]);

  // Room creation
  const handleCreateRoom = async (playerName: string) => {
    const { room, player } = await dataService.createRoom(playerName);
    localStorage.setItem(CURRENT_ROOM_KEY, room.id);
    setRoomId(room.id);
    addToast(`Oda oluşturuldu: ${room.code}`, 'success');
    await refreshRoomState();
  };

  // Room joining
  const handleJoinRoom = async (roomCode: string, playerName: string) => {
    const { room } = await dataService.joinRoom(roomCode, playerName);
    localStorage.setItem(CURRENT_ROOM_KEY, room.id);
    setRoomId(room.id);
    addToast(`${room.code} odasına katıldınız!`, 'success');
    await refreshRoomState();
  };

  // Reconnect with recovery PIN
  const handleReconnectWithPin = async (roomCode: string, pin: string) => {
    const { room, player } = await dataService.reconnectWithPin(roomCode, pin);
    localStorage.setItem(CURRENT_ROOM_KEY, room.id);
    setRoomId(room.id);
    addToast(`Hoş geldin ${player.name}! Varlıklarınla geri bağlandın.`, 'success');
    await refreshRoomState();
  };

  // Leave room
  const handleLeaveRoom = () => {
    if (window.confirm('Bu odadan ayrılmak istediğinizden emin misiniz?')) {
      localStorage.removeItem(CURRENT_ROOM_KEY);
      setRoomId(null);
      setRoomState(null);
      addToast('Odadan ayrıldınız.', 'info');
    }
  };

  // Transfers
  const handleTransfer = async (fromId: string, toId: string, amount: number, description?: string) => {
    if (!roomId) return;

    // 1. Anında 0ms yerel arayüz güncellemesi
    setRoomState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        players: prev.players.map(p => {
          if (p.id === fromId) return { ...p, balance: p.balance - amount };
          if (p.id === toId) return { ...p, balance: p.balance + amount };
          return p;
        }),
        currentPlayer: prev.currentPlayer?.id === fromId
          ? { ...prev.currentPlayer, balance: prev.currentPlayer.balance - amount }
          : prev.currentPlayer?.id === toId
          ? { ...prev.currentPlayer, balance: prev.currentPlayer.balance + amount }
          : prev.currentPlayer,
      };
    });
    triggerConfetti();
    addToast('Para transferi başarıyla gerçekleşti.', 'success');

    // 2. Arka planda sunucuya kaydet
    try {
      await dataService.transferMoney(roomId, fromId, toId, amount, description);
      await refreshRoomState();
    } catch (err: any) {
      addToast(err.message || 'Transfer başarısız.', 'error');
      await refreshRoomState();
    }
  };

  // Lend Debt
  const handleLendDebt = async (creditorId: string, debtorId: string, amount: number, description?: string) => {
    if (!roomId) return;
    try {
      await dataService.lendDebt(roomId, creditorId, debtorId, amount, description);
      addToast('Borç teklifi gönderildi. Karşı tarafın onayı bekleniyor.', 'info');
      await refreshRoomState();
    } catch (err: any) {
      addToast(err.message || 'Borç verilemedi.', 'error');
    }
  };

  // Approve Debt (Recipient confirms) - ANINDA 0ms GÜNCELLEME
  const handleApproveDebt = async (debtId: string) => {
    if (!roomId) return;

    // 1. Anında arayüzde borcu onayla ve bakiyeyi artır (bekletme yok)
    setRoomState(prev => {
      if (!prev) return prev;
      const target = prev.debts.find(d => d.id === debtId);
      if (!target) return prev;
      return {
        ...prev,
        debts: prev.debts.map(d => (d.id === debtId ? { ...d, status: 'active' } : d)),
        players: prev.players.map(p => {
          if (p.id === target.debtor_id) return { ...p, balance: p.balance + target.initial_amount };
          if (p.id === target.creditor_id) return { ...p, balance: p.balance - target.initial_amount };
          return p;
        }),
        currentPlayer: prev.currentPlayer?.id === target.debtor_id
          ? { ...prev.currentPlayer, balance: prev.currentPlayer.balance + target.initial_amount }
          : prev.currentPlayer?.id === target.creditor_id
          ? { ...prev.currentPlayer, balance: prev.currentPlayer.balance - target.initial_amount }
          : prev.currentPlayer,
      };
    });
    triggerConfetti();
    addToast('Borç teklifini onayladınız! Para hesabınıza aktarıldı.', 'success');

    // 2. Arka planda RPC çalıştır ve senkronize et
    try {
      await dataService.approveDebt(roomId, debtId);
      await refreshRoomState();
    } catch (err: any) {
      addToast(err.message || 'Borç onaylanamadı.', 'error');
      await refreshRoomState();
    }
  };

  // Reject / Cancel Debt Offer - ANINDA 0ms GÜNCELLEME
  const handleRejectDebt = async (debtId: string) => {
    if (!roomId) return;

    // 1. Anında ekrandan kaldır
    setRoomState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        debts: prev.debts.map(d => (d.id === debtId ? { ...d, status: 'rejected' } : d)),
      };
    });
    addToast('Borç teklifi iptal edildi / reddedildi.', 'info');

    // 2. Arka planda sunucuya bildir
    try {
      await dataService.rejectDebt(roomId, debtId);
      await refreshRoomState();
    } catch (err: any) {
      addToast(err.message || 'İşlem başarısız.', 'error');
      await refreshRoomState();
    }
  };

  // Pay Debt - ANINDA 0ms GÜNCELLEME
  const handlePayDebt = async (debtId: string, amount: number) => {
    if (!roomId) return;

    setRoomState(prev => {
      if (!prev) return prev;
      const target = prev.debts.find(d => d.id === debtId);
      if (!target) return prev;
      const newRemaining = Math.max(0, target.remaining_amount - amount);
      return {
        ...prev,
        debts: prev.debts.map(d =>
          d.id === debtId
            ? {
                ...d,
                remaining_amount: newRemaining,
                paid_amount: d.paid_amount + amount,
                status: newRemaining === 0 ? 'settled' : 'partially_paid',
              }
            : d
        ),
        players: prev.players.map(p => {
          if (p.id === target.debtor_id) return { ...p, balance: p.balance - amount };
          if (p.id === target.creditor_id) return { ...p, balance: p.balance + amount };
          return p;
        }),
        currentPlayer: prev.currentPlayer?.id === target.debtor_id
          ? { ...prev.currentPlayer, balance: prev.currentPlayer.balance - amount }
          : prev.currentPlayer?.id === target.creditor_id
          ? { ...prev.currentPlayer, balance: prev.currentPlayer.balance + amount }
          : prev.currentPlayer,
      };
    });
    triggerConfetti();
    addToast('Borç ödemesi başarıyla işlendi.', 'success');

    try {
      await dataService.payDebt(roomId, debtId, amount);
      await refreshRoomState();
    } catch (err: any) {
      addToast(err.message || 'Borç ödenemedi.', 'error');
      await refreshRoomState();
    }
  };

  // Settle Debt
  const handleSettleDebt = async (debtId: string, agreedPayment: number) => {
    if (!roomId) return;
    try {
      await dataService.settleDebt(roomId, debtId, agreedPayment);
      triggerConfetti();
      addToast('Borç anlaşmayla tamamen kapatıldı.', 'success');
      await refreshRoomState();
    } catch (err: any) {
      addToast(err.message || 'Borç kapatılamadı.', 'error');
    }
  };

  // Banker Adjustment - ANINDA 0ms GÜNCELLEME
  const handleBankerAdjust = async (playerId: string, delta: number, description: string) => {
    if (!roomId) return;

    setRoomState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        players: prev.players.map(p => (p.id === playerId ? { ...p, balance: p.balance + delta } : p)),
        currentPlayer: prev.currentPlayer?.id === playerId
          ? { ...prev.currentPlayer, balance: prev.currentPlayer.balance + delta }
          : prev.currentPlayer,
      };
    });
    addToast('Bakiye düzeltmesi başarıyla uygulandı.', 'success');

    try {
      await dataService.bankerAdjust(roomId, playerId, delta, description);
      await refreshRoomState();
    } catch (err: any) {
      addToast(err.message || 'Bakiye düzeltilemedi.', 'error');
      await refreshRoomState();
    }
  };

  // Shortcut triggers from PlayerCard or PlayerDetail
  const handleQuickSendMoney = (targetPlayer: Player) => {
    setPreSelectedReceiver(targetPlayer);
    setIsTransferOpen(true);
  };

  const handleQuickLend = (targetPlayer: Player) => {
    setPreSelectedDebtor(targetPlayer);
    setIsLendOpen(true);
  };

  const handleQuickPayDebt = (debtId?: string) => {
    setPreSelectedDebtId(debtId || null);
    setIsPayOpen(true);
  };

  const handleCopyRoomCode = async () => {
    if (!roomState?.room.code) return;
    try {
      await navigator.clipboard.writeText(roomState.room.code);
      addToast(`Oda kodu kopyalandı: ${roomState.room.code}`, 'info');
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-text-muted font-medium">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  // Not in a room -> Show Welcome Screen
  if (!roomId || !roomState) {
    return (
      <>
        <Toast toasts={toasts} onDismiss={dismissToast} />
        <WelcomeScreen
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onReconnectWithPin={handleReconnectWithPin}
        />
      </>
    );
  }

  const { room, currentPlayer, players, debts, transactions } = roomState;
  const totalCash = players.reduce((sum, p) => sum + p.balance, 0);
  const activeDebtsCount = debts.filter(d => (d.status === 'active' || d.status === 'partially_paid') && d.remaining_amount > 0).length;

  return (
    <div className="h-[100dvh] w-full bg-bg-main text-text-main flex flex-col overflow-hidden">
      {/* Toast notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Top Navbar */}
      <Navbar
        room={room}
        currentPlayer={currentPlayer}
        playerCount={players.length}
        isLive={dataService.isLiveSupabase()}
        onOpenBankerPanel={() => setIsBankerOpen(true)}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Main Content Area - Scrollable viewport starting cleanly at top */}
      <main className="flex-1 overflow-y-auto overscroll-contain max-w-md w-full mx-auto px-4 pt-2 pb-20 space-y-3">
        {/* Compact Summary */}
        <SummaryCard
          playerCount={players.length}
          totalCash={totalCash}
          lastTransaction={transactions[0]}
          onOpenHistory={() => setIsHistoryOpen(true)}
        />

        {/* Pending Debt Approvals */}
        <PendingDebtBanner
          debts={debts}
          currentPlayer={currentPlayer}
          onApprove={handleApproveDebt}
          onReject={handleRejectDebt}
        />

        {/* Players List - Core of the App */}
        <PlayerList
          players={players}
          currentPlayer={currentPlayer}
          onSendMoney={handleQuickSendMoney}
          onSelectPlayer={(p) => setDetailPlayer(p)}
          onCopyRoomCode={handleCopyRoomCode}
        />
      </main>

      {/* Bottom Sticky Action Dock */}
      <ActionDock
        onOpenTransfer={() => {
          setPreSelectedReceiver(null);
          setIsTransferOpen(true);
        }}
        onOpenLendDebt={() => {
          setPreSelectedDebtor(null);
          setIsLendOpen(true);
        }}
        onOpenPayDebt={() => {
          setPreSelectedDebtId(null);
          setIsPayOpen(true);
        }}
        onOpenHistory={() => setIsHistoryOpen(true)}
        activeDebtsCount={activeDebtsCount}
      />

      {/* Modals */}
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => {
          setIsTransferOpen(false);
          setPreSelectedReceiver(null);
        }}
        currentPlayer={currentPlayer}
        players={players}
        preSelectedReceiver={preSelectedReceiver}
        onTransfer={handleTransfer}
      />

      <LendDebtModal
        isOpen={isLendOpen}
        onClose={() => {
          setIsLendOpen(false);
          setPreSelectedDebtor(null);
        }}
        currentPlayer={currentPlayer}
        players={players}
        preSelectedDebtor={preSelectedDebtor}
        onLendDebt={handleLendDebt}
      />

      <PayDebtModal
        isOpen={isPayOpen}
        onClose={() => {
          setIsPayOpen(false);
          setPreSelectedDebtId(null);
        }}
        currentPlayer={currentPlayer}
        debts={debts}
        players={players}
        preSelectedDebtId={preSelectedDebtId}
        onPayDebt={handlePayDebt}
        onSettleDebt={handleSettleDebt}
      />

      <DebtDetailModal
        isOpen={Boolean(detailDebt)}
        onClose={() => setDetailDebt(null)}
        debt={detailDebt}
        onPayShortcut={(d) => {
          setPreSelectedDebtId(d.id);
          setIsPayOpen(true);
        }}
      />

      <PlayerDetailModal
        isOpen={Boolean(detailPlayer)}
        onClose={() => setDetailPlayer(null)}
        player={detailPlayer}
        currentPlayer={currentPlayer}
        debts={debts}
        transactions={transactions}
        onOpenTransfer={handleQuickSendMoney}
        onOpenLend={handleQuickLend}
        onOpenPayDebt={handleQuickPayDebt}
        onOpenDebtDetail={(d) => setDetailDebt(d)}
      />

      <BankerPanelModal
        isOpen={isBankerOpen}
        onClose={() => setIsBankerOpen(false)}
        room={room}
        players={players}
        transactions={transactions}
        onAdjustBalance={handleBankerAdjust}
        onOpenHistory={() => {
          setIsBankerOpen(false);
          setIsHistoryOpen(true);
        }}
      />

      <HistoryViewModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        transactions={transactions}
        players={players}
      />
    </div>
  );
};

export default App;
