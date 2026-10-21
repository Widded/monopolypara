import React from 'react';
import { Send, History } from 'lucide-react';

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
    <nav className="shrink-0 z-20 bg-bg-main border-t border-border-subtle px-3.5 pt-2.5 pb-[calc(0.7rem+env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto flex items-center gap-2">
        {/* 1. Birincil Eylem: Para Gönder */}
        <button
          type="button"
          onClick={onOpenTransfer}
          className="btn-primary flex-1 py-2.5 px-3 text-xs font-bold"
        >
          <Send className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Para Gönder</span>
        </button>

        {/* 2. İkincil Eylem: Borç Ver */}
        <button
          type="button"
          onClick={onOpenLendDebt}
          className="btn-secondary py-2.5 px-3 text-xs font-semibold text-text-main"
        >
          Borç Ver
        </button>

        {/* 3. İkincil Eylem: Borç Öde */}
        <button
          type="button"
          onClick={onOpenPayDebt}
          className="btn-secondary relative py-2.5 px-3 text-xs font-semibold text-text-main"
        >
          <span>Borç Öde</span>
          {activeDebtsCount > 0 && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-money-neg absolute top-2 right-2"
              title={`${activeDebtsCount} açık borç var`}
            />
          )}
        </button>

        {/* 4. Geçmiş */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="btn-secondary py-2.5 px-3 text-xs text-text-muted hover:text-text-main"
          title="İşlem Geçmişi"
        >
          <History className="w-3.5 h-3.5" />
        </button>
      </div>
    </nav>
  );
};
