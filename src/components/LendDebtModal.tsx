import React, { useState, useEffect } from 'react';
import { X, HandCoins, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { Player } from '../types';
import { formatMoney } from '../utils/formatters';

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
  const [description, setDescription] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
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
      setDescription('');
      setIsConfirming(false);
      setError(null);
    }
  }, [isOpen, preSelectedDebtor, currentPlayer.id, players]);

  if (!isOpen) return null;

  const amount = parseFloat(amountStr) || 0;
  const debtor = players.find(p => p.id === debtorId);

  const handleQuickAdd = (delta: number) => {
    const current = parseFloat(amountStr) || 0;
    setAmountStr((current + delta).toString());
    setError(null);
  };

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!debtorId) {
      setError('Lütfen borç alacak oyuncuyu seçin.');
      return;
    }
    if (amount <= 0) {
      setError('Lütfen sıfırdan büyük geçerli bir tutar girin.');
      return;
    }
    if (currentPlayer.balance < amount) {
      setError(`Yetersiz bakiye! Borç vermek için bakiyeniz: ${formatMoney(currentPlayer.balance)}`);
      return;
    }

    setIsConfirming(true);
  };

  const handleExecuteLend = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      await onLendDebt(currentPlayer.id, debtorId, amount, description);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Borç verme işlemi başarısız.');
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
            <div className="w-8 h-8 rounded-lg bg-money-pos/15 border border-money-pos/30 flex items-center justify-center text-money-pos">
              <HandCoins className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-text-main">Borç Ver</h3>
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

        {!isConfirming ? (
          <form onSubmit={handleProceedToConfirm} className="space-y-4">
            {/* Creditor info */}
            <div className="bg-bg-surface p-3 rounded-xl border border-border-subtle flex items-center justify-between text-xs">
              <span className="text-text-muted">Borç Veren:</span>
              <span className="font-semibold text-text-main">
                {currentPlayer.name} (Bakiye: {formatMoney(currentPlayer.balance)})
              </span>
            </div>

            {/* Debtor Select */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Borç Alan Oyuncu
              </label>
              {potentialDebtors.length === 0 ? (
                <div className="p-3 bg-bg-surface border border-border-subtle rounded-xl text-xs text-text-muted text-center">
                  Odada borç verebileceğiniz başka oyuncu yok.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {potentialDebtors.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setDebtorId(p.id)}
                      className={`p-3 rounded-xl border text-left transition-all text-xs font-medium ${
                        debtorId === p.id
                          ? 'border-money-pos bg-money-pos/10 text-text-main ring-1 ring-money-pos'
                          : 'border-border-subtle bg-bg-surface text-text-muted hover:border-[#39424E]'
                      }`}
                    >
                      <div className="font-semibold text-text-main truncate">{p.name}</div>
                      <div className="font-money text-[11px] text-text-muted mt-0.5">
                        Mevcut Bakiye: {formatMoney(p.balance)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Borç Tutarı (₺)
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={amountStr}
                  onChange={e => setAmountStr(e.target.value)}
                  placeholder="0"
                  className="input-field text-xl font-money font-bold pr-12"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">
                  ₺
                </span>
              </div>

              {/* Quick chips */}
              <div className="flex gap-2 mt-2">
                {[50, 100, 200, 300].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAdd(val)}
                    className="flex-1 py-1.5 rounded-lg bg-bg-surface hover:bg-[#252b36] border border-border-subtle text-[11px] font-money font-medium text-text-muted hover:text-text-main transition-colors"
                  >
                    +{val} ₺
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Borç Nedeni (İsteğe bağlı)
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Örn: Açık artırma için borç..."
                maxLength={60}
                className="input-field text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={potentialDebtors.length === 0 || amount <= 0}
              className="btn-primary w-full mt-2"
            >
              <span>Onaya İlerle</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Confirmation Step */
          <div className="space-y-4">
            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-5 text-center">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                Borç Verme Sözleşmesi
              </span>

              <div className="flex items-center justify-center gap-3 my-3 text-sm font-semibold text-text-main">
                <span className="text-money-pos">{currentPlayer.name} (Veren)</span>
                <ArrowRight className="w-4 h-4 text-text-muted" />
                <span className="text-money-neg">{debtor?.name} (Alan)</span>
              </div>

              <div className="font-money font-extrabold text-3xl text-text-main my-2">
                {formatMoney(amount)}
              </div>

              {description && (
                <div className="text-xs text-text-muted italic mt-1">
                  "{description}"
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-border-subtle/80 text-xs text-text-muted leading-relaxed text-left space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>{currentPlayer.name} Nakit Azalışı:</span>
                  <span className="font-money text-money-neg">-{formatMoney(amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{debtor?.name} Nakit Artışı:</span>
                  <span className="font-money text-money-pos">+{formatMoney(amount)}</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-text-main pt-1 border-t border-border-subtle/40">
                  <span>Yeni Açık Borç Kaydı:</span>
                  <span className="font-money text-accent">{formatMoney(amount)}</span>
                </div>
              </div>
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
                onClick={handleExecuteLend}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Borcu Onayla</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
