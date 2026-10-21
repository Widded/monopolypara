import React from 'react';
import { Transaction } from '../types';
import { formatMoney } from '../utils/formatters';

interface SummaryCardProps {
  playerCount: number;
  totalCash: number;
  lastTransaction?: Transaction;
  onOpenHistory: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  playerCount,
  totalCash,
  lastTransaction,
  onOpenHistory,
}) => {
  return (
    <div className="flex items-baseline justify-between gap-3 px-1 py-1 text-xs border-b border-border-subtle/80 text-text-muted">
      {/* Toplam Para */}
      <div className="flex items-baseline gap-1.5 shrink-0">
        <span className="text-[11px] text-text-subtle font-medium">Masa Toplamı</span>
        <span className="font-money font-bold text-text-main text-[13px]">
          {formatMoney(totalCash)}
        </span>
      </div>

      {/* Son İşlem / Geçmiş Linki */}
      <button
        type="button"
        onClick={onOpenHistory}
        className="flex items-baseline gap-1 min-w-0 truncate text-right hover:text-text-main transition-colors cursor-pointer group"
        title="İşlem geçmişini görüntüle"
      >
        <span className="text-[11px] text-text-subtle font-medium shrink-0">Son:</span>
        {lastTransaction ? (
          <span className="truncate text-[11px] text-text-muted group-hover:text-text-main">
            {lastTransaction.from_player_name} → {lastTransaction.to_player_name}{' '}
            <strong className="font-money font-semibold text-text-main">
              {formatMoney(lastTransaction.amount)}
            </strong>
          </span>
        ) : (
          <span className="text-[11px] text-text-subtle">Henüz işlem yok</span>
        )}
      </button>
    </div>
  );
};
