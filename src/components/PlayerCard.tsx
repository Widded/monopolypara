import React, { useEffect, useRef, useState } from 'react';
import { Shield, ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
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
      className={`card relative overflow-hidden cursor-pointer active:scale-[0.99] transition-all p-3 rounded-xl border ${
        isCurrentPlayer
          ? 'border-accent/40 bg-[#161a20]'
          : 'border-border-subtle bg-bg-card hover:border-[#39424E]'
      }`}
    >
      {/* Pulse flash effect on balance change */}
      {balanceChange && (
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
            balanceChange === 'up'
              ? 'bg-money-pos/10 animate-pulse'
              : 'bg-money-neg/10 animate-pulse'
          }`}
        />
      )}

      {/* Row 1: Player Name + Badges + Chevron */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold text-sm text-text-main truncate">
            {player.name}
          </span>

          {isCurrentPlayer && (
            <span className="bg-accent/15 text-accent border border-accent/30 text-[10px] font-semibold px-1.5 py-0.2 rounded-full">
              Sen
            </span>
          )}

          {player.is_banker && (
            <span className="flex items-center gap-0.5 bg-[#1F2633] text-[#7E99D3] border border-[#2B3547] text-[10px] font-medium px-1.5 py-0.2 rounded">
              <Shield className="w-2.5 h-2.5 text-[#7E99D3]" />
              Bankacı
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {player.recovery_pin && (
            <span
              className="text-[10px] font-mono font-bold text-text-muted/80 bg-bg-surface border border-border-subtle/80 px-1.5 py-0.5 rounded"
              title="Oyuncu Kurtarma Kodu (Geri Katılma)"
            >
              PIN: {player.recovery_pin}
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-text-muted/60" />
        </div>
      </div>

      {/* Row 2: Big Bold Balance */}
      <div className="my-1">
        <div
          className={`font-money font-bold text-2xl tracking-tight leading-tight transition-colors duration-200 ${
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

      {/* Row 3: Alacak & Borç totals */}
      <div className="flex items-center gap-2.5 pt-1.5 border-t border-border-subtle/50 text-[11px] text-text-muted">
        <div className="flex items-center gap-1">
          <ArrowUpRight className="w-3 h-3 text-money-pos shrink-0" />
          <span>Alacak:</span>
          <span
            className={`font-money font-semibold ${
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
            className={`font-money font-semibold ${
              debts > 0 ? 'text-money-neg' : 'text-text-muted'
            }`}
          >
            {formatMoney(debts)}
          </span>
        </div>
      </div>
    </div>
  );
};
