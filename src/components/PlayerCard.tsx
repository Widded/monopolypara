import React from 'react';
import { Landmark } from 'lucide-react';
import { Player } from '../types';
import { formatMoney } from '../utils/formatters';

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer?: boolean;
  onSendMoney?: (player: Player) => void;
  onSelectPlayer: (player: Player) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  onSelectPlayer,
}) => {
  const debts = Number(player.total_debt || 0);
  const isBankrupt = player.is_bankrupt === true;

  const safePlayerName =
    player.name && player.name.trim().length > 0 ? player.name.trim() : 'Oyuncu';
  const initial = safePlayerName.charAt(0).toUpperCase();

  return (
    <div
      onClick={() => onSelectPlayer(player)}
      className="rounded-2xl bg-[#0E1218] hover:bg-[#131722] active:scale-[0.98] border border-white/[0.06] hover:border-white/[0.14] p-3.5 transition-all cursor-pointer flex flex-col justify-between select-none group min-h-[110px] aspect-[1/0.95] sm:aspect-square"
    >
      {/* Üst Satır: Avatar + (Varsa Bankacı / İflas) */}
      <div className="flex items-center justify-between gap-1.5">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border transition-all ${
            isBankrupt
              ? 'bg-red-950/20 border-red-500/20 text-red-400'
              : 'bg-white/[0.04] border-white/[0.08] text-neutral-200 group-hover:border-white/[0.16]'
          }`}
        >
          {initial}
        </div>

        {player.is_banker && (
          <span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 shrink-0">
            <Landmark className="w-2.5 h-2.5" />
            <span>Bankacı</span>
          </span>
        )}

        {isBankrupt && (
          <span className="text-[10px] font-bold text-red-400 bg-red-500/20 border border-red-500/30 px-1.5 py-0.5 rounded-md shrink-0">
            İFLAS
          </span>
        )}
      </div>

      {/* Alt Bölüm: İsim + Büyük Bakiye */}
      <div className="mt-2 min-w-0">
        <div
          className={`font-semibold text-sm text-neutral-300 group-hover:text-white transition-colors truncate tracking-tight ${
            isBankrupt ? 'line-through text-neutral-500' : ''
          }`}
        >
          {safePlayerName}
        </div>

        <div
          className={`text-lg sm:text-xl font-black font-money tracking-tight tabular-nums mt-0.5 ${
            isBankrupt ? 'line-through text-neutral-600' : 'text-white'
          }`}
        >
          {formatMoney(player.balance)}
        </div>

        {debts > 0 && !isBankrupt && (
          <div className="text-[10px] font-mono text-rose-400 truncate mt-0.5">
            Borç: {formatMoney(debts)}
          </div>
        )}
      </div>
    </div>
  );
};
