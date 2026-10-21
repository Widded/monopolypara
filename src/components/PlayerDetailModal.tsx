import React from 'react';
import { X, Send, HandCoins, CheckSquare, ArrowUpRight, ArrowDownLeft, Shield } from 'lucide-react';
import { Player, Debt, Transaction } from '../types';
import { formatMoney, formatTime, TRANSACTION_TYPE_LABELS } from '../utils/formatters';

interface PlayerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  currentPlayer: Player;
  debts: Debt[];
  transactions: Transaction[];
  onOpenTransfer: (targetPlayer: Player) => void;
  onOpenLend: (targetPlayer: Player) => void;
  onOpenPayDebt: (debtId?: string) => void;
  onOpenDebtDetail: (debt: Debt) => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  isOpen,
  onClose,
  player,
  currentPlayer,
  debts,
  transactions,
  onOpenTransfer,
  onOpenLend,
  onOpenPayDebt,
  onOpenDebtDetail,
}) => {
  if (!isOpen || !player) return null;

  const isSelf = player.id === currentPlayer.id;

  // Active debts where this player is debtor
  const playerDebts = debts.filter(d => d.debtor_id === player.id && d.status !== 'settled');
  // Active receivables where this player is creditor
  const playerReceivables = debts.filter(d => d.creditor_id === player.id && d.status !== 'settled');

  // Transactions involving this player
  const playerTransactions = transactions
    .filter(t => t.from_player_id === player.id || t.to_player_id === player.id)
    .slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-bg-card border border-border-subtle w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-text-main">{player.name}</h3>
            {isSelf && (
              <span className="bg-accent/15 text-accent text-[10px] font-semibold px-2 py-0.5 rounded-full border border-accent/30">
                Sen
              </span>
            )}
            {player.is_banker && (
              <span className="flex items-center gap-1 bg-[#1F2633] text-[#7E99D3] border border-[#2B3547] text-[10px] font-medium px-1.5 py-0.5 rounded-md">
                <Shield className="w-2.5 h-2.5" />
                Bankacı
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Balance & Debt Totals */}
        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 mb-4 text-center">
          <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
            Güncel Nakit Bakiye
          </span>
          <div className="font-money font-extrabold text-3xl text-text-main my-1">
            {formatMoney(player.balance)}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border-subtle text-xs">
            <div className="flex flex-col items-center p-2 rounded-xl bg-bg-card border border-border-subtle/50">
              <span className="text-[10px] text-text-muted flex items-center gap-1 mb-0.5">
                <ArrowUpRight className="w-3 h-3 text-money-pos" />
                Alacak Toplamı
              </span>
              <span className="font-money font-semibold text-money-pos text-sm">
                {formatMoney(player.total_receivable || 0)}
              </span>
            </div>

            <div className="flex flex-col items-center p-2 rounded-xl bg-bg-card border border-border-subtle/50">
              <span className="text-[10px] text-text-muted flex items-center gap-1 mb-0.5">
                <ArrowDownLeft className="w-3 h-3 text-money-neg" />
                Borç Toplamı
              </span>
              <span className="font-money font-semibold text-money-neg text-sm">
                {formatMoney(player.total_debt || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions (If not self) */}
        {!isSelf && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => {
                onClose();
                onOpenTransfer(player);
              }}
              className="btn-primary text-xs py-2.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Para Gönder</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenLend(player);
              }}
              className="btn-secondary text-xs py-2.5"
            >
              <HandCoins className="w-3.5 h-3.5 text-money-pos" />
              <span>Borç Ver</span>
            </button>
          </div>
        )}

        {/* Active Debts List */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Açık Borçlar ({playerDebts.length})
            </span>
          </div>

          {playerDebts.length === 0 ? (
            <div className="p-3 bg-bg-surface border border-border-subtle rounded-xl text-xs text-text-muted text-center">
              Oyuncunun şu anda açık borcu yok.
            </div>
          ) : (
            <div className="space-y-2">
              {playerDebts.map(d => (
                <div
                  key={d.id}
                  onClick={() => {
                    onClose();
                    onOpenDebtDetail(d);
                  }}
                  className="p-3 bg-bg-surface border border-border-subtle hover:border-[#39424E] rounded-xl flex items-center justify-between text-xs cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-semibold text-text-main">
                      Alacaklı: {d.creditor_name}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      Başlangıç: {formatMoney(d.initial_amount)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-money font-bold text-money-neg text-sm">
                      {formatMoney(d.remaining_amount)}
                    </span>
                    <span className="block text-[10px] text-accent mt-0.5">
                      Detay / Öde →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions involving player */}
        <div>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
            Son Para Hareketleri
          </span>
          {playerTransactions.length === 0 ? (
            <div className="p-3 bg-bg-surface border border-border-subtle rounded-xl text-xs text-text-muted text-center">
              Henüz işlem geçmişi yok.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {playerTransactions.map(tx => {
                const isIncoming = tx.to_player_id === player.id;
                return (
                  <div
                    key={tx.id}
                    className="p-2.5 bg-bg-surface border border-border-subtle/70 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-text-main text-[11px]">
                        {tx.from_player_name} → {tx.to_player_name}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        {TRANSACTION_TYPE_LABELS[tx.type]} · {formatTime(tx.created_at)}
                      </div>
                    </div>
                    <span
                      className={`font-money font-semibold text-xs ${
                        isIncoming ? 'text-money-pos' : 'text-money-neg'
                      }`}
                    >
                      {isIncoming ? `+${formatMoney(tx.amount)}` : `-${formatMoney(tx.amount)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
