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

  const receivables = Number(player.total_receivable || 0);
  const debts = Number(player.total_debt || 0);
  const safePlayerName = player.name && player.name.trim().length > 0 ? player.name.trim() : 'İsimsiz Oyuncu';

  return (
    <div
      onClick={() => onSelectPlayer(player)}
      className={`group px-3.5 py-3 rounded-xl transition-all duration-150 cursor-pointer select-none flex items-center justify-between gap-3 border ${
        isCurrentPlayer
          ? 'bg-[#151A27]/90 hover:bg-[#182032] border-[#252E44]/90 shadow-sm'
          : 'bg-[#0E121B]/40 hover:bg-[#131825]/60 border-border-subtle/50'
      }`}
    >
      {/* Sol: Oyuncu Kimliği ve Durum Bilgileri */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Oyuncu Adı - Daima gerçek oyuncu adı alanı */}
          <span className="font-semibold text-[15px] text-text-main tracking-tight truncate">
            {safePlayerName}
          </span>

          {/* Sen Göstergesi (Yalnızca kullanıcı kendisiyse) */}
          {isCurrentPlayer && (
            <span className="text-[10px] font-semibold text-accent/90 bg-accent/10 px-1.5 py-0.5 rounded tracking-wide shrink-0">
              Sen
            </span>
          )}

          {/* Bankacı Göstergesi (Yalnızca bankacıysa) */}
          {player.is_banker && (
            <span className="text-[10px] font-medium text-[#8EA3D0] bg-[#141A29] border border-[#212C45] px-1.5 py-0.5 rounded tracking-wide shrink-0">
              Bankacı
            </span>
          )}
        </div>

        {/* Alacak / Borç bilgisi (varsa çok temiz ve ikincil) */}
        {(receivables > 0 || debts > 0) && (
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-muted">
            {receivables > 0 && (
              <span className="font-money text-money-pos">
                +{formatMoney(receivables)} alacak
              </span>
            )}
            {receivables > 0 && debts > 0 && (
              <span className="text-text-subtle text-[10px]">·</span>
            )}
            {debts > 0 && (
              <span className="font-money text-money-neg">
                -{formatMoney(debts)} borç
              </span>
            )}
          </div>
        )}
      </div>

      {/* Sağ: Bakiye ve Hızlı Aksiyon Butonu */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <div
            className={`font-money font-extrabold text-[18px] tracking-tight tabular-nums transition-colors duration-200 ${
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
            className="text-xs font-semibold text-text-muted hover:text-text-main bg-bg-surface hover:bg-bg-hover border border-border-subtle/80 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer shrink-0"
            title={`${safePlayerName} adlı oyuncuya para gönder`}
          >
            Gönder
          </button>
        )}
      </div>
    </div>
  );
};
