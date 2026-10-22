import React from 'react';
import { Coins, ChevronRight, ArrowRight } from 'lucide-react';
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
    <div className="bg-[#0E1218] border border-white/[0.08] rounded-2xl p-3 sm:p-3.5 shadow-lg flex items-center justify-between gap-3 select-none">
      {/* Sol: Masadaki Toplam Nakit */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="text-[10px] sm:text-[11px] font-semibold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
          <Coins className="w-3.5 h-3.5 text-emerald-400" />
          <span>Masa Toplamı</span>
        </div>
        <div className="text-xl sm:text-2xl font-black text-white font-money tracking-tight tabular-nums mt-0.5 truncate">
          {formatMoney(totalCash)}
        </div>
      </div>

      {/* Dikey İnce Bölücü Çizgi */}
      <div className="w-[1px] bg-white/[0.08] self-stretch my-0.5 shrink-0" />

      {/* Sağ: Son İşlem & Geçmişe Açılış */}
      <button
        type="button"
        onClick={onOpenHistory}
        className="flex-1 min-w-0 pl-1 text-left group cursor-pointer select-none focus:outline-none"
        title="Tüm işlem geçmişini gör"
      >
        <div className="text-[10px] sm:text-[11px] font-semibold text-neutral-400 flex items-center justify-between uppercase tracking-wider">
          <span>Son Hareket</span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
        </div>

        {lastTransaction ? (
          <div className="mt-0.5 min-w-0">
            <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
              <span className="truncate max-w-[65px] sm:max-w-[75px]">
                {lastTransaction.from_player_name || 'Oyuncu'}
              </span>
              <ArrowRight className="w-2.5 h-2.5 text-neutral-500 shrink-0" />
              <span className="truncate max-w-[65px] sm:max-w-[75px]">
                {lastTransaction.to_player_name || 'Oyuncu'}
              </span>
              <span className="text-emerald-400 font-bold ml-auto shrink-0 font-mono text-[11px] sm:text-xs">
                {formatMoney(lastTransaction.amount)}
              </span>
            </div>
            <span className="text-[10px] text-neutral-500 block mt-0.5">
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
  );
};
