import React, { useState } from 'react';
import { X, Trophy, Medal, Flame, ArrowUpRight, ArrowDownLeft, Skull, Share2, Check, RefreshCw, Flag } from 'lucide-react';
import { Player, Room, Transaction } from '../types';
import { formatMoney } from '../utils/formatters';

interface GameStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  players: Player[];
  transactions: Transaction[];
  currentPlayer: Player;
  onEndGame?: (status: 'ended' | 'active') => Promise<void>;
}

export const GameStatsModal: React.FC<GameStatsModalProps> = ({
  isOpen,
  onClose,
  room,
  players,
  transactions,
  currentPlayer,
  onEndGame,
}) => {
  const [copied, setCopied] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isGameEnded = room.status === 'ended';
  const isBanker = currentPlayer.is_banker;

  // 1. Oyuncu finansal toplamlarını hesapla (Gelen / Giden para)
  const playerStats: Record<string, { sent: number; received: number }> = {};
  players.forEach(p => {
    playerStats[p.id] = { sent: 0, received: 0 };
  });

  let totalVolume = 0;
  let successfulTransfers = 0;

  transactions.forEach(tx => {
    if (tx.is_reversed) return;
    if (tx.type === 'transfer' && tx.from_player_id && tx.to_player_id) {
      totalVolume += tx.amount;
      successfulTransfers += 1;
      if (playerStats[tx.from_player_id]) {
        playerStats[tx.from_player_id].sent += tx.amount;
      }
      if (playerStats[tx.to_player_id]) {
        playerStats[tx.to_player_id].received += tx.amount;
      }
    } else if (tx.type === 'bank_payment' && tx.from_player_id) {
      totalVolume += tx.amount;
      if (playerStats[tx.from_player_id]) {
        playerStats[tx.from_player_id].sent += tx.amount;
      }
    }
  });

  // 2. Oyuncuları sırala (İflas etmeyenler bakiyeye göre en üstte, iflas edenler sonda)
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.is_bankrupt && !b.is_bankrupt) return 1;
    if (!a.is_bankrupt && b.is_bankrupt) return -1;
    return b.balance - a.balance;
  });

  const activePlayers = sortedPlayers.filter(p => !p.is_bankrupt);
  const bankruptPlayers = sortedPlayers.filter(p => p.is_bankrupt);
  const champion = activePlayers[0] || sortedPlayers[0];

  // En çok para harcayan (sent) ve en çok toplayan (received)
  let topSpender = players[0];
  let topEarner = players[0];
  let maxSent = -1;
  let maxReceived = -1;

  players.forEach(p => {
    const stats = playerStats[p.id] || { sent: 0, received: 0 };
    if (stats.sent > maxSent) {
      maxSent = stats.sent;
      topSpender = p;
    }
    if (stats.received > maxReceived) {
      maxReceived = stats.received;
      topEarner = p;
    }
  });

  // WhatsApp / Metin Özeti Kopyalama
  const handleCopySummary = async () => {
    const lines = [
      `MONOPOLY İSTANBUL - MASA RAPORU (${room.code})`,
      `Durum: ${isGameEnded ? 'Oyun Tamamlandı' : 'Canlı Masa'}`,
      `Toplam Dönen Hacim: ${formatMoney(totalVolume)}`,
      '',
      'LİDERLİK TABLOSU:',
      ...sortedPlayers.map((p, idx) => {
        const rank = `${idx + 1}.`;
        const status = p.is_bankrupt ? '(İFLAS ETTİ)' : `${formatMoney(p.balance)}`;
        return `${rank} ${p.name}: ${status}`;
      }),
      '',
      `En Çok Kazanan: ${topEarner?.name || '-'} (${formatMoney(maxReceived > 0 ? maxReceived : 0)})`,
      `En Çok Harcayan: ${topSpender?.name || '-'} (${formatMoney(maxSent > 0 ? maxSent : 0)})`,
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleToggleEndGame = async () => {
    if (!onEndGame || loading) return;
    setLoading(true);
    try {
      await onEndGame(isGameEnded ? 'active' : 'ended');
      setConfirmEnd(false);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-100 overflow-y-auto">
      <div className="bg-bg-card border border-border-subtle w-full max-w-md rounded-2xl p-4 shadow-2xl max-h-[90dvh] flex flex-col my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Trophy className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                <span>Masa İstatistikleri</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  isGameEnded 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {isGameEnded ? 'Oyun Bitti' : 'Devam Ediyor'}
                </span>
              </h3>
              <p className="text-[11px] text-text-subtle font-mono">Oda Kodu: {room.code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main p-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-3.5 overflow-y-auto flex-1 pr-0.5">
          {/* 1. Şampiyon Podyum Kartı */}
          {champion && (
            <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-bg-surface to-bg-card p-3.5 text-center shadow-lg">
              <div className="flex justify-center mb-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider shadow-inner">
                  <Trophy className="w-3.5 h-3.5 text-amber-300" />
                  {isGameEnded ? 'Masa Şampiyonu' : 'Mevcut Lider'}
                </span>
              </div>
              <h4 className="font-extrabold text-xl text-text-main mt-1 tracking-tight">
                {champion.name}
              </h4>
              <div className="font-money font-bold text-2xl text-accent mt-0.5">
                {formatMoney(champion.balance)}
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                {champion.is_bankrupt 
                  ? 'Masada kalan son oyuncu bulunamadı' 
                  : `${activePlayers.length} aktif oyuncu arasında en yüksek nakde sahip`}
              </p>
            </div>
          )}

          {/* 2. Hızlı Finans Metrikleri Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-bg-surface border border-border-subtle">
              <span className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider block">
                Toplam Para Hacmi
              </span>
              <span className="font-money font-bold text-base text-text-main block mt-0.5">
                {formatMoney(totalVolume)}
              </span>
              <span className="text-[10px] text-text-muted">
                {successfulTransfers} başarılı işlem
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-bg-surface border border-border-subtle">
              <span className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider block">
                Kalan Canlı Para
              </span>
              <span className="font-money font-bold text-base text-accent block mt-0.5">
                {formatMoney(players.reduce((sum, p) => sum + p.balance, 0))}
              </span>
              <span className="text-[10px] text-text-muted">
                {activePlayers.length} oyuncuda aktif
              </span>
            </div>

            {maxReceived > 0 && topEarner && (
              <div className="p-2.5 rounded-xl bg-bg-surface border border-border-subtle flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-text-subtle font-semibold block truncate">En Çok Kazanan</span>
                  <span className="font-bold text-xs text-text-main block truncate">{topEarner.name}</span>
                  <span className="text-[10px] text-money-pos font-money font-semibold">+{formatMoney(maxReceived)}</span>
                </div>
              </div>
            )}

            {maxSent > 0 && topSpender && (
              <div className="p-2.5 rounded-xl bg-bg-surface border border-border-subtle flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-text-subtle font-semibold block truncate">En Çok Harcayan</span>
                  <span className="font-bold text-xs text-text-main block truncate">{topSpender.name}</span>
                  <span className="text-[10px] text-money-neg font-money font-semibold">-{formatMoney(maxSent)}</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Oyuncu Sıralaması */}
          <div>
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Sıralama ve Cüzdanlar</span>
              <span className="text-[10px] lowercase font-normal">{sortedPlayers.length} oyuncu</span>
            </div>
            <div className="space-y-1.5">
              {sortedPlayers.map((p, idx) => {
                const stats = playerStats[p.id] || { sent: 0, received: 0 };
                const isBankrupt = p.is_bankrupt;

                return (
                  <div
                    key={p.id}
                    className={`py-2 px-3 rounded-xl border transition-colors flex items-center justify-between text-xs ${
                      idx === 0 && !isBankrupt
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : isBankrupt
                        ? 'bg-red-950/20 border-red-500/20 opacity-70'
                        : 'bg-bg-surface border-border-subtle'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        idx === 0 && !isBankrupt ? 'bg-amber-500 text-black' :
                        idx === 1 && !isBankrupt ? 'bg-slate-300 text-black' :
                        idx === 2 && !isBankrupt ? 'bg-amber-700 text-white' :
                        'bg-bg-card text-text-muted border border-border-subtle'
                      }`}>
                        {idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-text-main truncate text-xs">{p.name}</span>
                          {p.id === currentPlayer.id && (
                            <span className="text-[10px] text-accent font-semibold">(Sen)</span>
                          )}
                          {isBankrupt && (
                            <span className="text-[10px] text-red-400 font-bold flex items-center gap-0.5">
                              <Skull className="w-2.5 h-2.5" /> İflas
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-text-subtle flex items-center gap-2 mt-0.5">
                          <span>Alınan: <strong className="text-money-pos font-money">{formatMoney(stats.received)}</strong></span>
                          <span>·</span>
                          <span>Harcanan: <strong className="text-money-neg font-money">{formatMoney(stats.sent)}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`font-money font-bold text-sm ${isBankrupt ? 'text-text-subtle line-through' : 'text-text-main'}`}>
                        {formatMoney(p.balance)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-border-subtle mt-3 space-y-2 shrink-0">
          <div className="flex items-center gap-2">
            {/* Paylaş Butonu */}
            <button
              type="button"
              onClick={handleCopySummary}
              className="btn-secondary flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Rapor Kopyalandı!' : 'Raporu Paylaş'}</span>
            </button>

            {/* Bankacı Oyunu Bitir Butonu */}
            {isBanker && onEndGame && (
              <>
                {!confirmEnd ? (
                  <button
                    type="button"
                    onClick={() => setConfirmEnd(true)}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isGameEnded
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                        : 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{isGameEnded ? 'Oyuna Devam Et' : 'Oyunu Bitir'}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmEnd(false)}
                      disabled={loading}
                      className="py-1.5 px-2.5 rounded-lg border border-border-subtle text-text-muted text-xs hover:text-text-main"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleEndGame}
                      disabled={loading}
                      className="py-1.5 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold"
                    >
                      {loading ? 'İşleniyor...' : 'Evet, Bitir'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
