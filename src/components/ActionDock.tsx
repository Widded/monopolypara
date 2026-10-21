import React from 'react';
import { Send, HandCoins, CheckSquare, History } from 'lucide-react';

interface ActionDockProps {
  onOpenTransfer: () => void;
  onOpenLendDebt: () => void;
  onOpenPayDebt: () => void;
  onOpenHistory: () => void;
  activeDebtsCount: number;
}

export const ActionDock: React.FC<ActionDockProps> = ({
  onOpenTransfer,
  onOpenLendDebt,
  onOpenPayDebt,
  onOpenHistory,
  activeDebtsCount,
}) => {
  return (
    <nav className="shrink-0 z-20 bg-bg-main/95 backdrop-blur-lg border-t border-border-subtle px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1.5">
        {/* 1. Para Gönder */}
        <button
          onClick={onOpenTransfer}
          className="flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl bg-bg-surface hover:bg-[#232832] active:bg-accent/15 border border-border-subtle active:scale-95 transition-all group"
        >
          <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
            <Send className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-semibold text-text-main truncate w-full text-center">
            Para Gönder
          </span>
        </button>

        {/* 2. Borç Ver */}
        <button
          onClick={onOpenLendDebt}
          className="flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl bg-bg-surface hover:bg-[#232832] active:bg-money-pos/15 border border-border-subtle active:scale-95 transition-all group"
        >
          <div className="w-7 h-7 rounded-lg bg-money-pos/15 border border-money-pos/30 flex items-center justify-center text-money-pos group-hover:scale-105 transition-transform">
            <HandCoins className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-semibold text-text-main truncate w-full text-center">
            Borç Ver
          </span>
        </button>

        {/* 3. Borç Öde */}
        <button
          onClick={onOpenPayDebt}
          className="flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl bg-bg-surface hover:bg-[#232832] active:bg-[#E6A23C]/15 border border-border-subtle active:scale-95 transition-all group relative"
        >
          {activeDebtsCount > 0 && (
            <span className="absolute top-1 right-2 min-w-3.5 h-3.5 px-1 bg-money-neg text-bg-main font-bold text-[9px] rounded-full flex items-center justify-center z-10 leading-none">
              {activeDebtsCount}
            </span>
          )}
          <div className="w-7 h-7 rounded-lg bg-[#E6A23C]/15 border border-[#E6A23C]/30 flex items-center justify-center text-[#E6A23C] group-hover:scale-105 transition-transform">
            <CheckSquare className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-semibold text-text-main truncate w-full text-center">
            Borç Öde
          </span>
        </button>

        {/* 4. Geçmiş */}
        <button
          onClick={onOpenHistory}
          className="flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl bg-bg-surface hover:bg-[#232832] active:bg-[#3A4252] border border-border-subtle active:scale-95 transition-all group"
        >
          <div className="w-7 h-7 rounded-lg bg-[#3A4252] border border-border-subtle flex items-center justify-center text-text-main group-hover:scale-105 transition-transform">
            <History className="w-3.5 h-3.5 text-text-muted" />
          </div>
          <span className="text-[10px] font-semibold text-text-main truncate w-full text-center">
            Geçmiş
          </span>
        </button>
      </div>
    </nav>
  );
};
