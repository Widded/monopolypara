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
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-bg-main/95 backdrop-blur-lg border-t border-border-subtle p-3 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
        {/* 1. Para Gönder */}
        <button
          onClick={onOpenTransfer}
          className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-bg-surface hover:bg-[#232832] border border-border-subtle active:scale-95 transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
            <Send className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-text-main truncate">
            Para Gönder
          </span>
        </button>

        {/* 2. Borç Ver */}
        <button
          onClick={onOpenLendDebt}
          className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-bg-surface hover:bg-[#232832] border border-border-subtle active:scale-95 transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-money-pos/15 border border-money-pos/30 flex items-center justify-center text-money-pos group-hover:scale-105 transition-transform">
            <HandCoins className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-text-main truncate">
            Borç Ver
          </span>
        </button>

        {/* 3. Borç Öde */}
        <button
          onClick={onOpenPayDebt}
          className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-bg-surface hover:bg-[#232832] border border-border-subtle active:scale-95 transition-all group relative"
        >
          {activeDebtsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-money-neg text-bg-main font-bold text-[9px] rounded-full flex items-center justify-center">
              {activeDebtsCount}
            </span>
          )}
          <div className="w-8 h-8 rounded-lg bg-[#E6A23C]/15 border border-[#E6A23C]/30 flex items-center justify-center text-[#E6A23C] group-hover:scale-105 transition-transform">
            <CheckSquare className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-text-main truncate">
            Borç Öde
          </span>
        </button>

        {/* 4. Geçmiş */}
        <button
          onClick={onOpenHistory}
          className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-bg-surface hover:bg-[#232832] border border-border-subtle active:scale-95 transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#3A4252] border border-border-subtle flex items-center justify-center text-text-main group-hover:scale-105 transition-transform">
            <History className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-text-main truncate">
            Geçmiş
          </span>
        </button>
      </div>
    </div>
  );
};
