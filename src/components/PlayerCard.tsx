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
      bg: 'bg-accent/20',
      border: 'border-accent/40',
      text: 'text-accent',
    };
  }
  const styles = [
    { bg: 'bg-blue-500/15', border: 'border-blue-500/30', text: 'text-blue-300' },
    { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-300' },
    { bg: 'bg-purple-500/15', border: 'border-purple-500/30', text: 'text-purple-300' },
    { bg: 'bg-slate-500/15', border: 'border-slate-400/30', text: 'text-slate-300' },
    { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-300' },
    { bg: 'bg-indigo-500/15', border: 'border-indigo-500/30', text: 'text-indigo-300' },
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
          ? 'bg-bg-surface/90 hover:bg-bg-surface border-accent/40 shadow-lg shadow-black/30 ring-1 ring-accent/20'
          : 'bg-bg-surface/40 hover:bg-bg-surface/80 border-border-subtle hover:border-border-active shadow-sm'
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
            <span className="w-2.5 h-2.5 rounded-full bg-accent border-2 border-bg-card absolute -top-1 -right-1 shadow-sm" />
          )}
        </div>

        {/* İsim ve Durum */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-[15px] text-text-main tracking-tight truncate">
              {safePlayerName}
            </span>

            {/* Sen Rozeti */}
            {isCurrentPlayer && (
              <span className="text-[10px] font-bold text-accent bg-accent/15 border border-accent/30 px-1.5 py-0.2 rounded-md tracking-wider shrink-0">
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

            {/* İflas Rozeti */}
            {player.is_bankrupt && (
              <span className="text-[10px] font-bold text-red-400 bg-red-500/20 border border-red-500/30 px-1.5 py-0.2 rounded-md tracking-wider shrink-0">
                İFLAS
              </span>
            )}
          </div>

          {/* Borç & Alacak Detayları: 0 ₺ ise nötr gri, >0 ise renkli */}
          <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
            <div className={`inline-flex items-center gap-1 text-[11px] ${debts > 0 ? 'bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 rounded-md' : ''}`}>
              <span className={debts > 0 ? 'text-rose-200 font-medium' : 'text-text-muted'}>Borcu var:</span>
              <span className={`font-money font-bold ${debts > 0 ? 'text-rose-400' : 'text-text-subtle'}`}>
                {formatMoney(debts)}
              </span>
            </div>

            <span className="text-border-subtle text-[10px]">·</span>

            <div className={`inline-flex items-center gap-1 text-[11px] ${receivables > 0 ? 'bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md' : ''}`}>
              <span className={receivables > 0 ? 'text-emerald-200 font-medium' : 'text-text-muted'}>Alacağı var:</span>
              <span className={`font-money font-bold ${receivables > 0 ? 'text-emerald-400' : 'text-text-subtle'}`}>
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
              player.is_bankrupt
                ? 'text-text-muted line-through'
                : balanceChange === 'up'
                ? 'text-money-pos'
                : balanceChange === 'down'
                ? 'text-money-neg'
                : 'text-text-main'
            }`}
          >
            {formatMoney(player.balance)}
          </div>
        </div>

        {!isCurrentPlayer && !player.is_bankrupt && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSendMoney(player);
            }}
            className="flex items-center gap-1 text-xs font-bold text-accent bg-accent/15 hover:bg-accent/25 border border-accent/30 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
            title={`${safePlayerName} adlı oyuncuya para gönder`}
          >
            <Send className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Gönder</span>
          </button>
        )}
      </div>
    </div>
  );
};

