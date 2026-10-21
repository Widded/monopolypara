import React, { useState, useEffect, useRef } from 'react';
import { X, Send, AlertTriangle, Loader2, Landmark } from 'lucide-react';
import { Player } from '../types';
import { formatMoney } from '../utils/formatters';
import { Keypad } from './Keypad';

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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const prevIsOpenRef = useRef<boolean>(false);

  // Sadece masada aktif olan ve iflas etmemiş diğer oyuncular
  const potentialReceivers = players.filter(
    p => p.id !== currentPlayer.id && p.is_online !== false && !p.is_bankrupt
  );

  // Sadece modal İLK AÇILDIĞINDA sıfırla, arka plan güncellemelerinde kullanıcının yazdığı silinmesin
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      if (preSelectedReceiver && preSelectedReceiver.id !== currentPlayer.id) {
        setReceiverId(preSelectedReceiver.id);
      } else if (potentialReceivers.length > 0) {
        setReceiverId(potentialReceivers[0].id);
      } else {
        setReceiverId('bank');
      }
      setAmountStr('');
      setDescription('');
      setError(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, preSelectedReceiver, currentPlayer.id]);

  if (!isOpen) return null;

  const isBank = receiverId === 'bank';
  const amount = parseFloat(amountStr) || 0;
  const receiver = isBank ? null : players.find(p => p.id === receiverId);

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

    onClose();
    onTransfer(currentPlayer.id, receiverId, amount, description || (isBank ? 'Bankaya Ödeme' : undefined));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="bg-bg-card border border-border-subtle w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle mb-3">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-accent" />
            <h3 className="font-bold text-sm text-text-main">
              {isBank ? 'Bankaya Öde (Tapu / Vergi / Ceza)' : 'Para Gönder'}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-text-muted hover:text-text-main p-1 rounded-lg cursor-pointer"
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
          {/* Receiver Selection */}
          <div>
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Alıcı Seçimi</span>
              {isBank && <span className="text-[10px] text-amber-400 font-bold">🏛️ Banka Kasası</span>}
            </div>

            {/* Banka Butonu */}
            <button
              type="button"
              onClick={() => {
                setReceiverId('bank');
                setError(null);
              }}
              className={`w-full mb-2 p-2 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                isBank
                  ? 'border-amber-400 bg-amber-500/15 text-amber-200 font-bold shadow-sm'
                  : 'border-white/[0.08] bg-bg-surface text-text-muted hover:text-white hover:border-white/[0.16]'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Landmark className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold">🏛️ Banka Kasası</div>
                  <div className="text-[10px] text-text-subtle font-normal">Tapu alımı, vergi, ceza ödemesi</div>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isBank ? 'bg-amber-400 text-black border-amber-400' : 'bg-white/[0.04] text-text-subtle border-white/[0.08]'}`}>
                {isBank ? 'Seçildi' : 'Seç'}
              </span>
            </button>

            {/* Banka Hızlı Ödeme Çipleri */}
            {isBank && (
              <div className="grid grid-cols-2 gap-1.5 mb-2.5 p-2 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setAmountStr('50');
                    setDescription('Hapis Cezası');
                  }}
                  className="py-1 px-2 rounded-lg bg-bg-card border border-white/[0.06] hover:border-amber-400/50 text-left font-medium text-text-muted hover:text-white"
                >
                  🔒 Hapis: <strong className="text-amber-300 font-money">50 ₺</strong>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAmountStr('200');
                    setDescription('Gelir Vergisi');
                  }}
                  className="py-1 px-2 rounded-lg bg-bg-card border border-white/[0.06] hover:border-amber-400/50 text-left font-medium text-text-muted hover:text-white"
                >
                  📋 Gelir Vergisi: <strong className="text-amber-300 font-money">200 ₺</strong>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAmountStr('100');
                    setDescription('Lüks Vergisi');
                  }}
                  className="py-1 px-2 rounded-lg bg-bg-card border border-white/[0.06] hover:border-amber-400/50 text-left font-medium text-text-muted hover:text-white"
                >
                  💎 Lüks Vergisi: <strong className="text-amber-300 font-money">100 ₺</strong>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDescription('Tapu Satın Alımı');
                  }}
                  className="py-1 px-2 rounded-lg bg-bg-card border border-white/[0.06] hover:border-amber-400/50 text-left font-medium text-text-muted hover:text-white truncate"
                >
                  🏠 Tapu Satın Alımı
                </button>
              </div>
            )}

            {/* Oyuncular */}
            {potentialReceivers.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto pr-0.5">
                {potentialReceivers.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setReceiverId(p.id);
                      setDescription('');
                      setError(null);
                    }}
                    className={`py-1.5 px-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      receiverId === p.id
                        ? 'border-accent bg-accent/15 text-text-main font-semibold'
                        : 'border-border-subtle bg-bg-surface text-text-muted hover:text-text-main'
                    }`}
                  >
                    <div className="truncate font-medium">{p.name}</div>
                    <div className="text-[10px] font-money opacity-80">{formatMoney(p.balance)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Amount Display */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-2.5 flex items-center justify-between">
            <span className="text-[11px] text-text-muted font-medium">Tutar</span>
            <span className="text-2xl font-money font-bold text-accent tracking-tight">
              {formatMoney(amount)}
            </span>
          </div>

          {/* Custom On-Screen Keypad */}
          <Keypad
            value={amountStr}
            onChange={val => {
              setAmountStr(val);
              setError(null);
            }}
            quickPresets={[50, 100, 200, 500]}
            max={currentPlayer.balance}
          />

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading || !receiverId || amount <= 0}
            className="btn-primary w-full py-3 text-xs font-bold mt-1 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isBank ? (
              <span>Bankaya {formatMoney(amount)} Öde</span>
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
