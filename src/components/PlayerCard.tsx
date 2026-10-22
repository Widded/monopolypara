import React from 'react';
import { Navigation, Landmark } from 'lucide-react';
import { Player } from '../types';
import { formatMoney } from '../utils/formatters';

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer?: boolean;
  rank?: number;
  onSendMoney?: (player: Player) => void;
  onSelectPlayer: (player: Player) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  rank,
  onSendMoney,
  onSelectPlayer,
}) => {
  const receivables = Number(player.total_receivable || 0);
  const debts = Number(player.total_debt || 0);
  const isBankrupt = player.is_bankrupt === true;

  const safePlayerName =
    player.name && player.name.trim().length > 0 ? player.name.trim() : 'İsimsiz Oyuncu';
  const initial = safePlayerName.charAt(0).toUpperCase();

  return (
    <div
      onClick={() => onSelectPlayer(player)}
      className="relative overflow-hidden rounded-2xl bg-[#0E1218] hover:bg-[#131722] active:scale-[0.99] border border-white/[0.06] hover:border-white/[0.12] p-3 sm:p-3.5 transition-all cursor-pointer flex items-center justify-between gap-3 select-none group"
    >
      {/* Sol: Yuvarlak Avatar + İsim + Badgeler */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border transition-colors ${
            isBankrupt
              ? 'bg-red-950/20 border-red-500/20 text-red-400'
              : 'bg-[#151922] border-white/[0.08] text-neutral-300 group-hover:border-white/[0.16]'
          }`}
        >
          {initial}
        </div>

        {/* Bilgi Kümesi */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {rank && (
              <span className="text-[10px] font-mono font-bold text-neutral-500">
                #{rank}
              </span>
            )}
            <span
              className={`font-bold text-[15px] text-white tracking-tight truncate ${
                isBankrupt ? 'line-through text-neutral-500' : ''
              }`}
            >
              {safePlayerName}
            </span>

            {/* Bankacı Rozeti */}
            {player.is_banker && (
              <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.2 rounded-md shrink-0 flex items-center gap-1">
                <Landmark className="w-2.5 h-2.5" />
                <span>Bankacı</span>
              </span>
            )}

            {/* İflas Rozeti */}
            {isBankrupt && (
              <span className="text-[10px] font-bold text-red-400 bg-red-500/20 border border-red-500/30 px-1.5 py-0.2 rounded-md shrink-0">
                İFLAS
              </span>
            )}
          </div>

          {/* Sadece aktif borç veya alacak varsa şık mini etiketler - 0 ise temiz tut */}
          {(debts > 0 || receivables > 0) && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono mt-0.5 flex-wrap">
              {debts > 0 && (
                <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.2 rounded">
                  Borç: {formatMoney(debts)}
                </span>
              )}
              {receivables > 0 && (
                <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                  Alacak: {formatMoney(receivables)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sağ: Bakiye + Hızlı Gönder Butonu */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span
          className={`font-black text-lg sm:text-xl text-white font-money tracking-tight tabular-nums ${
            isBankrupt ? 'line-through text-neutral-600' : ''
          }`}
        >
          {formatMoney(player.balance)}
        </span>

        {/* Doğrudan 1-Dokunuş Hızlı Gönder Butonu */}
        {!isBankrupt && onSendMoney && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSendMoney(player);
            }}
            className="py-1.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-400 text-emerald-400 hover:text-black font-bold text-xs border border-emerald-500/30 transition-all flex items-center gap-1 active:scale-95 shadow-sm cursor-pointer select-none"
            title={`${safePlayerName} adlı oyuncuya hızlı para gönder`}
          >
            <Navigation className="w-3.5 h-3.5 rotate-45 stroke-[2.5]" />
            <span>Gönder</span>
          </button>
        )}
      </div>
    </div>
  );
};
