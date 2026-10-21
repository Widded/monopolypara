import React, { useEffect, useRef, useState } from 'react';
import { Send, Shield, User, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Player } from '../types';
import { formatMoney } from '../utils/formatters';

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer: boolean;
  onSendMoney: (player: Player) => void;
  onSelectPlayer: (player: Player) => void;
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
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [player.balance]);

  const receivables = player.total_receivable || 0;
  const debts = player.total_debt || 0;

  return (
    <div
      onClick={() => onSelectPlayer(player)}
      className={`card relative overflow-hidden cursor-pointer group hover:border-[#39424E] transition-all duration-200 ${
        isCurrentPlayer
          ? 'ring-1 ring-accent/30 bg-[#161a20]'
          : 'bg-bg-card'
      }`}
    >
      {/* Balance change subtle indicator pulse */}
      {balanceChange && (
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
            balanceChange === 'up'
              ? 'bg-money-pos/10 animate-pulse'
              : 'bg-money-neg/10 animate-pulse'
          }`}
        />
      )}

      {/* Top row: Player Name & Badges */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base text-text-main group-hover:text-accent transition-colors">
            {player.name}
          </span>

          {isCurrentPlayer && (
            <span className="bg-accent/15 text-accent border border-accent/30 text-[11px] font-medium px-2 py-0.5 rounded-full">
              Sen
            </span>
          )}

          {player.is_banker && (
            <span
              className="flex items-center gap-1 bg-[#1F2633] text-[#7E99D3] border border-[#2B3547] text-[10px] font-medium px-1.5 py-0.5 rounded-md"
              title="Oda Sahibi / Bankacı"
            >
              <Shield className="w-2.5 h-2.5 text-[#7E99D3]" />
              Bankacı
            </span>
          )}
        </div>

        <span className="text-[11px] text-text-muted flex items-center gap-1 group-hover:text-text-main transition-colors">
          <User className="w-3 h-3" />
          <span>Detay</span>
        </span>
      </div>

      {/* Center: Big, Bold Balance */}
      <div className="flex items-baseline justify-between my-2">
        <div>
          <div className="text-[11px] text-text-muted font-medium uppercase tracking-wider mb-0.5">
            Nakit Bakiye
          </div>
          <div
            className={`font-money font-bold text-2xl sm:text-3xl tracking-tight transition-colors duration-300 ${
              balanceChange === 'up'
                ? 'text-money-pos'
                : balanceChange === 'down'
                ? 'text-money-neg'
                : 'text-text-main'
            }`}
          >
            {formatMoney(player.balance)}
          </div>
        </div>

        {/* Quick Send Money Action Button */}
        {!isCurrentPlayer && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSendMoney(player);
            }}
            className="flex items-center gap-1.5 bg-bg-surface hover:bg-accent hover:text-bg-main text-text-main border border-border-subtle hover:border-accent text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-150 active:scale-95 shrink-0"
            title={`${player.name} adlı oyuncuya para gönder`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Para Gönder</span>
          </button>
        )}
      </div>

      {/* Bottom row: Alacak & Borç totals */}
      <div className="pt-2 border-t border-border-subtle/60 flex items-center justify-between text-xs text-text-muted">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-money-pos shrink-0" />
            <span>Alacak:</span>
            <span
              className={`font-money font-medium ${
                receivables > 0 ? 'text-money-pos' : 'text-text-muted'
              }`}
            >
              {formatMoney(receivables)}
            </span>
          </div>

          <span className="text-border-subtle">·</span>

          <div className="flex items-center gap-1">
            <ArrowDownLeft className="w-3 h-3 text-money-neg shrink-0" />
            <span>Borç:</span>
            <span
              className={`font-money font-medium ${
                debts > 0 ? 'text-money-neg' : 'text-text-muted'
              }`}
            >
              {formatMoney(debts)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
