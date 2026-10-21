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
    const interval = setInterval(() => {
      refreshRoomState();
    }, 5000);

    return () => {
      document.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('pageshow', handleSync);
      clearInterval(interval);
    };
  }, [roomId, refreshRoomState]);

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
    await dataService.transferMoney(roomId, fromId, toId, amount, description);
    triggerConfetti();
    addToast('Para transferi başarıyla gerçekleşti.', 'success');
    await refreshRoomState();
  };

  // Lend Debt
  const handleLendDebt = async (creditorId: string, debtorId: string, amount: number, description?: string) => {
    if (!roomId) return;
    await dataService.lendDebt(roomId, creditorId, debtorId, amount, description);
    addToast('Borç teklifi gönderildi. Karşı tarafın onayı bekleniyor.', 'info');
    await refreshRoomState();
  };

  // Approve Debt (Recipient confirms)
  const handleApproveDebt = async (debtId: string) => {
    if (!roomId) return;
    try {
      await dataService.approveDebt(roomId, debtId);
      triggerConfetti();
      addToast('Borç teklifini onayladınız! Para hesabınıza aktarıldı.', 'success');
      await refreshRoomState();
    } catch (err: any) {
      addToast(err.message || 'Borç onaylanamadı.', 'error');
    }
  };

  // Reject / Cancel Debt Offer
  const handleRejectDebt = async (debtId: string) => {
    if (!roomId) return;
    try {
      await dataService.rejectDebt(roomId, debtId);
      addToast('Borç teklifi iptal edildi / reddedildi.', 'info');
      await refreshRoomState();
    } catch (err: any) {
      addToast(err.message || 'İşlem başarısız.', 'error');
    }
  };

  // Pay Debt
  const handlePayDebt = async (debtId: string, amount: number) => {
    if (!roomId) return;
    await dataService.payDebt(roomId, debtId, amount);
    triggerConfetti();
    addToast('Borç ödemesi başarıyla işlendi.', 'success');
    await refreshRoomState();
  };

  // Settle Debt
  const handleSettleDebt = async (debtId: string, agreedPayment: number) => {
    if (!roomId) return;
    await dataService.settleDebt(roomId, debtId, agreedPayment);
    triggerConfetti();
    addToast('Borç anlaşmayla tamamen kapatıldı.', 'success');
    await refreshRoomState();
  };

  // Banker Adjustment
  const handleBankerAdjust = async (playerId: string, delta: number, description: string) => {
    if (!roomId) return;
    await dataService.bankerAdjust(roomId, playerId, delta, description);
    addToast('Bakiye düzeltmesi başarıyla uygulandı.', 'success');
    await refreshRoomState();
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
      <main className="flex-1 overflow-y-auto overscroll-contain max-w-md w-full mx-auto px-3 py-2.5 space-y-2.5">
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

        {/* Players List */}
        <div>
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              Oyuncular ({players.length})
            </span>
          </div>

          <PlayerList
            players={players}
            currentPlayer={currentPlayer}
            onSendMoney={handleQuickSendMoney}
            onSelectPlayer={(p) => setDetailPlayer(p)}
            onCopyRoomCode={handleCopyRoomCode}
          />
        </div>
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
