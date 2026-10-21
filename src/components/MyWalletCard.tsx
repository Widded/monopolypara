import React from 'react';
import { Shield, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Player } from '../types';
import { formatMoney } from '../utils/formatters';

interface MyWalletCardProps {
  player: Player;
  onOpenTransfer: () => void;
  onOpenLendDebt: () => void;
  onOpenPayDebt: () => void;
  onSelectSelf: () => void;
}

export const MyWalletCard: React.FC<MyWalletCardProps> = ({
  player,
  onSelectSelf,
}) => {
  const receivables = player.total_receivable || 0;
  const debts = player.total_debt || 0;
  const netWorth = player.balance + receivables - debts;

  return (
    <div
      onClick={onSelectSelf}
      className="card cursor-pointer border-accent/40 bg-[#161A22] hover:border-accent/60 transition-colors p-3.5 rounded-xl"
    >
      {/* Header: Kim Olduğun */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center font-bold text-xs text-accent shrink-0">
            {player.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold text-sm text-text-main truncate">{player.name}</span>
            <span className="bg-accent/15 text-accent text-[10px] font-bold px-1.5 py-0.5 rounded border border-accent/30 shrink-0">
              Senin Hesabın
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {player.is_banker && (
            <span className="flex items-center gap-1 bg-[#1F2633] text-[#7E99D3] border border-[#2B3547] text-[10px] font-medium px-1.5 py-0.5 rounded">
              <Shield className="w-2.5 h-2.5" />
              Bankacı
            </span>
          )}
          {player.recovery_pin && (
            <span className="text-[10px] font-mono text-text-muted bg-bg-surface border border-border-subtle px-1.5 py-0.5 rounded">
              PIN: {player.recovery_pin}
            </span>
          )}
        </div>
      </div>

      {/* Bakiye */}
      <div className="my-1.5">
        <div className="text-[11px] text-text-muted font-medium mb-0.5">Mevcut Paran</div>
        <div className="font-money font-bold text-2xl text-accent tracking-tight">
          {formatMoney(player.balance)}
        </div>
      </div>

      {/* Alacak / Borç / Net Durum */}
      <div className="flex items-center gap-3 pt-2 border-t border-border-subtle/60 text-[11px] text-text-muted">
        <div className="flex items-center gap-1">
          <ArrowUpRight className="w-3 h-3 text-money-pos shrink-0" />
          <span>Alacak:</span>
          <span className={`font-money font-semibold ${receivables > 0 ? 'text-money-pos' : 'text-text-muted'}`}>
            {formatMoney(receivables)}
          </span>
        </div>

        <span className="text-border-subtle">·</span>

        <div className="flex items-center gap-1">
          <ArrowDownLeft className="w-3 h-3 text-money-neg shrink-0" />
          <span>Borç:</span>
          <span className={`font-money font-semibold ${debts > 0 ? 'text-money-neg' : 'text-text-muted'}`}>
            {formatMoney(debts)}
          </span>
        </div>

        <span className="text-border-subtle">·</span>

        <div>
          <span>Net: </span>
          <span className="font-money font-semibold text-text-main">{formatMoney(netWorth)}</span>
        </div>
      </div>
    </div>
  );
};
