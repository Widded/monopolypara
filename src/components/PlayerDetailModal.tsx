import React from 'react';
import { X, Send, HandCoins, ArrowUpRight, ArrowDownLeft, Shield } from 'lucide-react';
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
  onOpenDebtDetail: (debt: Debt) => void;
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
  const playerDebts = debts.filter(d => d.debtor_id === player.id && d.status !== 'settled');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="bg-bg-card border border-border-subtle w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle mb-3">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-sm text-text-main">{player.name}</h3>
            {isSelf && (
              <span className="bg-accent/15 text-accent text-[10px] font-semibold px-1.5 py-0.2 rounded border border-accent/30">
                Sen
              </span>
            )}
            {player.is_banker && (
              <span className="flex items-center gap-0.5 bg-[#1F2633] text-[#7E99D3] border border-[#2B3547] text-[10px] font-medium px-1.5 py-0.2 rounded">
                <Shield className="w-2.5 h-2.5" />
                Bankacı
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big Balance & Alacak/Borç row */}
        <div className="p-3 bg-bg-surface border border-border-subtle rounded-xl text-center mb-3">
          <div className="text-[10px] text-text-muted uppercase font-semibold">Nakit Bakiye</div>
          <div className="font-money font-bold text-2xl text-text-main my-0.5">
            {formatMoney(player.balance)}
          </div>
          <div className="flex justify-center gap-4 text-[11px] text-text-muted pt-1 border-t border-border-subtle/50 mt-1">
            <span className="flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-money-pos" />
              Alacak: <strong className="font-money text-money-pos">{formatMoney(player.total_receivable || 0)}</strong>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <ArrowDownLeft className="w-3 h-3 text-money-neg" />
              Borç: <strong className="font-money text-money-neg">{formatMoney(player.total_debt || 0)}</strong>
            </span>
          </div>
        </div>

        {/* Quick action buttons if not self */}
        {!isSelf && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => {
                onClose();
                onOpenTransfer(player);
              }}
              className="btn-primary py-2 text-xs font-semibold"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Para Gönder</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenLend(player);
              }}
              className="btn-secondary py-2 text-xs font-semibold"
            >
              <HandCoins className="w-3.5 h-3.5 text-money-pos" />
              <span>Borç Ver</span>
            </button>
          </div>
        )}

        {/* Active Debts */}
        {playerDebts.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Açık Borçları ({playerDebts.length})
            </div>
            {playerDebts.map(d => (
              <div
                key={d.id}
                className="p-2 bg-bg-surface border border-border-subtle rounded-lg flex items-center justify-between text-xs"
              >
                <div>
                  <span className="text-text-main font-medium">{d.creditor_name}'e</span>
                  <span className="text-[10px] text-text-muted block">
                    Kalan: <strong className="font-money text-money-neg">{formatMoney(d.remaining_amount)}</strong>
                  </span>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenPayDebt(d.id);
                  }}
                  className="bg-accent/15 hover:bg-accent hover:text-bg-main text-accent border border-accent/30 text-[10px] font-bold px-2 py-1 rounded"
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
