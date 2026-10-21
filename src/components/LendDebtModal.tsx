import React, { useState, useEffect, useRef } from 'react';
import { X, HandCoins, AlertTriangle, Loader2, Check } from 'lucide-react';
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
  const prevIsOpenRef = useRef<boolean>(false);

  const potentialDebtors = players.filter(p => p.id !== currentPlayer.id);

  // Sadece modal İLK AÇILDIĞINDA sıfırla, arka plan güncellemelerinde kullanıcının yazdığı silinmesin
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      if (preSelectedDebtor && preSelectedDebtor.id !== currentPlayer.id) {
        setDebtorId(preSelectedDebtor.id);
      } else if (potentialDebtors.length > 0) {
        setDebtorId(potentialDebtors[0].id);
      }
      setAmountStr('');
      setError(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, preSelectedDebtor, currentPlayer.id]);

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

    onClose();
    onLendDebt(currentPlayer.id, debtorId, amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-100 overflow-y-auto">
      <div className="bg-[#0E1218] border border-white/[0.08] w-full max-w-sm rounded-3xl p-4.5 sm:p-5 shadow-2xl shadow-black/90 max-h-[92dvh] overflow-y-auto my-auto animate-in zoom-in-95 duration-150">
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
              <div className={`grid ${potentialDebtors.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-1.5 max-h-36 overflow-y-auto pr-0.5`}>
                {potentialDebtors.map((p, idx) => {
                  const isSelected = debtorId === p.id;
                  const isLastOdd = potentialDebtors.length % 2 === 1 && idx === potentialDebtors.length - 1;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setDebtorId(p.id);
                        setError(null);
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 active:scale-[0.99] ${
                        isLastOdd ? 'col-span-2' : ''
                      } ${
                        isSelected
                          ? 'border-money-pos bg-money-pos/15 text-text-main font-semibold ring-1 ring-money-pos/30 shadow-sm'
                          : 'border-border-subtle bg-bg-surface text-text-muted hover:border-white/[0.18] hover:text-text-main'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border transition-colors ${
                          isSelected
                            ? 'bg-money-pos/25 border-money-pos text-money-pos'
                            : 'bg-white/[0.05] border-white/[0.08] text-text-muted'
                        }`}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-text-main truncate">{p.name}</div>
                          <div className="text-[10px] text-text-subtle font-money">
                            {formatMoney(p.balance)}
                          </div>
                        </div>
                      </div>

                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-money-pos bg-money-pos text-black'
                          : 'border-white/20 bg-transparent'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3.5]" />}
                      </div>
                    </button>
                  );
                })}
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
              <div className="flex flex-col items-center">
                <span>
                  {debtor ? `${debtor.name}'e Borç Teklifi Gönder` : 'Borç Teklifi Gönder'}
                </span>
                <span className="text-[10px] font-normal opacity-80">
                  Karşı taraf onayladığında aktarılır
                </span>
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
