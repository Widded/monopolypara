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
    <div className="pb-3 pt-0.5 border-b border-border-subtle/80">
      <div className="flex items-end justify-between gap-3">
        {/* Sol / Ana Bilgi: Masa Toplamı */}
        <div className="shrink-0">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-text-subtle mb-0.5">
            Masa Toplamı
          </span>
          <span className="font-money font-extrabold text-[22px] tracking-tight text-text-main leading-none block">
            {formatMoney(totalCash)}
          </span>
        </div>

        {/* Sağ / İkincil Bilgi: Son İşlem */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="text-right min-w-0 flex flex-col items-end group cursor-pointer hover:opacity-90 transition-opacity"
          title="Tüm işlem geçmişini aç"
        >
          <span className="text-[10px] font-medium text-text-subtle mb-0.5 group-hover:text-text-muted transition-colors">
            Son İşlem
          </span>
          {lastTransaction ? (
            <div className="text-xs text-text-muted group-hover:text-text-main transition-colors truncate max-w-[190px] sm:max-w-[240px]">
              <span className="font-medium text-text-main">
                {lastTransaction.from_player_name || 'Oyuncu'}
              </span>
              <span className="text-text-subtle mx-1">→</span>
              <span className="font-medium text-text-main">
                {lastTransaction.to_player_name || 'Oyuncu'}
              </span>{' '}
              <span className="font-money font-semibold text-text-main ml-0.5">
                {formatMoney(lastTransaction.amount)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-text-subtle">Henüz işlem yok</span>
          )}
        </button>
      </div>
    </div>
  );
};

