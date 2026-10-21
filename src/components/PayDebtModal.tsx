import React, { useState, useEffect } from 'react';
import { X, CheckSquare, AlertTriangle, Loader2, Handshake } from 'lucide-react';
import { Debt, Player } from '../types';
import { formatMoney } from '../utils/formatters';
import { Keypad } from './Keypad';

interface PayDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer: Player;
  debts: Debt[];
  players: Player[];
  preSelectedDebtId?: string | null;
  onPayDebt: (debtId: string, amount: number) => Promise<void>;
  onSettleDebt: (debtId: string, agreedPayment: number) => Promise<void>;
}

export const PayDebtModal: React.FC<PayDebtModalProps> = ({
  isOpen,
  onClose,
  currentPlayer,
  debts,
  players,
  preSelectedDebtId,
  onPayDebt,
  onSettleDebt,
}) => {
  const [selectedDebtId, setSelectedDebtId] = useState<string>('');
  const [isSettlement, setIsSettlement] = useState<boolean>(false);
  const [amountStr, setAmountStr] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeDebts = debts.filter(d => d.status !== 'settled' && d.remaining_amount > 0);

  useEffect(() => {
    if (isOpen) {
      if (preSelectedDebtId) {
        setSelectedDebtId(preSelectedDebtId);
      } else if (activeDebts.length > 0) {
        const myDebt = activeDebts.find(d => d.debtor_id === currentPlayer.id);
        setSelectedDebtId(myDebt ? myDebt.id : activeDebts[0].id);
      } else {
        setSelectedDebtId('');
      }
      setAmountStr('');
      setIsSettlement(false);
      setError(null);
    }
  }, [isOpen, preSelectedDebtId, debts, currentPlayer.id]);

  if (!isOpen) return null;

  const currentDebt = activeDebts.find(d => d.id === selectedDebtId);
  const debtor = currentDebt ? players.find(p => p.id === currentDebt.debtor_id) : null;
  const creditor = currentDebt ? players.find(p => p.id === currentDebt.creditor_id) : null;

  const amount = parseFloat(amountStr) || 0;

  const handleSelectFull = () => {
    if (currentDebt) {
      setAmountStr(currentDebt.remaining_amount.toString());
      setError(null);
    }
  };

  const handleSelectHalf = () => {
    if (currentDebt) {
      setAmountStr(Math.round(currentDebt.remaining_amount / 2).toString());
      setError(null);
    }
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentDebt || !debtor || !creditor) {
      setError('Lütfen bir borç seçin.');
      return;
    }
    if (amount <= 0 && !isSettlement) {
      setError('Lütfen bir ödeme tutarı girin.');
      return;
    }
    if (amount > currentDebt.remaining_amount) {
      setError(`Tutar kalan borçtan (${formatMoney(currentDebt.remaining_amount)}) fazla olamaz.`);
      return;
    }
    if (debtor.balance < amount) {
      setError(`Borçlunun bakiyesi yetersiz! (${formatMoney(debtor.balance)})`);
      return;
    }

    setLoading(true);
    try {
      if (isSettlement) {
        await onSettleDebt(currentDebt.id, amount);
      } else {
        await onPayDebt(currentDebt.id, amount);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'İşlem başarısız.');
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
            <CheckSquare className="w-4 h-4 text-[#E6A23C]" />
            <h3 className="font-bold text-sm text-text-main">Borç Öde / Kapat</h3>
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

        {activeDebts.length === 0 ? (
          <div className="py-6 text-center text-xs text-text-muted">
            Şu anda açık bir borç kaydı yok.
          </div>
        ) : (
          <form onSubmit={handleExecute} className="space-y-2.5">
            {/* Debt Picker */}
            <div>
              <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                Açık Borç
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-0.5">
                {activeDebts.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setSelectedDebtId(d.id);
                      setAmountStr('');
                      setError(null);
                    }}
                    className={`w-full p-2 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                      selectedDebtId === d.id
                        ? 'border-accent bg-accent/15 text-text-main font-semibold'
                        : 'border-border-subtle bg-bg-surface text-text-muted hover:text-text-main'
                    }`}
                  >
                    <div className="truncate">
                      <span>{d.debtor_name}</span>
                      <span className="text-text-muted font-normal"> → {d.creditor_name}</span>
                    </div>
                    <span className="font-money text-accent shrink-0 ml-2">
                      {formatMoney(d.remaining_amount)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {currentDebt && (
              <>
                {/* Amount Display with presets */}
                <div className="bg-bg-surface border border-border-subtle rounded-xl p-2.5 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectHalf}
                      className="px-2 py-1 rounded bg-bg-card border border-border-subtle text-[10px] text-accent font-semibold hover:border-accent"
                    >
                      Yarısı
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectFull}
                      className="px-2 py-1 rounded bg-bg-card border border-border-subtle text-[10px] text-accent font-semibold hover:border-accent"
                    >
                      Tamamı
                    </button>
                  </div>
                  <span className="text-2xl font-money font-bold text-accent tracking-tight">
                    {formatMoney(amount)}
                  </span>
                </div>

                {/* Keypad */}
                <Keypad
                  value={amountStr}
                  onChange={val => {
                    setAmountStr(val);
                    setError(null);
                  }}
                  quickPresets={[50, 100, 200, 300]}
                  max={currentDebt.remaining_amount}
                />

                {/* Settlement toggle */}
                <label className="flex items-center gap-2 p-1.5 rounded-lg bg-bg-surface border border-border-subtle cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isSettlement}
                    onChange={e => setIsSettlement(e.target.checked)}
                    className="rounded border-border-subtle text-accent focus:ring-accent"
                  />
                  <span className="text-xs text-text-main flex items-center gap-1.5">
                    <Handshake className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>Anlaşmalı kapat (kalan silinsin)</span>
                  </span>
                </label>

                {/* Action Button */}
                <button
                  type="submit"
                  disabled={loading || amount <= 0}
                  className="btn-primary w-full py-2.5 text-xs font-bold"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isSettlement ? (
                    <span>Borcu {formatMoney(amount)} ile Kapat (Kalanı Sil)</span>
                  ) : (
                    <span>{formatMoney(amount)} Öde</span>
                  )}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
