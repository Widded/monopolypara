import React, { useState, useEffect } from 'react';
import { X, CheckSquare, ArrowRight, AlertTriangle, Loader2, Handshake, Check } from 'lucide-react';
import { Debt, Player } from '../types';
import { formatMoney } from '../utils/formatters';

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
  const [mode, setMode] = useState<'normal' | 'settlement'>('normal');
  const [payAmountStr, setPayAmountStr] = useState<string>('');
  const [agreedAmountStr, setAgreedAmountStr] = useState<string>('');
  const [mutualAgreementConfirmed, setMutualAgreementConfirmed] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active debts (remaining > 0)
  const activeDebts = debts.filter(d => d.status !== 'settled' && d.remaining_amount > 0);

  useEffect(() => {
    if (isOpen) {
      if (preSelectedDebtId) {
        setSelectedDebtId(preSelectedDebtId);
      } else if (activeDebts.length > 0) {
        // Prioritize debts where current player is debtor
        const myDebt = activeDebts.find(d => d.debtor_id === currentPlayer.id);
        setSelectedDebtId(myDebt ? myDebt.id : activeDebts[0].id);
      } else {
        setSelectedDebtId('');
      }
      setPayAmountStr('');
      setAgreedAmountStr('');
      setMutualAgreementConfirmed(false);
      setIsConfirming(false);
      setError(null);
    }
  }, [isOpen, preSelectedDebtId, debts, currentPlayer.id]);

  if (!isOpen) return null;

  const currentDebt = activeDebts.find(d => d.id === selectedDebtId);
  const debtor = currentDebt ? players.find(p => p.id === currentDebt.debtor_id) : null;
  const creditor = currentDebt ? players.find(p => p.id === currentDebt.creditor_id) : null;

  const remainingDebt = currentDebt ? currentDebt.remaining_amount : 0;
  const payAmount = parseFloat(payAmountStr) || 0;
  const remainingAfterPayment = Math.max(0, remainingDebt - payAmount);

  const agreedPayment = parseFloat(agreedAmountStr) || 0;
  const forgivenAmount = Math.max(0, remainingDebt - agreedPayment);

  const handleSelectFullPayment = () => {
    if (currentDebt) {
      setPayAmountStr(currentDebt.remaining_amount.toString());
      setError(null);
    }
  };

  const handleSelectHalfPayment = () => {
    if (currentDebt) {
      const half = Math.round(currentDebt.remaining_amount / 2);
      setPayAmountStr(half.toString());
      setError(null);
    }
  };

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentDebt || !debtor || !creditor) {
      setError('Lütfen ödenecek bir borç seçin.');
      return;
    }

    if (mode === 'normal') {
      if (payAmount <= 0) {
        setError('Lütfen sıfırdan büyük bir ödeme tutarı girin.');
        return;
      }
      if (payAmount > currentDebt.remaining_amount) {
        setError(`Ödeme tutarı kalan borçtan (${formatMoney(currentDebt.remaining_amount)}) fazla olamaz.`);
        return;
      }
      if (debtor.balance < payAmount) {
        setError(`Borçlunun (${debtor.name}) nakit bakiyesi yetersiz! Mevcut bakiye: ${formatMoney(debtor.balance)}`);
        return;
      }
    } else {
      // Settlement mode
      if (agreedPayment < 0) {
        setError('Anlaşılan ödeme tutarı negatif olamaz.');
        return;
      }
      if (agreedPayment > currentDebt.remaining_amount) {
        setError(`Anlaşılan tutar kalan borçtan (${formatMoney(currentDebt.remaining_amount)}) fazla olamaz.`);
        return;
      }
      if (agreedPayment > 0 && debtor.balance < agreedPayment) {
        setError(`Borçlunun (${debtor.name}) nakit bakiyesi yetersiz! Mevcut: ${formatMoney(debtor.balance)}`);
        return;
      }
      if (!mutualAgreementConfirmed) {
        setError('İşlemi tamamlamak için her iki tarafın da anlaştığını onaylamalısınız.');
        return;
      }
    }

    setIsConfirming(true);
  };

  const handleExecute = async () => {
    if (!currentDebt || loading) return;
    setLoading(true);
    setError(null);

    try {
      if (mode === 'normal') {
        await onPayDebt(currentDebt.id, payAmount);
      } else {
        await onSettleDebt(currentDebt.id, agreedPayment);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Borç işlemi başarısız.');
      setIsConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-bg-card border border-border-subtle w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E6A23C]/15 border border-[#E6A23C]/30 flex items-center justify-center text-[#E6A23C]">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-text-main">Borç İşlemi</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-text-muted hover:text-text-main p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-money-neg/10 border border-money-neg/30 flex items-start gap-2.5 text-xs text-money-neg">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {activeDebts.length === 0 ? (
          <div className="p-8 text-center bg-bg-surface border border-border-subtle rounded-2xl">
            <CheckSquare className="w-8 h-8 text-money-pos mx-auto mb-2 opacity-80" />
            <h4 className="font-semibold text-sm text-text-main">Açık Borç Bulunmuyor</h4>
            <p className="text-xs text-text-muted mt-1">
              Şu anda oyunda ödenmesi gereken açık bir borç kaydı yok.
            </p>
          </div>
        ) : !isConfirming ? (
          <form onSubmit={handleProceed} className="space-y-4">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 bg-bg-surface border border-border-subtle rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('normal');
                  setError(null);
                }}
                className={`py-2 rounded-lg transition-all ${
                  mode === 'normal'
                    ? 'bg-bg-card text-text-main shadow-sm'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                Normal / Kısmi Ödeme
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('settlement');
                  setError(null);
                }}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'settlement'
                    ? 'bg-bg-card text-accent shadow-sm'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                <Handshake className="w-3.5 h-3.5" />
                <span>Anlaşmalı Kapatma</span>
              </button>
            </div>

            {/* Debt Picker */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Ödenecek Borç Kaydı
              </label>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {activeDebts.map(debt => (
                  <button
                    key={debt.id}
                    type="button"
                    onClick={() => {
                      setSelectedDebtId(debt.id);
                      setPayAmountStr('');
                      setAgreedAmountStr('');
                      setError(null);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all text-xs ${
                      selectedDebtId === debt.id
                        ? 'border-accent bg-accent/10 ring-1 ring-accent'
                        : 'border-border-subtle bg-bg-surface text-text-muted hover:border-[#39424E]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold text-text-main">
                      <span>
                        {debt.debtor_name}{' '}
                        <span className="text-text-muted font-normal">→ Borçlu</span>
                      </span>
                      <span className="font-money text-accent">
                        Kalan: {formatMoney(debt.remaining_amount)}
                      </span>
                    </div>
                    <div className="text-[11px] text-text-muted mt-1 flex items-center justify-between">
                      <span>Alacaklı: {debt.creditor_name}</span>
                      <span>(Başlangıç: {formatMoney(debt.initial_amount)})</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {currentDebt && (
              <>
                {/* Mode 1: Normal Payment */}
                {mode === 'normal' && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                          Ödenecek Tutar (₺)
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSelectHalfPayment}
                            className="text-[10px] text-accent font-semibold hover:underline"
                          >
                            Yarısı ({formatMoney(Math.round(currentDebt.remaining_amount / 2))})
                          </button>
                          <span className="text-border-subtle">·</span>
                          <button
                            type="button"
                            onClick={handleSelectFullPayment}
                            className="text-[10px] text-accent font-semibold hover:underline"
                          >
                            Tamamı ({formatMoney(currentDebt.remaining_amount)})
                          </button>
                        </div>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          inputMode="numeric"
                          min="1"
                          max={currentDebt.remaining_amount}
                          step="1"
                          value={payAmountStr}
                          onChange={e => setPayAmountStr(e.target.value)}
                          placeholder="Örn: 100"
                          className="input-field text-xl font-money font-bold pr-12"
                          autoFocus
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">
                          ₺
                        </span>
                      </div>
                    </div>

                    {/* Calculation Preview */}
                    <div className="p-3 bg-bg-surface border border-border-subtle rounded-xl space-y-1 text-xs">
                      <div className="flex justify-between text-text-muted">
                        <span>Mevcut Borç:</span>
                        <span className="font-money font-medium">{formatMoney(currentDebt.remaining_amount)}</span>
                      </div>
                      <div className="flex justify-between text-money-neg">
                        <span>Ödenecek Tutar:</span>
                        <span className="font-money font-semibold">-{formatMoney(payAmount)}</span>
                      </div>
                      <div className="pt-1.5 border-t border-border-subtle/60 flex justify-between font-semibold text-text-main">
                        <span>Ödeme Sonrası Kalan Borç:</span>
                        <span className="font-money text-accent">{formatMoney(remainingAfterPayment)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mode 2: Settlement (Anlaşmalı Kapatma) */}
                {mode === 'settlement' && (
                  <div className="space-y-3">
                    <div className="bg-[#1C221D] border border-accent/30 p-3 rounded-xl text-xs text-accent">
                      <strong>Anlaşmalı Borç Kapatma:</strong> Borcun tamamından daha az bir tutar
                      ödenerek borç tamamen kapatılır. Kalan kısım silinir.
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                        Tarafların Anlaştığı Ödeme Tutarı (₺)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          max={currentDebt.remaining_amount}
                          step="1"
                          value={agreedAmountStr}
                          onChange={e => setAgreedAmountStr(e.target.value)}
                          placeholder="Örn: 200"
                          className="input-field text-xl font-money font-bold pr-12"
                          autoFocus
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">
                          ₺
                        </span>
                      </div>
                    </div>

                    {/* Settlement math breakdown */}
                    <div className="p-3 bg-bg-surface border border-border-subtle rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between text-text-muted">
                        <span>Mevcut Açık Borç:</span>
                        <span className="font-money">{formatMoney(currentDebt.remaining_amount)}</span>
                      </div>
                      <div className="flex justify-between text-text-main font-semibold">
                        <span>Ödenecek Tutar:</span>
                        <span className="font-money text-money-pos">{formatMoney(agreedPayment)}</span>
                      </div>
                      <div className="flex justify-between text-money-neg">
                        <span>Anlaşmayla Kapatılacak (Silinecek) Tutar:</span>
                        <span className="font-money font-semibold">{formatMoney(forgivenAmount)}</span>
                      </div>
                      <div className="pt-1.5 border-t border-border-subtle/60 flex justify-between font-semibold text-text-main">
                        <span>İşlem Sonrası Kalan Borç:</span>
                        <span className="font-money text-money-pos">0 ₺ (Kapatıldı)</span>
                      </div>
                    </div>

                    {/* Explicit mutual confirmation checkbox */}
                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-bg-surface border border-border-subtle cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={mutualAgreementConfirmed}
                        onChange={e => setMutualAgreementConfirmed(e.target.checked)}
                        className="mt-0.5 rounded border-border-subtle text-accent focus:ring-accent"
                      />
                      <span className="text-xs text-text-main leading-tight">
                        <strong>{currentDebt.creditor_name}</strong> ve{' '}
                        <strong>{currentDebt.debtor_name}</strong> bu borcun{' '}
                        <strong>{formatMoney(agreedPayment)}</strong> karşılığında tamamen kapatılmasına
                        fiziksel olarak mutabık kaldı.
                      </span>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    (mode === 'normal' && payAmount <= 0) ||
                    (mode === 'settlement' && !mutualAgreementConfirmed)
                  }
                  className="btn-primary w-full mt-2"
                >
                  <span>Onaya İlerle</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </form>
        ) : (
          /* Confirmation Step */
          <div className="space-y-4">
            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-5 text-center">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                {mode === 'normal' ? 'Borç Ödeme Onayı' : 'Anlaşmalı Borç Kapatma'}
              </span>

              <div className="flex items-center justify-center gap-3 my-3 text-sm font-semibold text-text-main">
                <span className="text-money-neg">{debtor?.name} (Borçlu)</span>
                <ArrowRight className="w-4 h-4 text-text-muted" />
                <span className="text-money-pos">{creditor?.name} (Alacaklı)</span>
              </div>

              <div className="font-money font-extrabold text-3xl text-text-main my-2">
                {formatMoney(mode === 'normal' ? payAmount : agreedPayment)}
              </div>

              {mode === 'normal' ? (
                <div className="mt-4 pt-3 border-t border-border-subtle/80 text-xs text-text-muted text-left space-y-1.5">
                  <div className="flex justify-between">
                    <span>Mevcut Borç:</span>
                    <span className="font-money">{formatMoney(remainingDebt)}</span>
                  </div>
                  <div className="flex justify-between text-text-main font-semibold">
                    <span>Ödenecek Tutar:</span>
                    <span className="font-money text-money-neg">-{formatMoney(payAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border-subtle/40 font-semibold text-text-main">
                    <span>Kalan Açık Borç:</span>
                    <span className="font-money text-accent">{formatMoney(remainingAfterPayment)}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-3 border-t border-border-subtle/80 text-xs text-text-muted text-left space-y-1.5">
                  <div className="flex justify-between">
                    <span>Mevcut Borç:</span>
                    <span className="font-money">{formatMoney(remainingDebt)}</span>
                  </div>
                  <div className="flex justify-between text-money-pos font-semibold">
                    <span>Ödenecek:</span>
                    <span className="font-money">{formatMoney(agreedPayment)}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Anlaşmayla Kapatılacak Kalan Borç:</span>
                    <span className="font-money">{formatMoney(forgivenAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border-subtle/40 font-semibold text-money-pos">
                    <span>İşlem Sonrası Borç:</span>
                    <span>0 ₺ (Kapatıldı)</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirming(false)}
                disabled={loading}
                className="btn-secondary flex-1"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleExecute}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>{mode === 'normal' ? 'Ödemeyi Onayla' : 'Borcu Kapat'}</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
