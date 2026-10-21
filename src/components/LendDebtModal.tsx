import React, { useState, useEffect } from 'react';
import { X, HandCoins, AlertTriangle, Loader2 } from 'lucide-react';
import { Player } from '../types';
import { formatMoney } from '../utils/formatters';
import { Keypad } from './Keypad';

interface LendDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer: Player;
  players: Player[];
  preSelectedDebtor?: Player | null;
  onLendDebt: (creditorId: string, debtorId: string, amount: number, description?: string) => Promise<void>;
}

export const LendDebtModal: React.FC<LendDebtModalProps> = ({
  isOpen,
  onClose,
  currentPlayer,
  players,
  preSelectedDebtor,
  onLendDebt,
}) => {
  const [debtorId, setDebtorId] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const potentialDebtors = players.filter(p => p.id !== currentPlayer.id);

  useEffect(() => {
    if (isOpen) {
      if (preSelectedDebtor && preSelectedDebtor.id !== currentPlayer.id) {
        setDebtorId(preSelectedDebtor.id);
      } else if (potentialDebtors.length > 0) {
        setDebtorId(potentialDebtors[0].id);
      }
      setAmountStr('');
      setError(null);
    }
  }, [isOpen, preSelectedDebtor, currentPlayer.id, players]);

  if (!isOpen) return null;

  const amount = parseFloat(amountStr) || 0;
  const debtor = players.find(p => p.id === debtorId);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!debtorId) {
      setError('Lütfen bir oyuncu seçin.');
      return;
    }
    if (amount <= 0) {
      setError('Lütfen bir tutar girin.');
      return;
    }
    if (currentPlayer.balance < amount) {
      setError(`Yetersiz bakiye! Bakiyeniz: ${formatMoney(currentPlayer.balance)}`);
      return;
    }

    setLoading(true);
    try {
      await onLendDebt(currentPlayer.id, debtorId, amount);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Borç verilemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="bg-bg-card border border-border-subtle w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle mb-3">
          <div className="flex items-center gap-2">
            <HandCoins className="w-4 h-4 text-money-pos" />
            <h3 className="font-bold text-sm text-text-main">Borç Ver</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-text-muted hover:text-text-main p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-2.5 p-2 rounded-lg bg-money-neg/10 border border-money-neg/30 flex items-center gap-2 text-xs text-money-neg">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        <form onSubmit={handleExecute} className="space-y-3">
          {/* Debtor Selection */}
          <div>
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
              Borç Alan Oyuncu
            </div>
            {potentialDebtors.length === 0 ? (
              <div className="text-xs text-text-muted py-2 text-center bg-bg-surface rounded-lg border border-border-subtle">
                Odada başka oyuncu yok.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {potentialDebtors.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setDebtorId(p.id);
                      setError(null);
                    }}
                    className={`py-1.5 px-2.5 rounded-lg border text-left text-xs transition-all ${
                      debtorId === p.id
                        ? 'border-money-pos bg-money-pos/15 text-text-main font-semibold'
                        : 'border-border-subtle bg-bg-surface text-text-muted hover:text-text-main'
                    }`}
                  >
                    <div className="truncate">{p.name}</div>
                    <div className="text-[10px] font-money opacity-80">{formatMoney(p.balance)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Amount Display */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-2.5 flex items-center justify-between">
            <span className="text-[11px] text-text-muted font-medium">Borç Tutarı</span>
            <span className="text-2xl font-money font-bold text-money-pos tracking-tight">
              {formatMoney(amount)}
            </span>
          </div>

          {/* Custom Keypad */}
          <Keypad
            value={amountStr}
            onChange={val => {
              setAmountStr(val);
              setError(null);
            }}
            quickPresets={[50, 100, 200, 300]}
            max={currentPlayer.balance}
          />

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading || !debtorId || amount <= 0}
            className="btn-primary w-full py-3 text-xs font-bold"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>
                {debtor ? `${debtor.name}'e ${formatMoney(amount)} Borç Ver` : 'Borç Ver'}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
