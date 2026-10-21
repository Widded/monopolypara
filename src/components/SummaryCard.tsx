import React from 'react';
import { Activity, Coins } from 'lucide-react';
import { Transaction } from '../types';
import { formatMoney } from '../utils/formatters';

interface SummaryCardProps {
  playerCount: number;
  totalCash: number;
  lastTransaction?: Transaction;
  onOpenHistory: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  totalCash,
  lastTransaction,
  onOpenHistory,
}) => {
  return (
    <div className="bg-bg-surface/70 border border-border-subtle rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
      {/* Total cash */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Coins className="w-3.5 h-3.5 text-accent shrink-0" />
        <span className="text-[11px] text-text-muted">Toplam:</span>
        <span className="font-money font-bold text-text-main text-xs">
          {formatMoney(totalCash)}
        </span>
      </div>

      {/* Divider */}
      <div className="h-3.5 w-[1px] bg-border-subtle shrink-0" />

      {/* Last Transaction snippet */}
      <button
        onClick={onOpenHistory}
        className="flex items-center gap-1.5 overflow-hidden text-left hover:text-accent transition-colors min-w-0"
        title="İşlem geçmişini aç"
      >
        <Activity className="w-3 h-3 text-text-muted shrink-0" />
        <div className="truncate text-[11px]">
          {lastTransaction ? (
            <span className="truncate">
              {lastTransaction.from_player_name} → {lastTransaction.to_player_name}{' '}
              <span className="font-money font-semibold text-accent">
                {formatMoney(lastTransaction.amount)}
              </span>
            </span>
          ) : (
            <span className="text-text-muted">İşlem geçmişi boş</span>
          )}
        </div>
      </button>
    </div>
  );
};
