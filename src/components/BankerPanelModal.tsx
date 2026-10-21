import React, { useState } from 'react';
import { X, Shield, Plus, Minus, AlertTriangle, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Player, Room, Transaction } from '../types';
import { formatMoney } from '../utils/formatters';

interface BankerPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  players: Player[];
  transactions: Transaction[];
  onAdjustBalance: (playerId: string, delta: number, description: string) => Promise<void>;
  onOpenHistory: () => void;
}

export const BankerPanelModal: React.FC<BankerPanelModalProps> = ({
  isOpen,
  onClose,
  room,
  players,
  transactions,
  onAdjustBalance,
  onOpenHistory,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');
  const [operationType, setOperationType] = useState<'add' | 'deduct'>('add');
  const [amountStr, setAmountStr] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedPlayer = players.find(p => p.id === selectedPlayerId) || players[0];
  const amount = parseFloat(amountStr) || 0;
  const delta = operationType === 'add' ? amount : -amount;
  const newBalance = selectedPlayer ? selectedPlayer.balance + delta : 0;

  const handleQuickGoSalary = async (player: Player) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await onAdjustBalance(player.id, 200, 'Başlangıç noktasından geçiş (Maaş: +200 ₺)');
    } catch (err: any) {
      setError(err.message || 'Maaş eklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPlayer) {
      setError('Lütfen bir oyuncu seçin.');
      return;
    }
    if (amount <= 0) {
      setError('Lütfen sıfırdan büyük bir tutar girin.');
      return;
    }
    if (!description.trim()) {
      setError('Lütfen düzeltme nedenini belirten bir açıklama girin.');
      return;
    }
    if (newBalance < 0) {
      setError(`Oyuncu bakiyesi sıfırın altına düşemez! (Mevcut: ${formatMoney(selectedPlayer.balance)})`);
      return;
    }

    setIsConfirming(true);
  };

  const handleExecuteAdjustment = async () => {
    if (!selectedPlayer || loading) return;
    setLoading(true);
    setError(null);

    try {
      await onAdjustBalance(selectedPlayer.id, delta, description.trim());
      setAmountStr('');
      setDescription('');
      setIsConfirming(false);
    } catch (err: any) {
      setError(err.message || 'Bakiye düzeltilemedi.');
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
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text-main leading-tight">Bankacı Paneli</h3>
              <p className="text-[11px] text-text-muted">Kasa & Düzeltme Yönetimi</p>
            </div>
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

        {/* Players Overview & Quick +200 ₺ GO Salary */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Oyuncu Bakiyeleri & Hızlı Maaş
            </span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {players.map(p => (
              <div
                key={p.id}
                className="p-2.5 bg-bg-surface border border-border-subtle rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-text-main flex items-center gap-1.5">
                    <span>{p.name}</span>
                    {p.is_banker && (
                      <span className="text-[9px] bg-accent/15 text-accent px-1.5 py-0.2 rounded font-mono">
                        Bankacı
                      </span>
                    )}
                  </div>
                  <div className="font-money text-text-muted text-[11px]">
                    {formatMoney(p.balance)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickGoSalary(p)}
                  disabled={loading}
                  className="bg-accent/10 hover:bg-accent hover:text-bg-main text-accent border border-accent/30 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all"
                  title="Başlangıç noktasından geçtiğinde +200 ₺ maaş ver"
                >
                  +200 ₺ (Maaş)
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Balance Adjustment Section */}
        <div className="pt-4 border-t border-border-subtle">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Bakiye Düzeltme / Para Ekle-Düş
          </h4>

          {!isConfirming ? (
            <form onSubmit={handleProceedToConfirm} className="space-y-3.5">
              {/* Select Player */}
              <div>
                <label className="block text-[11px] text-text-muted mb-1 font-medium">
                  İşlem Yapılacak Oyuncu
                </label>
                <select
                  value={selectedPlayerId}
                  onChange={e => setSelectedPlayerId(e.target.value)}
                  className="input-field text-xs py-2.5"
                >
                  {players.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ({formatMoney(p.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Add vs Deduct Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOperationType('add')}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
                    operationType === 'add'
                      ? 'border-money-pos bg-money-pos/15 text-money-pos'
                      : 'border-border-subtle bg-bg-surface text-text-muted'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Para Ekle (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOperationType('deduct')}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
                    operationType === 'deduct'
                      ? 'border-money-neg bg-money-neg/15 text-money-neg'
                      : 'border-border-subtle bg-bg-surface text-text-muted'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Para Düş (-)</span>
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[11px] text-text-muted mb-1 font-medium">
                  Tutar (₺)
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
                    className="input-field font-money text-lg pr-10"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-bold">
                    ₺
                  </span>
                </div>
              </div>

              {/* Description (Mandatory for audit trail) */}
              <div>
                <label className="block text-[11px] text-text-muted mb-1 font-medium">
                  Düzeltme Açıklaması (Zorunlu)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Örn: Fiziksel tahtada elden nakit sayım düzeltmesi"
                  className="input-field text-xs"
                />
              </div>

              {/* Live Preview */}
              {selectedPlayer && amount > 0 && (
                <div className="p-3 bg-bg-surface border border-border-subtle rounded-xl text-xs space-y-1">
                  <div className="flex justify-between text-text-muted">
                    <span>Mevcut Bakiye:</span>
                    <span className="font-money">{formatMoney(selectedPlayer.balance)}</span>
                  </div>
                  <div className="flex justify-between text-text-main font-semibold">
                    <span>Değişiklik:</span>
                    <span className={`font-money ${delta > 0 ? 'text-money-pos' : 'text-money-neg'}`}>
                      {delta > 0 ? `+${formatMoney(delta)}` : `-${formatMoney(Math.abs(delta))}`}
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-border-subtle flex justify-between font-bold text-text-main">
                    <span>Yeni Bakiye:</span>
                    <span className="font-money text-accent">{formatMoney(newBalance)}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={amount <= 0 || !description.trim() || newBalance < 0}
                className="btn-primary w-full text-xs"
              >
                <span>Düzeltmeyi İncele</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Confirm Screen */
            <div className="space-y-4">
              <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 text-center">
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  Banka Bakiye Düzeltmesi
                </span>

                <div className="text-base font-bold text-text-main my-2">
                  {selectedPlayer.name}
                </div>

                <div
                  className={`font-money font-extrabold text-2xl my-1 ${
                    delta > 0 ? 'text-money-pos' : 'text-money-neg'
                  }`}
                >
                  {delta > 0 ? `+${formatMoney(delta)}` : `-${formatMoney(Math.abs(delta))}`}
                </div>

                <div className="text-xs text-text-muted italic my-2">
                  "{description}"
                </div>

                <div className="mt-3 pt-3 border-t border-border-subtle text-xs text-left space-y-1">
                  <div className="flex justify-between text-text-muted">
                    <span>Eski Bakiye:</span>
                    <span className="font-money">{formatMoney(selectedPlayer.balance)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-text-main">
                    <span>Yeni Bakiye:</span>
                    <span className="font-money text-accent">{formatMoney(newBalance)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirming(false)}
                  disabled={loading}
                  className="btn-secondary flex-1 text-xs"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAdjustment}
                  disabled={loading}
                  className="btn-primary flex-1 text-xs"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Düzeltmeyi Uygula</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
