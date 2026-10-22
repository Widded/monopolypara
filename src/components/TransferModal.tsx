import React, { useState, useEffect, useRef } from 'react';
import { X, Send, AlertTriangle, Loader2, Landmark, Check, Lock, Receipt, Sparkles, Building2, Users } from 'lucide-react';
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
  const [targetType, setTargetType] = useState<'player' | 'bank'>('player');
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

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      if (preSelectedReceiver?.id === 'bank') {
        setTargetType('bank');
        setReceiverId('bank');
      } else if (preSelectedReceiver && preSelectedReceiver.id !== currentPlayer.id) {
        setTargetType('player');
        setReceiverId(preSelectedReceiver.id);
      } else if (potentialReceivers.length > 0) {
        setTargetType('player');
        setReceiverId(potentialReceivers[0].id);
      } else {
        setTargetType('bank');
        setReceiverId('bank');
      }
      setAmountStr('');
      setDescription('');
      setError(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, preSelectedReceiver, currentPlayer.id, potentialReceivers.length]);

  // Esc tuşu ile kapatma
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isBank = targetType === 'bank' || receiverId === 'bank';
  const amount = parseFloat(amountStr) || 0;
  const receiver = isBank ? null : players.find(p => p.id === receiverId);

  const handleSelectTab = (type: 'player' | 'bank') => {
    setTargetType(type);
    setError(null);
    if (type === 'bank') {
      setReceiverId('bank');
    } else {
      if (potentialReceivers.length > 0) {
        setReceiverId(potentialReceivers[0].id);
      } else {
        setReceiverId('');
      }
      setDescription('');
    }
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const actualReceiverId = isBank ? 'bank' : receiverId;
    if (!actualReceiverId) {
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
    onTransfer(currentPlayer.id, actualReceiverId, amount, description || (isBank ? 'Bankaya Ödeme' : undefined));
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-100 overflow-y-auto"
    >
      <div className="bg-[#0E1218] border border-white/[0.08] w-full max-w-sm rounded-3xl p-4 sm:p-5 shadow-2xl shadow-black/90 max-h-[92dvh] overflow-y-auto my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08] mb-3">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">
              {isBank ? 'Bankaya Öde (Tapu / Vergi / Ceza)' : 'Para Gönder'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-2.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        <form onSubmit={handleExecute} className="space-y-3">
          {/* Segmented Receiver Type Tabs (Oyuncular vs Banka) */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#141822] border border-white/[0.06]">
            <button
              type="button"
              onClick={() => handleSelectTab('player')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                targetType === 'player'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Oyuncuya Gönder</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('bank')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                targetType === 'bank'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Banka Kasası</span>
            </button>
          </div>

          {/* 1. SEÇENEK: OYUNCU LİSTESİ */}
          {targetType === 'player' && (
            <div>
              {potentialReceivers.length > 0 ? (
                <div className={`grid ${potentialReceivers.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-1.5 max-h-32 overflow-y-auto pr-0.5`}>
                  {potentialReceivers.map((p, idx) => {
                    const isSelected = receiverId === p.id;
                    const isLastOdd = potentialReceivers.length % 2 === 1 && idx === potentialReceivers.length - 1;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setReceiverId(p.id);
                          setDescription('');
                          setError(null);
                        }}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 active:scale-[0.99] ${
                          isLastOdd ? 'col-span-2' : ''
                        } ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-500/15 text-white font-semibold ring-1 ring-emerald-400/30 shadow-sm'
                            : 'border-white/[0.08] bg-[#141822] text-neutral-400 hover:border-white/[0.18] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border transition-colors ${
                            isSelected
                              ? 'bg-emerald-500/25 border-emerald-400 text-emerald-400'
                              : 'bg-white/[0.05] border-white/[0.08] text-neutral-400'
                          }`}>
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-white truncate">{p.name}</div>
                            <div className="text-[10px] text-neutral-400 font-mono">
                              {formatMoney(p.balance)}
                            </div>
                          </div>
                        </div>

                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-400 text-black'
                            : 'border-white/20 bg-transparent'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3.5]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#141822] border border-white/[0.06] text-center text-xs text-neutral-400">
                  Masada henüz başka oyuncu yok.
                </div>
              )}
            </div>
          )}

          {/* 2. SEÇENEK: BANKA HIZLI ÇİPLERİ */}
          {targetType === 'bank' && (
            <div className="grid grid-cols-2 gap-1.5 animate-in fade-in duration-100">
              <button
                type="button"
                onClick={() => {
                  setAmountStr('50');
                  setDescription('Hapis Cezası');
                }}
                className="py-1.5 px-2 rounded-xl bg-[#141822] border border-white/[0.08] hover:border-amber-400/50 text-left font-medium text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Hapis:</span>
                <strong className="text-amber-300 font-mono ml-auto">50 ₺</strong>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAmountStr('200');
                  setDescription('Gelir Vergisi');
                }}
                className="py-1.5 px-2 rounded-xl bg-[#141822] border border-white/[0.08] hover:border-amber-400/50 text-left font-medium text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Gelir:</span>
                <strong className="text-amber-300 font-mono ml-auto">200 ₺</strong>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAmountStr('100');
                  setDescription('Lüks Vergisi');
                }}
                className="py-1.5 px-2 rounded-xl bg-[#141822] border border-white/[0.08] hover:border-amber-400/50 text-left font-medium text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Lüks:</span>
                <strong className="text-amber-300 font-mono ml-auto">100 ₺</strong>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDescription('Tapu Satın Alımı');
                }}
                className="py-1.5 px-2 rounded-xl bg-[#141822] border border-white/[0.08] hover:border-amber-400/50 text-left font-medium text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Tapu Alımı</span>
              </button>
            </div>
          )}

          {/* Tutar Ekranı */}
          <div className="bg-[#141822] border border-white/[0.08] rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-neutral-400 font-medium">Tutar</span>
            <span className="text-2xl font-mono font-bold text-emerald-400 tracking-tight tabular-nums">
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
            quickPresets={[50, 100, 200, 500]}
            max={currentPlayer.balance}
          />

          {/* Gönder / Öde Butonu */}
          <button
            type="submit"
            disabled={loading || (!isBank && !receiverId) || amount <= 0}
            className="btn-primary w-full py-2.5 text-xs font-bold mt-1 cursor-pointer"
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
