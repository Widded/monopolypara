import React from 'react';
import { ChevronRight, Landmark } from 'lucide-react';
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
  onSendMoney,
  onSelectPlayer,
}) => {
  const debts = Number(player.total_debt || 0);
  const isBankrupt = player.is_bankrupt === true;

  const safePlayerName =
    player.name && player.name.trim().length > 0 ? player.name.trim() : 'Oyuncu';
  const initial = safePlayerName.charAt(0).toUpperCase();

  const handleCardClick = () => {
    if (isBankrupt) {
      onSelectPlayer(player);
      return;
    }
    // Masada bir oyuncuya tıklandığında anında ona para gönderme akışı açılır
    if (onSendMoney) {
      onSendMoney(player);
    } else {
      onSelectPlayer(player);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="rounded-2xl bg-[#0E1218] hover:bg-[#131722] active:scale-[0.99] border border-white/[0.05] hover:border-white/[0.1] p-3.5 transition-all cursor-pointer flex items-center justify-between gap-3 select-none group"
    >
      {/* Sol: Avatar + İsim */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectPlayer(player);
          }}
          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border transition-all cursor-pointer ${
            isBankrupt
              ? 'bg-red-950/20 border-red-500/20 text-red-400'
              : 'bg-white/[0.04] border-white/[0.08] text-neutral-300 hover:border-white/[0.2] hover:text-white'
          }`}
          title="Oyuncu detaylarını gör"
        >
          {initial}
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-semibold text-sm text-white tracking-tight truncate ${
                isBankrupt ? 'line-through text-neutral-500' : ''
              }`}
            >
              {safePlayerName}
            </span>

            {player.is_banker && (
              <span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded-full font-medium flex items-center gap-1">
                <Landmark className="w-2.5 h-2.5" />
                <span>Bankacı</span>
              </span>
            )}

            {isBankrupt && (
              <span className="text-[10px] font-bold text-red-400 bg-red-500/20 border border-red-500/30 px-1.5 py-0.2 rounded-md">
                İFLAS
              </span>
            )}
          </div>

          {debts > 0 && !isBankrupt && (
            <div className="text-[10px] font-mono text-rose-400 mt-0.5">
              Borç: {formatMoney(debts)}
            </div>
          )}
        </div>
      </div>

      {/* Sağ: Bakiye + İnce Ok */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`font-bold text-base sm:text-lg text-white font-money tracking-tight tabular-nums ${
            isBankrupt ? 'line-through text-neutral-600' : ''
          }`}
        >
          {formatMoney(player.balance)}
        </span>
        <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
      </div>
    </div>
  );
};
