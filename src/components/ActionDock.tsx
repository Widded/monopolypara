import React from 'react';
import { Navigation, Users, CheckSquare, Clock } from 'lucide-react';

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
    <div className="fixed bottom-3 left-0 right-0 z-40 px-4 pointer-events-none pb-[env(safe-area-inset-bottom)]">
      <nav className="max-w-xs mx-auto pointer-events-auto bg-[#0E1218]/95 backdrop-blur-xl border border-white/[0.08] rounded-full px-2 py-1.5 shadow-2xl shadow-black/90 flex items-center justify-around">
        {/* 1. Para Gönder */}
        <button
          type="button"
          onClick={onOpenTransfer}
          className="flex flex-col items-center justify-center p-2 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer active:scale-90 select-none"
          title="Para Gönder"
        >
          <Navigation className="w-5 h-5 rotate-45 stroke-[2.2]" />
          <span className="text-[10px] font-bold mt-0.5">Gönder</span>
        </button>

        {/* 2. Borç Ver */}
        <button
          type="button"
          onClick={onOpenLendDebt}
          className="flex flex-col items-center justify-center p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer active:scale-90 select-none"
          title="Borç Ver"
        >
          <Users className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] font-medium mt-0.5">Borç Ver</span>
        </button>

        {/* 3. Borç Öde */}
        <button
          type="button"
          onClick={onOpenPayDebt}
          className="flex flex-col items-center justify-center p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer active:scale-90 select-none relative"
          title="Borç Öde"
        >
          <div className="relative">
            <CheckSquare className="w-5 h-5 stroke-[1.8]" />
            {activeDebtsCount > 0 && (
              <span
                className="w-2 h-2 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5 animate-pulse"
                title={`${activeDebtsCount} açık borç var`}
              />
            )}
          </div>
          <span className="text-[10px] font-medium mt-0.5">Borç Öde</span>
        </button>

        {/* 4. Geçmiş */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="flex flex-col items-center justify-center p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer active:scale-90 select-none"
          title="İşlem Geçmişi"
        >
          <Clock className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] font-medium mt-0.5">Geçmiş</span>
        </button>
      </nav>
    </div>
  );
};
