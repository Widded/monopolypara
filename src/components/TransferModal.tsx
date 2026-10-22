import React, { useState, useEffect, useRef } from 'react';
import { X, Send, AlertTriangle, Loader2, Landmark, Check, Lock, Receipt, Sparkles, Building2, User, ChevronDown } from 'lucide-react';
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
  const [showRecipientSelector, setShowRecipientSelector] = useState<boolean>(false);
  const prevIsOpenRef = useRef<boolean>(false);

  // Sadece masada aktif olan ve iflas etmemiş diğer oyuncular
  const potentialReceivers = players.filter(
    p => p.id !== currentPlayer.id && p.is_online !== false && !p.is_bankrupt
  );

  // Sadece modal İLK AÇILDIĞINDA sıfırla
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      if (preSelectedReceiver) {
        setReceiverId(preSelectedReceiver.id);
        setShowRecipientSelector(false);
      } else if (potentialReceivers.length > 0) {
        setReceiverId(potentialReceivers[0].id);
        setShowRecipientSelector(potentialReceivers.length > 1);
      } else {
        setReceiverId('bank');
        setShowRecipientSelector(false);
      }
      setAmountStr('');
      setDescription('');
      setError(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, preSelectedReceiver, currentPlayer.id, potentialReceivers.length]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-100 overflow-y-auto">
      <div className="bg-[#0E1218] border border-white/[0.08] w-full max-w-sm rounded-3xl p-4 sm:p-5 shadow-2xl shadow-black/90 max-h-[92dvh] overflow-y-auto my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle mb-3">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">
              {isBank ? 'Bankaya Öde (Tapu / Vergi / Ceza)' : 'Para Gönder'}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-2.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400 animate-in fade-in">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        <form onSubmit={handleExecute} className="space-y-3">
          {/* Alıcı Özeti Kartı (Apple Pay Contact Pill) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Alıcı
              </span>
              <button
                type="button"
                onClick={() => setShowRecipientSelector(prev => !prev)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{showRecipientSelector ? 'Kapat' : 'Değiştir'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRecipientSelector ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Seçili Alıcı Göstergesi */}
            <div className="p-2.5 rounded-2xl bg-[#141822] border border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                    isBank
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {isBank ? <Landmark className="w-4 h-4" /> : receiver?.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-white truncate">
                    {isBank ? 'Banka Kasası' : receiver?.name || 'Alıcı Seçilmedi'}
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono">
                    {isBank
                      ? 'Tapu, ceza ve vergi ödemeleri'
                      : `Mevcut Bakiye: ${formatMoney(receiver?.balance || 0)}`}
                  </div>
                </div>
              </div>

              {isBank && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 rounded-full shrink-0">
                  Banka
                </span>
              )}
            </div>

            {/* Genişletilebilir Alıcı Seçim Listesi */}
            {showRecipientSelector && (
              <div className="space-y-1.5 pt-1 animate-in fade-in duration-150">
                {/* Banka Butonu */}
                <button
                  type="button"
                  onClick={() => {
                    setReceiverId('bank');
                    setShowRecipientSelector(false);
                    setError(null);
                  }}
                  className={`w-full p-2 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                    isBank
                      ? 'border-amber-400 bg-amber-500/15 text-amber-200 font-bold'
                      : 'border-white/[0.06] bg-[#0E1218] text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Landmark className="w-3.5 h-3.5 text-amber-400" />
                    <span>Banka Kasası (Vergi / Tapu)</span>
                  </div>
                  {isBank && <Check className="w-3 h-3 text-amber-400 stroke-[3]" />}
                </button>

                {/* Diğer Oyuncular */}
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
                  {potentialReceivers.map(p => {
                    const isSelected = receiverId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setReceiverId(p.id);
                          setShowRecipientSelector(false);
                          setError(null);
                        }}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-500/15 text-white font-semibold'
                            : 'border-white/[0.06] bg-[#0E1218] text-neutral-400 hover:text-white'
                        }`}
                      >
                        <div className="truncate text-xs font-semibold">{p.name}</div>
                        {isSelected && <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Banka Hızlı Monopoly Ödeme Çipleri */}
            {isBank && (
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAmountStr('50');
                    setDescription('Hapis Cezası');
                  }}
                  className="py-1.5 px-2 rounded-xl bg-[#141822] border border-white/[0.06] hover:border-amber-400/50 text-left font-medium text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                >
                  <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">Hapis:</span>
                  <strong className="text-amber-300 font-mono ml-auto">50 ₺</strong>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAmountStr('200');
                    setDescription('Gelir Vergisi');
                  }}
                  className="py-1.5 px-2 rounded-xl bg-[#141822] border border-white/[0.06] hover:border-amber-400/50 text-left font-medium text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                >
                  <Receipt className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">Gelir:</span>
                  <strong className="text-amber-300 font-mono ml-auto">200 ₺</strong>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAmountStr('100');
                    setDescription('Lüks Vergisi');
                  }}
                  className="py-1.5 px-2 rounded-xl bg-[#141822] border border-white/[0.06] hover:border-amber-400/50 text-left font-medium text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                >
                  <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">Lüks:</span>
                  <strong className="text-amber-300 font-mono ml-auto">100 ₺</strong>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDescription('Tapu Satın Alımı');
                  }}
                  className="py-1.5 px-2 rounded-xl bg-[#141822] border border-white/[0.06] hover:border-amber-400/50 text-left font-medium text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                >
                  <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">Tapu Alımı</span>
                </button>
              </div>
            )}
          </div>

          {/* Devasa Tutar Ekranı (Apple Pay Amount Display) */}
          <div className="bg-[#141822] border border-white/[0.08] rounded-2xl p-3 text-center">
            <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block">
              Gönderilecek Tutar
            </span>
            <div className="text-3xl sm:text-[34px] font-black font-money text-emerald-400 tracking-tight my-0.5 tabular-nums">
              {formatMoney(amount)}
            </div>
            <div className="text-[10px] text-neutral-500 font-mono">
              Kalan bakiye: {formatMoney(Math.max(0, currentPlayer.balance - amount))}
            </div>
          </div>

          {/* Dokunmatik Hızlı Keypad */}
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
