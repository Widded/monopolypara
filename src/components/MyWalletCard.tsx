import React, { useEffect, useRef, useState } from 'react';
import { Shield, ArrowUpRight, ArrowDownLeft, Send, HandCoins, CreditCard, Sparkles } from 'lucide-react';
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
  onOpenTransfer,
  onOpenLendDebt,
  onOpenPayDebt,
  onSelectSelf,
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
  const netWorth = player.balance + receivables - debts;

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-[#15261C] via-[#0F1B14] to-[#0A120E] p-4 shadow-xl shadow-emerald-950/20 text-white">
      {/* Decorative ambient glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Balance change flash */}
      {balanceChange && (
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
            balanceChange === 'up' ? 'bg-money-pos/15 animate-pulse' : 'bg-money-neg/15 animate-pulse'
          }`}
        />
      )}

      {/* Top Identity Header: Unmistakable YOU Indicator */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-xs text-emerald-400 shrink-0 shadow-inner">
            {player.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-white truncate">{player.name}</span>
              <span className="bg-emerald-500 text-bg-main text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 shadow-sm flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 fill-current" />
                SEN
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {player.is_banker && (
            <span className="flex items-center gap-1 bg-[#1F2633] text-[#7E99D3] border border-[#2B3547] text-[10px] font-semibold px-2 py-0.5 rounded-md">
              <Shield className="w-3 h-3 text-[#7E99D3]" />
              Bankacı
            </span>
          )}
          {player.recovery_pin && (
            <span className="text-[10px] font-mono font-bold text-emerald-400/90 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
              PIN: {player.recovery_pin}
            </span>
          )}
        </div>
      </div>

      {/* Central Balance Display */}
      <div className="my-2 text-center py-2 bg-black/20 rounded-xl border border-emerald-500/20">
        <div className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest mb-0.5">
          SENİN MEVCUT BAKİYEN
        </div>
        <div
          className={`font-money font-extrabold text-3xl tracking-tight transition-colors duration-200 ${
            balanceChange === 'up'
              ? 'text-money-pos'
              : balanceChange === 'down'
              ? 'text-money-neg'
              : 'text-emerald-400'
          }`}
        >
          {formatMoney(player.balance)}
        </div>
        <div className="text-[10px] text-text-muted mt-0.5 font-medium">
          Net Varlık: <strong className="text-white font-money">{formatMoney(netWorth)}</strong>
        </div>
      </div>

      {/* Mini Stats: Receivables vs Debts */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="p-2 rounded-lg bg-bg-surface/60 border border-border-subtle/60 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-text-muted">
            <ArrowUpRight className="w-3 h-3 text-money-pos shrink-0" />
            <span>Alacağın:</span>
          </div>
          <span className={`font-money font-bold ${receivables > 0 ? 'text-money-pos' : 'text-text-muted'}`}>
            {formatMoney(receivables)}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-bg-surface/60 border border-border-subtle/60 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-text-muted">
            <ArrowDownLeft className="w-3 h-3 text-money-neg shrink-0" />
            <span>Borcun:</span>
          </div>
          <span className={`font-money font-bold ${debts > 0 ? 'text-money-neg' : 'text-text-muted'}`}>
            {formatMoney(debts)}
          </span>
        </div>
      </div>

      {/* Quick Action Dock on Your Wallet */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-500/20">
        <button
          type="button"
          onClick={onOpenTransfer}
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-bg-main font-bold text-xs rounded-lg transition-all active:scale-95 shadow-md shadow-emerald-500/10"
        >
          <Send className="w-3.5 h-3.5 stroke-[2.5]" />
          Para Gönder
        </button>

        <button
          type="button"
          onClick={onOpenLendDebt}
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#1C2620] hover:bg-[#25362C] text-emerald-300 border border-emerald-500/40 font-bold text-xs rounded-lg transition-all active:scale-95"
        >
          <HandCoins className="w-3.5 h-3.5 text-emerald-400" />
          Borç Ver
        </button>
      </div>
    </div>
  );
};
