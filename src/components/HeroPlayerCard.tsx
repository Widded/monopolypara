import React from 'react';
import { Landmark } from 'lucide-react';
import { Player } from '../types';
import { formatMoney } from '../utils/formatters';

interface HeroPlayerCardProps {
  player: Player;
  onSelectPlayer: (player: Player) => void;
}

export const HeroPlayerCard: React.FC<HeroPlayerCardProps> = ({
  player,
  onSelectPlayer,
}) => {
  const safePlayerName =
    player.name && player.name.trim().length > 0 ? player.name.trim() : 'Oyuncu';

  const receivables = Number(player.total_receivable || 0);
  const debts = Number(player.total_debt || 0);

  return (
    <div
      onClick={() => onSelectPlayer(player)}
      className="rounded-3xl bg-[#0E1218] border border-white/[0.06] hover:border-white/[0.12] p-5 shadow-xl select-none cursor-pointer transition-all active:scale-[0.99] group"
    >
      {/* Üst Satır: İsim + Varsa Bankacı */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-neutral-300 tracking-tight">
            {safePlayerName}
          </span>
          {player.is_banker && (
            <span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Landmark className="w-2.5 h-2.5" />
              <span>Bankacı</span>
            </span>
          )}
        </div>
        <span className="text-[11px] text-neutral-500 group-hover:text-neutral-300 transition-colors">
          Detay ›
        </span>
      </div>

      {/* Dev Bakiye */}
      <div className="text-4xl sm:text-5xl font-black font-money text-white tracking-tight tabular-nums mt-2 mb-1">
        {formatMoney(player.balance)}
      </div>

      {/* Yalnızca Borç veya Alacak varsa tek satır göster */}
      {(debts > 0 || receivables > 0) && (
        <div className="flex items-center gap-2 text-xs font-mono pt-1 text-neutral-400">
          {receivables > 0 && (
            <span className="text-emerald-400">+{formatMoney(receivables)} alacak</span>
          )}
          {receivables > 0 && debts > 0 && <span className="text-white/20">•</span>}
          {debts > 0 && (
            <span className="text-rose-400">-{formatMoney(debts)} borç</span>
          )}
        </div>
      )}
    </div>
  );
};
