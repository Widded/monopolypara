import React, { useState } from 'react';
import { X, Shield, Plus, Minus, AlertTriangle, Loader2 } from 'lucide-react';
import { Player, Room, Transaction } from '../types';
import { formatMoney } from '../utils/formatters';
import { Keypad } from './Keypad';

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
      await onAdjustBalance(selectedPlayer.id, delta, 'Banka düzeltmesi');
      setAmountStr('');
    } catch (err: any) {
      setError(err.message || 'Düzeltme yapılamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="bg-bg-card border border-border-subtle w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-4 shadow-2xl max-h-[92vh] overflow-y-auto">
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
          <div className="mb-2.5 p-2 rounded-lg bg-money-neg/10 border border-money-neg/30 flex items-center gap-2 text-xs text-money-neg">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {/* 1-Tap GO Salary */}
        <div className="mb-3">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            Tek Dokunuşla Maaş (+200 ₺)
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {players.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleQuickGoSalary(p)}
                disabled={loading}
                className="p-1.5 px-2 bg-bg-surface hover:bg-[#252b36] border border-border-subtle rounded-lg flex items-center justify-between text-xs transition-colors"
              >
                <div className="truncate text-left">
                  <div className="font-medium text-text-main truncate text-[11px]">{p.name}</div>
                  <div className="text-[10px] text-text-muted font-money">{formatMoney(p.balance)}</div>
                </div>
                <span className="text-[10px] font-bold text-accent bg-accent/15 px-1.5 py-0.5 rounded shrink-0 ml-1">
                  +200
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Balance Adjustment */}
        <div className="pt-2.5 border-t border-border-subtle">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
            Bakiye Düzelt
          </div>
          <form onSubmit={handleExecute} className="space-y-2">
            {/* Player select */}
            <select
              value={selectedPlayerId}
              onChange={e => setSelectedPlayerId(e.target.value)}
              className="input-field py-1.5 text-xs"
            >
              {players.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — ({formatMoney(p.balance)})
                </option>
              ))}
            </select>

            {/* +/- toggle & Amount Display */}
            <div className="flex items-center gap-2 p-2 bg-bg-surface border border-border-subtle rounded-xl justify-between">
              <div className="flex rounded-lg border border-border-subtle overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setOperationType('add')}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                    operationType === 'add' ? 'bg-money-pos text-bg-main' : 'bg-bg-card text-text-muted'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setOperationType('deduct')}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                    operationType === 'deduct' ? 'bg-money-neg text-bg-main' : 'bg-bg-card text-text-muted'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              </div>

              <span
                className={`text-xl font-money font-bold ${
                  delta > 0 ? 'text-money-pos' : delta < 0 ? 'text-money-neg' : 'text-text-main'
                }`}
              >
                {delta > 0 ? `+${formatMoney(delta)}` : delta < 0 ? `-${formatMoney(Math.abs(delta))}` : '0 ₺'}
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
