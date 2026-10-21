import React from 'react';
import { History, ArrowRight, Wallet } from 'lucide-react';
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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#141926] via-[#101420] to-[#0D101A] border border-white/[0.08] p-4 shadow-xl shadow-black/40">
      {/* İnce ambient köşe parıltısı */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/[0.04] rounded-full blur-2xl pointer-events-none" />

      {/* Üst Kısım: Masa Toplamı */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 mb-1">
            <Wallet className="w-3 h-3 text-emerald-400" />
            <span>Masa Nakit Havuzu</span>
          </div>
          <div className="font-money font-extrabold text-[28px] sm:text-3xl tracking-tight text-white leading-none">
            {formatMoney(totalCash)}
          </div>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-2.5 py-1 text-right shrink-0">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
            Masada
          </span>
          <span className="text-xs font-bold text-white">
            {playerCount} Oyuncu
          </span>
        </div>
      </div>

      {/* Alt Kısım: Son İşlem Ticker Şeridi */}
      <div className="mt-3.5 pt-2.5 border-t border-white/[0.06] flex items-center justify-between gap-2 text-xs">
        <button
          type="button"
          onClick={onOpenHistory}
          className="flex-1 flex items-center gap-1.5 min-w-0 text-left group cursor-pointer hover:opacity-90 transition-opacity"
          title="Tüm işlem geçmişini aç"
        >
          <span className="text-[10px] font-bold text-text-subtle uppercase tracking-wider shrink-0">
            Son İşlem:
          </span>
          {lastTransaction ? (
            <div className="text-xs text-text-muted group-hover:text-white transition-colors truncate">
              <span className="font-semibold text-text-main">
                {lastTransaction.from_player_name || 'Oyuncu'}
              </span>
              <span className="text-text-subtle mx-1">→</span>
              <span className="font-semibold text-text-main">
                {lastTransaction.to_player_name || 'Oyuncu'}
              </span>{' '}
              <strong className="font-money font-bold text-emerald-400 ml-0.5">
                {formatMoney(lastTransaction.amount)}
              </strong>
            </div>
          ) : (
            <span className="text-xs text-text-subtle">Henüz işlem yapılmadı</span>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenHistory}
          className="flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-white transition-colors shrink-0 py-0.5 px-1.5 rounded-md hover:bg-white/[0.05]"
        >
          <History className="w-3 h-3 text-text-subtle" />
          <span>Geçmiş</span>
          <ArrowRight className="w-3 h-3 text-text-subtle" />
        </button>
      </div>
    </div>
  );
};


