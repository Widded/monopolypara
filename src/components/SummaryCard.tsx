import React from 'react';
import { Transaction } from '../types';
import { formatMoney, formatRelativeTime } from '../utils/formatters';

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
    <div className="pt-2 pb-4 border-b border-white/[0.08]">
      <div className="flex items-center justify-between gap-4">
        {/* Sol Kolon: Toplam Nakit */}
        <div className="flex-1 min-w-0 pr-2">
          <span className="text-xs text-neutral-400 font-medium block">
            Toplam Nakit
          </span>
          <div className="text-3xl sm:text-[32px] font-extrabold text-white tracking-tight font-mono leading-tight mt-1 truncate">
            {formatMoney(totalCash)}
          </div>
        </div>

        {/* Dikey İnce Bölücü Çizgi */}
        <div className="w-[1px] bg-white/[0.08] self-stretch my-1 shrink-0" />

        {/* Sağ Kolon: Son İşlem */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="flex-1 min-w-0 pl-2 text-left group cursor-pointer select-none focus:outline-none"
          title="Tüm işlem geçmişini gör"
        >
          <span className="text-xs text-neutral-400 font-medium block">
            Son İşlem
          </span>

          {lastTransaction ? (
            <div className="mt-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate flex items-center gap-1">
                <span className="truncate max-w-[70px] sm:max-w-[85px]">
                  {lastTransaction.from_player_name || 'Oyuncu'}
                </span>
                <span className="text-neutral-500 text-xs shrink-0">→</span>
                <span className="truncate max-w-[70px] sm:max-w-[85px]">
                  {lastTransaction.to_player_name || 'Oyuncu'}
                </span>
                <span className="text-emerald-400 font-bold ml-0.5 shrink-0 font-mono">
                  {formatMoney(lastTransaction.amount)}
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 block mt-0.5">
                {formatRelativeTime(lastTransaction.created_at)}
              </span>
            </div>
          ) : (
            <div className="text-xs text-neutral-500 mt-1">
              Henüz işlem yok
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
