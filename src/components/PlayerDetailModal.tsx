import React from 'react';
import { X, Send, HandCoins, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Player, Debt, Transaction } from '../types';
import { formatMoney } from '../utils/formatters';

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
  onOpenDebtDetail?: (debt: Debt) => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  isOpen,
  onClose,
  player,
  currentPlayer,
  debts,
  onOpenTransfer,
  onOpenLend,
  onOpenPayDebt,
}) => {
  if (!isOpen || !player) return null;

  const isSelf = player.id === currentPlayer.id;
  const playerDebts = debts.filter(d => d.debtor_id === player.id && (d.status === 'active' || d.status === 'partially_paid'));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="bg-bg-card border border-border-subtle w-full max-w-sm rounded-t-2xl sm:rounded-xl p-4">
        {/* Başlık */}
        <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle mb-3">
          <div className="flex items-baseline gap-2">
            <h3 className="font-bold text-base text-text-main tracking-tight">{player.name}</h3>
            {isSelf && (
              <span className="text-xs font-semibold text-accent">
                (Sen)
              </span>
            )}
            {player.is_banker && (
              <span className="text-[11px] text-[#7E99D3]">
                · Bankacı
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-subtle hover:text-text-main p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bakiye Özeti */}
        <div className="py-3 px-3.5 bg-bg-surface border border-border-subtle rounded-lg text-center mb-3">
          <div className="text-[11px] text-text-muted mb-0.5">Nakit Bakiye</div>
          <div className="font-money font-bold text-2xl text-text-main">
            {formatMoney(player.balance)}
          </div>
          <div className="flex justify-center gap-4 text-xs text-text-muted pt-2 border-t border-border-subtle mt-2">
            <span>
              Alacak: <strong className="font-money text-money-pos font-semibold">{formatMoney(player.total_receivable || 0)}</strong>
            </span>
            <span className="text-border-subtle">·</span>
            <span>
              Borç: <strong className="font-money text-money-neg font-semibold">{formatMoney(player.total_debt || 0)}</strong>
            </span>
          </div>
        </div>

        {/* Kurtarma PIN Kodu - Herkese Görünür */}
        <div className="py-2.5 px-3 bg-bg-surface border border-white/[0.08] rounded-xl flex items-center justify-between text-xs mb-3 shadow-inner">
          <div>
            <span className="text-[11px] text-text-muted font-bold block">Kurtarma Kodu (PIN)</span>
            <span className="text-[10px] text-text-subtle">
              {isSelf ? 'Çıkış yaparsan bu kodla geri dönersin' : 'Oyuncu çıkış yaparsa bu kodla geri dönebilir'}
            </span>
          </div>
          <span className="font-mono font-bold text-sm text-accent bg-bg-card border border-accent/30 px-2.5 py-0.5 rounded-lg tracking-widest select-all">
            {player.recovery_pin || '----'}
          </span>
        </div>

        {/* Başkasıysa işlem butonları */}
        {!isSelf && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTransfer(player);
              }}
              className="btn-primary py-2 text-xs font-bold"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Para Gönder</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLend(player);
              }}
              className="btn-secondary py-2 text-xs font-semibold"
            >
              <HandCoins className="w-3.5 h-3.5" />
              <span>Borç Ver</span>
            </button>
          </div>
        )}

        {/* Açık Borçları */}
        {playerDebts.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-semibold text-text-muted">
              Açık Borçları ({playerDebts.length})
            </div>
            {playerDebts.map(d => (
              <div
                key={d.id}
                className="py-2 px-3 bg-bg-surface border border-border-subtle rounded-lg flex items-center justify-between text-xs"
              >
                <div>
                  <span className="text-text-main font-medium">{d.creditor_name}'e</span>
                  <span className="text-[11px] text-money-neg font-money block">
                    Kalan: {formatMoney(d.remaining_amount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPayDebt(d.id);
                  }}
                  className="btn-secondary py-1 px-2.5 text-[11px]"
                >
                  Öde
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
