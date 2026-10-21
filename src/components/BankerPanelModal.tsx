import React, { useState } from 'react';
import { X, Shield, Plus, Minus, AlertTriangle, Loader2 } from 'lucide-react';
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
  players,
  onAdjustBalance,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');
  const [operationType, setOperationType] = useState<'add' | 'deduct'>('add');
  const [amountStr, setAmountStr] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedPlayer = players.find(p => p.id === selectedPlayerId) || players[0];
  const amount = parseFloat(amountStr) || 0;
  const delta = operationType === 'add' ? amount : -amount;

  const handleQuickGoSalary = async (player: Player) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await onAdjustBalance(player.id, 200, 'Başlangıç geçişi (+200 ₺)');
    } catch (err: any) {
      setError(err.message || 'Maaş eklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPlayer) {
      setError('Lütfen bir oyuncu seçin.');
      return;
    }
    if (amount <= 0) {
      setError('Lütfen geçerli bir tutar girin.');
      return;
    }
    if (selectedPlayer.balance + delta < 0) {
      setError(`Bakiye 0'ın altına düşemez! (Mevcut: ${formatMoney(selectedPlayer.balance)})`);
      return;
    }

    setLoading(true);
    try {
      await onAdjustBalance(selectedPlayer.id, delta, description.trim() || 'Banka düzeltmesi');
      setAmountStr('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Düzeltme yapılamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="bg-bg-card border border-border-subtle w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-4 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <h3 className="font-bold text-sm text-text-main">Bankacı Paneli</h3>
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

        {/* 1-Tap GO Salary for players */}
        <div className="mb-3">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
            Tek Dokunuşla Maaş (+200 ₺)
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto pr-0.5">
            {players.map(p => (
              <div
                key={p.id}
                className="p-1.5 px-2 bg-bg-surface border border-border-subtle rounded-lg flex items-center justify-between text-xs"
              >
                <div className="truncate mr-2">
                  <span className="font-medium text-text-main">{p.name}</span>
                  <span className="text-[10px] text-text-muted ml-1.5 font-money">
                    ({formatMoney(p.balance)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickGoSalary(p)}
                  disabled={loading}
                  className="bg-accent/15 hover:bg-accent hover:text-bg-main text-accent border border-accent/30 text-[11px] font-semibold px-2 py-1 rounded transition-colors shrink-0"
                >
                  +200 ₺
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Balance Adjustment */}
        <div className="pt-2.5 border-t border-border-subtle">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
            Bakiye Düzelt
          </div>
          <form onSubmit={handleExecute} className="space-y-2.5">
            {/* Player select */}
            <select
              value={selectedPlayerId}
              onChange={e => setSelectedPlayerId(e.target.value)}
              className="input-field py-2 text-xs"
            >
              {players.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — ({formatMoney(p.balance)})
                </option>
              ))}
            </select>

            {/* +/- toggle & Amount */}
            <div className="flex gap-1.5">
              <div className="flex rounded-lg border border-border-subtle overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setOperationType('add')}
                  className={`px-3 py-2 text-xs font-bold ${
                    operationType === 'add' ? 'bg-money-pos text-bg-main' : 'bg-bg-surface text-text-muted'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setOperationType('deduct')}
                  className={`px-3 py-2 text-xs font-bold ${
                    operationType === 'deduct' ? 'bg-money-neg text-bg-main' : 'bg-bg-surface text-text-muted'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative flex-1">
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={amountStr}
                  onChange={e => setAmountStr(e.target.value)}
                  placeholder="Tutar (₺)"
                  className="input-field py-2 text-sm font-money font-semibold"
                />
              </div>
            </div>

            {/* Optional note */}
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Açıklama (Örn: Sayım hatası)"
              className="input-field py-1.5 text-xs"
            />

            <button
              type="submit"
              disabled={loading || amount <= 0}
              className="btn-primary w-full py-2.5 text-xs font-bold"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>
                  {operationType === 'add' ? `+${formatMoney(amount)} Ekle` : `-${formatMoney(amount)} Düş`}
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
