import React from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';
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
    <div className="flex items-center justify-between px-1 text-xs text-neutral-400 select-none py-1">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-neutral-500">Masa:</span>
        <span className="font-bold text-white font-mono text-xs">{formatMoney(totalCash)}</span>
      </div>

      {lastTransaction ? (
        <button
          type="button"
          onClick={onOpenHistory}
          className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors cursor-pointer truncate max-w-[210px]"
          title="Tüm işlem geçmişini gör"
        >
          <span className="text-neutral-500">Son:</span>
          <span className="truncate max-w-[60px] text-neutral-300">{lastTransaction.from_player_name}</span>
          <ArrowRight className="w-2.5 h-2.5 text-neutral-600 shrink-0" />
          <span className="truncate max-w-[60px] text-neutral-300">{lastTransaction.to_player_name}</span>
          <span className="font-mono text-emerald-400 font-semibold shrink-0 ml-0.5">{formatMoney(lastTransaction.amount)}</span>
          <ChevronRight className="w-3 h-3 text-neutral-600 shrink-0" />
        </button>
      ) : (
        <span className="text-[11px] text-neutral-600">Henüz işlem yok</span>
      )}
    </div>
  );
};
