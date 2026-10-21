import React, { useEffect, useRef, useState } from 'react';
import { Send, Shield } from 'lucide-react';
import { Player } from '../types';
import { formatMoney } from '../utils/formatters';

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer: boolean;
  onSendMoney: (player: Player) => void;
  onSelectPlayer: (player: Player) => void;
}

// Deterministic player token gradient & styling
function getPlayerTokenStyle(name: string, isCurrentPlayer: boolean) {
  if (isCurrentPlayer) {
    return {
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/40',
      text: 'text-emerald-300',
    };
  }
  const styles = [
    { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-300' },
    { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-300' },
    { bg: 'bg-rose-500/20', border: 'border-rose-500/40', text: 'text-rose-300' },
    { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-300' },
    { bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', text: 'text-cyan-300' },
    { bg: 'bg-teal-500/20', border: 'border-teal-500/40', text: 'text-teal-300' },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return styles[Math.abs(hash) % styles.length];
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentPlayer,
  onSendMoney,
  onSelectPlayer,
}) => {
  const prevBalanceRef = useRef(player.balance);
  const [balanceChange, setBalanceChange] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (prevBalanceRef.current !== player.balance) {
      const diff = player.balance - prevBalanceRef.current;
      setBalanceChange(diff > 0 ? 'up' : 'down');
      prevBalanceRef.current = player.balance;

      const timer = setTimeout(() => {
        setBalanceChange(null);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [player.balance]);

  const receivables = Number(player.total_receivable || 0);
  const debts = Number(player.total_debt || 0);
  const safePlayerName = player.name && player.name.trim().length > 0 ? player.name.trim() : 'İsimsiz Oyuncu';
  const initial = safePlayerName.charAt(0).toUpperCase();
  const tokenStyle = getPlayerTokenStyle(safePlayerName, isCurrentPlayer);

  return (
    <div
      onClick={() => onSelectPlayer(player)}
      className={`group rounded-2xl p-3 sm:p-3.5 transition-all duration-150 cursor-pointer select-none flex items-center justify-between gap-3 border active:scale-[0.99] ${
        isCurrentPlayer
          ? 'bg-gradient-to-r from-[#141F2C] via-[#111724] to-[#0D121D] border-emerald-500/35 shadow-md shadow-emerald-950/20'
          : 'bg-gradient-to-r from-[#121624]/90 to-[#0E111B]/90 hover:from-[#161B2C] hover:to-[#111624] border-white/[0.07] hover:border-white/[0.14] shadow-sm'
      }`}
    >
      {/* Sol: Avatar Tokeni + İsim + Rozetler */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Oyuncu Karakter Avatarı */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border shadow-inner ${tokenStyle.bg} ${tokenStyle.border} ${tokenStyle.text} relative`}
        >
          {initial}
          {isCurrentPlayer && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#141F2C] absolute -top-1 -right-1 shadow-sm" />
          )}
        </div>

        {/* İsim ve Durum */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-[15px] text-white tracking-tight truncate">
              {safePlayerName}
            </span>

            {/* Sen Rozeti */}
            {isCurrentPlayer && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-md tracking-wider shrink-0">
                SEN
              </span>
            )}

            {/* Bankacı Rozeti */}
            {player.is_banker && (
              <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded-md tracking-wide shrink-0 flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-amber-400" />
                <span>Bankacı</span>
              </span>
            )}
          </div>

          {/* Borç & Alacak Detayları: "Borcu var: x Alacağı var: x" */}
          <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
            <div className={`inline-flex items-center gap-1 text-[11px] ${debts > 0 ? 'bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 rounded-md' : ''}`}>
              <span className={debts > 0 ? 'text-rose-200 font-medium' : 'text-text-muted'}>Borcu var:</span>
              <span className="font-money font-bold text-rose-400">
                {formatMoney(debts)}
              </span>
            </div>

            <span className="text-white/20 text-[10px]">·</span>

            <div className={`inline-flex items-center gap-1 text-[11px] ${receivables > 0 ? 'bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md' : ''}`}>
              <span className={receivables > 0 ? 'text-emerald-200 font-medium' : 'text-text-muted'}>Alacağı var:</span>
              <span className="font-money font-bold text-emerald-400">
                {formatMoney(receivables)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sağ: Bakiye ve Hızlı Para Gönder Butonu */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="text-right">
          <div
            className={`font-money font-extrabold text-[19px] sm:text-[20px] tracking-tight tabular-nums transition-colors duration-200 ${
              balanceChange === 'up'
                ? 'text-emerald-400'
                : balanceChange === 'down'
                ? 'text-rose-400'
                : 'text-white'
            }`}
          >
            {formatMoney(player.balance)}
          </div>
        </div>

        {!isCurrentPlayer && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSendMoney(player);
            }}
            className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
            title={`${safePlayerName} adlı oyuncuya para gönder`}
          >
            <Send className="w-3 h-3 stroke-[2.2]" />
            <span>Gönder</span>
          </button>
        )}
      </div>
    </div>
  );
};

