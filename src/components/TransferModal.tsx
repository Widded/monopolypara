import React, { useState, useEffect } from 'react';
import { X, Send, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { Player } from '../types';
import { formatMoney } from '../utils/formatters';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer: Player;
  players: Player[];
  preSelectedReceiver?: Player | null;
  onTransfer: (fromId: string, toId: string, amount: number, description?: string) => Promise<void>;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  currentPlayer,
  players,
  preSelectedReceiver,
  onTransfer,
}) => {
  const [receiverId, setReceiverId] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Other players available to receive money
  const potentialReceivers = players.filter(p => p.id !== currentPlayer.id);

  useEffect(() => {
    if (isOpen) {
      if (preSelectedReceiver && preSelectedReceiver.id !== currentPlayer.id) {
        setReceiverId(preSelectedReceiver.id);
      } else if (potentialReceivers.length > 0) {
        setReceiverId(potentialReceivers[0].id);
      }
      setAmountStr('');
      setDescription('');
      setIsConfirming(false);
      setError(null);
    }
  }, [isOpen, preSelectedReceiver, currentPlayer.id, players]);

  if (!isOpen) return null;

  const amount = parseFloat(amountStr) || 0;
  const receiver = players.find(p => p.id === receiverId);

  const handleQuickAdd = (delta: number) => {
    const current = parseFloat(amountStr) || 0;
    setAmountStr((current + delta).toString());
    setError(null);
  };

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!receiverId) {
      setError('Lütfen bir alıcı oyuncu seçin.');
      return;
    }
    if (amount <= 0) {
      setError('Lütfen sıfırdan büyük geçerli bir tutar girin.');
      return;
    }
    if (currentPlayer.balance < amount) {
      setError(`Yetersiz bakiye! Mevcut bakiyeniz: ${formatMoney(currentPlayer.balance)}`);
      return;
    }

    setIsConfirming(true);
  };

  const handleExecuteTransfer = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      await onTransfer(currentPlayer.id, receiverId, amount, description);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Transfer gerçekleştirilemedi.');
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
            <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Send className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-text-main">Para Gönder</h3>
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
          /* Step 1: Form */
          <form onSubmit={handleProceedToConfirm} className="space-y-4">
            {/* Sender / Balance info */}
            <div className="bg-bg-surface p-3 rounded-xl border border-border-subtle flex items-center justify-between text-xs">
              <span className="text-text-muted">Gönderen:</span>
              <span className="font-semibold text-text-main">
                {currentPlayer.name} (Bakiye: {formatMoney(currentPlayer.balance)})
              </span>
            </div>

            {/* Receiver Select */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Alıcı Oyuncu
              </label>
              {potentialReceivers.length === 0 ? (
                <div className="p-3 bg-bg-surface border border-border-subtle rounded-xl text-xs text-text-muted text-center">
                  Odada başka oyuncu yok.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {potentialReceivers.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setReceiverId(p.id)}
                      className={`p-3 rounded-xl border text-left transition-all text-xs font-medium ${
                        receiverId === p.id
                          ? 'border-accent bg-accent/10 text-text-main ring-1 ring-accent'
                          : 'border-border-subtle bg-bg-surface text-text-muted hover:border-[#39424E]'
                      }`}
                    >
                      <div className="font-semibold text-text-main truncate">{p.name}</div>
                      <div className="font-money text-[11px] text-text-muted mt-0.5">
                        {formatMoney(p.balance)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Transfer Tutarı (₺)
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

              {/* Quick amount chips */}
              <div className="flex gap-2 mt-2">
                {[50, 100, 200, 500].map(val => (
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

            {/* Optional Description */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                Açıklama (İsteğe bağlı)
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Örn: Kira, Arazi satışı..."
                maxLength={60}
                className="input-field text-sm"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={potentialReceivers.length === 0 || amount <= 0}
              className="btn-primary w-full mt-2"
            >
              <span>Devam Et</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Step 2: Confirmation modal */
          <div className="space-y-4">
            <div className="bg-bg-surface border border-border-subtle rounded-2xl p-5 text-center">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                Para Gönderimi
              </span>

              <div className="flex items-center justify-center gap-3 my-3 text-sm font-semibold text-text-main">
                <span className="text-accent">{currentPlayer.name}</span>
                <ArrowRight className="w-4 h-4 text-text-muted" />
                <span className="text-accent">{receiver?.name}</span>
              </div>

              <div className="font-money font-extrabold text-3xl text-text-main my-2">
                {formatMoney(amount)}
              </div>

              {description && (
                <div className="text-xs text-text-muted italic mt-1">
                  "{description}"
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-border-subtle/80 text-xs text-text-muted leading-relaxed">
                "{currentPlayer.name}'in bakiyesinden{' '}
                <strong className="text-money-neg font-money">{formatMoney(amount)}</strong>{' '}
                düşülecek, {receiver?.name}'in bakiyesine{' '}
                <strong className="text-money-pos font-money">{formatMoney(amount)}</strong>{' '}
                eklenecek."
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
                onClick={handleExecuteTransfer}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>İşlemi Onayla</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
