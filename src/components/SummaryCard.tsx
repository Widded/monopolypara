import React from 'react';
import { Activity, Coins } from 'lucide-react';
import { Transaction } from '../types';
import { formatMoney, formatTime, TRANSACTION_TYPE_LABELS } from '../utils/formatters';

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
    <div className="bg-bg-surface/60 border border-border-subtle rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
      {/* Total cash in play */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-bg-card border border-border-subtle flex items-center justify-center text-accent">
          <Coins className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider font-medium">Toplam Para</div>
          <div className="font-money font-semibold text-text-main text-xs">{formatMoney(totalCash)}</div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-6 w-[1px] bg-border-subtle shrink-0" />

      {/* Last Transaction snippet */}
      <button
        onClick={onOpenHistory}
        className="flex items-center gap-2 overflow-hidden text-left hover:opacity-80 transition-opacity"
        title="İşlem geçmişini görüntüle"
      >
        <div className="w-7 h-7 rounded-lg bg-bg-card border border-border-subtle flex items-center justify-center text-text-muted shrink-0">
          <Activity className="w-3.5 h-3.5 text-text-muted" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] text-text-muted uppercase tracking-wider font-medium flex items-center gap-1">
            <span>Son İşlem</span>
            {lastTransaction && (
              <span className="text-[9px] text-text-muted/70">
                · {formatTime(lastTransaction.created_at)}
              </span>
            )}
          </div>
          <div className="text-text-main truncate text-xs font-medium">
            {lastTransaction ? (
              <span>
                {lastTransaction.from_player_name} → {lastTransaction.to_player_name}{' '}
                <span className="font-money font-semibold text-accent">
                  {formatMoney(lastTransaction.amount)}
                </span>
              </span>
            ) : (
              <span className="text-text-muted">Henüz işlem yok</span>
            )}
          </div>
        </div>
      </button>
    </div>
  );
};
