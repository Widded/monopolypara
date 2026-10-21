import React from 'react';
import { ChevronRight, Landmark } from 'lucide-react';
import { Player } from '../types';
import { formatMoney } from '../utils/formatters';

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer: boolean;
  onSendMoney?: (player: Player) => void;
  onSelectPlayer: (player: Player) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentPlayer,
  onSelectPlayer,
}) => {
  const receivables = Number(player.total_receivable || 0);
  const debts = Number(player.total_debt || 0);
  const net = receivables - debts;

  const safePlayerName =
    player.name && player.name.trim().length > 0 ? player.name.trim() : 'İsimsiz Oyuncu';
  const initial = safePlayerName.charAt(0).toUpperCase();

  return (
    <div
      onClick={() => onSelectPlayer(player)}
      className="relative overflow-hidden rounded-2xl bg-[#11141B] hover:bg-[#141822] active:scale-[0.99] border border-white/[0.06] p-3.5 transition-all cursor-pointer flex items-center justify-between gap-3 select-none"
    >
      {/* Sen (Geçerli Oyuncu) için Sol Kenar Canlı Neon Çizgisi */}
      {isCurrentPlayer && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 rounded-l-2xl shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
      )}

      {/* Sol: Yuvarlak Avatar + İsim Satırı + Bankacı + Alacak/Borç/Net */}
      <div className={`flex items-center gap-3 min-w-0 flex-1 ${isCurrentPlayer ? 'pl-1' : ''}`}>
        {/* Dairesel Avatar */}
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shrink-0 border ${
            isCurrentPlayer
              ? 'bg-[#132820] border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
              : 'bg-[#1a202c] border-white/[0.08] text-neutral-300'
          }`}
        >
          {initial}
        </div>

        {/* Bilgi Kümesi */}
        <div className="min-w-0 flex-1">
          {/* İsim + Sen Rozeti + İflas */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-bold text-[15px] text-white tracking-tight truncate ${
                player.is_bankrupt ? 'line-through text-neutral-400' : ''
              }`}
            >
              {safePlayerName}
            </span>

            {isCurrentPlayer && (
              <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.2 rounded-full shrink-0">
                Sen
              </span>
            )}

            {player.is_bankrupt && (
              <span className="text-[10px] font-bold text-red-400 bg-red-500/20 border border-red-500/30 px-1.5 py-0.2 rounded-md shrink-0">
                İFLAS
              </span>
            )}
          </div>

          {/* Bankacı Satırı */}
          {player.is_banker && (
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-0.5">
              <Landmark className="w-3 h-3 text-neutral-400 shrink-0" />
              <span>Bankacı</span>
            </div>
          )}

          {/* Alacak | Borç | Net İnce Satırı */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-1 flex-wrap font-mono">
            <span>Alacak: {formatMoney(receivables)}</span>
            <span className="text-white/20 select-none">|</span>
            <span>Borç: {formatMoney(debts)}</span>
            <span className="text-white/20 select-none">|</span>
            <span className={net > 0 ? 'text-emerald-400' : net < 0 ? 'text-rose-400' : 'text-neutral-400'}>
              Net: {formatMoney(net)}
            </span>
          </div>
        </div>
      </div>

      {/* Sağ: Büyük Bakiye + Ok (Chevron) */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`font-extrabold text-xl text-white font-mono tracking-tight tabular-nums ${
            player.is_bankrupt ? 'line-through text-neutral-500' : ''
          }`}
        >
          {formatMoney(player.balance)}
        </span>
        <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
      </div>
    </div>
  );
};
