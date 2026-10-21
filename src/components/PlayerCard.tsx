import React, { useEffect, useRef, useState } from 'react';
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
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [player.balance]);

  const receivables = player.total_receivable || 0;
  const debts = player.total_debt || 0;

  return (
    <div
      onClick={() => onSelectPlayer(player)}
      className={`py-3 px-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
        isCurrentPlayer
          ? 'bg-bg-surface/60 hover:bg-bg-surface/90 rounded-lg my-0.5 border border-border-subtle'
          : 'hover:bg-bg-surface/30 rounded-lg'
      }`}
    >
      {/* Sol: İsim ve Alacak/Borç Detayı */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5 truncate">
          <span className="font-bold text-[15px] text-text-main tracking-tight truncate">
            {player.name}
          </span>

          {isCurrentPlayer && (
            <span className="text-[11px] font-semibold text-accent shrink-0">
              (Sen)
            </span>
          )}

          {player.is_banker && (
            <span className="text-[10px] font-medium text-[#7E99D3] shrink-0">
              · Bankacı
            </span>
          )}
        </div>

        {/* Alacak / Borç özeti (yalnızca varsa temiz şekilde gösterilir) */}
        {(receivables > 0 || debts > 0) && (
          <div className="flex items-baseline gap-2 mt-0.5 text-[11px] text-text-muted">
            {receivables > 0 && (
              <span className="font-money text-money-pos">
                +{formatMoney(receivables)} alacak
              </span>
            )}
            {receivables > 0 && debts > 0 && (
              <span className="text-text-subtle">·</span>
            )}
            {debts > 0 && (
              <span className="font-money text-money-neg">
                -{formatMoney(debts)} borç
              </span>
            )}
          </div>
        )}
      </div>

      {/* Sağ: Bakiye ve Hızlı Aksiyon */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="text-right">
          <div
            className={`font-money font-bold text-[17px] tracking-tight transition-colors duration-200 ${
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

        {!isCurrentPlayer && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSendMoney(player);
            }}
            className="text-[11px] font-medium text-text-muted hover:text-text-main bg-bg-surface hover:bg-bg-hover border border-border-subtle px-2.5 py-1 rounded transition-all active:scale-95 cursor-pointer shrink-0"
          >
            Gönder
          </button>
        )}
      </div>
    </div>
  );
};
