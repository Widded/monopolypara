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
      <nav className="max-w-md mx-auto pointer-events-auto bg-[#0E1218]/95 backdrop-blur-xl border border-white/[0.1] rounded-3xl p-1.5 shadow-2xl shadow-black/80 flex items-center justify-between">
        {/* 1. Para Gönder */}
        <button
          type="button"
          onClick={onOpenTransfer}
          className="flex-1 flex flex-col items-center justify-center py-2 px-1 text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer group active:scale-95 select-none"
        >
          <Navigation className="w-5 h-5 mb-1 stroke-[2.2] rotate-45 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-semibold tracking-tight">Para Gönder</span>
        </button>

        {/* Dikey İnce Bölücü */}
        <div className="h-6 w-[1px] bg-white/[0.08] shrink-0" />

        {/* 2. Borç Ver */}
        <button
          type="button"
          onClick={onOpenLendDebt}
          className="flex-1 flex flex-col items-center justify-center py-2 px-1 text-neutral-400 hover:text-white transition-all cursor-pointer group active:scale-95 select-none"
        >
          <Users className="w-5 h-5 mb-1 stroke-[1.8] group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-medium tracking-tight">Borç Ver</span>
        </button>

        {/* Dikey İnce Bölücü */}
        <div className="h-6 w-[1px] bg-white/[0.08] shrink-0" />

        {/* 3. Borç Öde */}
        <button
          type="button"
          onClick={onOpenPayDebt}
          className="flex-1 flex flex-col items-center justify-center py-2 px-1 text-neutral-400 hover:text-white transition-all cursor-pointer group active:scale-95 select-none relative"
        >
          <div className="relative">
            <CheckSquare className="w-5 h-5 mb-1 stroke-[1.8] group-hover:scale-110 transition-transform" />
            {activeDebtsCount > 0 && (
              <span
                className="w-2 h-2 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5 ring-2 ring-[#0E1218] animate-pulse"
                title={`${activeDebtsCount} açık borç var`}
              />
            )}
          </div>
          <span className="text-[11px] font-medium tracking-tight">Borç Öde</span>
        </button>

        {/* Dikey İnce Bölücü */}
        <div className="h-6 w-[1px] bg-white/[0.08] shrink-0" />

        {/* 4. Geçmiş */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="flex-1 flex flex-col items-center justify-center py-2 px-1 text-neutral-400 hover:text-white transition-all cursor-pointer group active:scale-95 select-none"
        >
          <Clock className="w-5 h-5 mb-1 stroke-[1.8] group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-medium tracking-tight">Geçmiş</span>
        </button>
      </nav>
    </div>
  );
};
