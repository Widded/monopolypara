import React, { useState, useEffect } from 'react';
import { X, Send, AlertTriangle, Loader2 } from 'lucide-react';
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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const potentialReceivers = players.filter(p => p.id !== currentPlayer.id);

  useEffect(() => {
    if (isOpen) {
      if (preSelectedReceiver && preSelectedReceiver.id !== currentPlayer.id) {
        setReceiverId(preSelectedReceiver.id);
      } else if (potentialReceivers.length > 0) {
        setReceiverId(potentialReceivers[0].id);
      }
      setAmountStr('');
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

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!receiverId) {
      setError('Lütfen bir alıcı seçin.');
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
      await onTransfer(currentPlayer.id, receiverId, amount);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Transfer başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="bg-bg-card border border-border-subtle w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle mb-3">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-accent" />
            <h3 className="font-bold text-sm text-text-main">Para Gönder</h3>
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
          <div className="mb-3 p-2 rounded-lg bg-money-neg/10 border border-money-neg/30 flex items-center gap-2 text-xs text-money-neg">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        <form onSubmit={handleExecute} className="space-y-3">
          {/* Receiver Selection - Compact horizontal scroll/pills */}
          <div>
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
              Alıcı
            </div>
            {potentialReceivers.length === 0 ? (
              <div className="text-xs text-text-muted py-2 text-center bg-bg-surface rounded-lg border border-border-subtle">
                Odada başka oyuncu yok.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {potentialReceivers.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setReceiverId(p.id);
                      setError(null);
                    }}
                    className={`py-2 px-2.5 rounded-lg border text-left text-xs transition-all ${
                      receiverId === p.id
                        ? 'border-accent bg-accent/15 text-text-main font-semibold'
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

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
              <span>Tutar</span>
              <span className="normal-case text-text-muted">Bakiyeniz: {formatMoney(currentPlayer.balance)}</span>
            </div>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={amountStr}
                onChange={e => setAmountStr(e.target.value)}
                placeholder="0"
                className="input-field py-2.5 text-lg font-money font-bold pr-8"
                autoFocus
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted font-bold text-sm">
                ₺
              </span>
            </div>

            {/* Quick chips */}
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[50, 100, 200, 500].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAdd(val)}
                  className="py-1 rounded-md bg-bg-surface hover:bg-[#252b36] border border-border-subtle text-[11px] font-money text-text-muted hover:text-text-main"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Single Action Button */}
          <button
            type="submit"
            disabled={loading || !receiverId || amount <= 0}
            className="btn-primary w-full py-2.5 text-xs font-bold mt-1"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>
                {receiver ? `${receiver.name}'e ${formatMoney(amount)} Gönder` : 'Gönder'}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
