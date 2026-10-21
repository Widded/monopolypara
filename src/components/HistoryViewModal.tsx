import React, { useState } from 'react';
import { X, History, Send, HandCoins, CheckSquare, Handshake, ShieldAlert, Landmark, Skull, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { Transaction, Player, TransactionType } from '../types';
import { formatMoney, formatTime, TRANSACTION_TYPE_LABELS } from '../utils/formatters';

interface HistoryViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  players: Player[];
  currentPlayer?: Player;
  onReverseTransaction?: (transactionId: string) => Promise<void>;
}

export const HistoryViewModal: React.FC<HistoryViewModalProps> = ({
  isOpen,
  onClose,
  transactions,
  players,
  currentPlayer,
  onReverseTransaction,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all');
  const [confirmTx, setConfirmTx] = useState<Transaction | null>(null);
  const [reversing, setReversing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isBanker = currentPlayer?.is_banker === true;

  const filteredTransactions = transactions.filter(t => {
    if (selectedType !== 'all' && t.type !== selectedType) return false;
    if (selectedPlayerId !== 'all') {
      if (t.from_player_id !== selectedPlayerId && t.to_player_id !== selectedPlayerId) {
        return false;
      }
    }
    return true;
  });

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'transfer':
        return <Send className="w-3 h-3 text-accent" />;
      case 'bank_payment':
        return <Landmark className="w-3 h-3 text-amber-400" />;
      case 'bankruptcy':
        return <Skull className="w-3 h-3 text-red-400" />;
      case 'debt_lend':
        return <HandCoins className="w-3 h-3 text-money-pos" />;
      case 'debt_payment':
        return <CheckSquare className="w-3 h-3 text-[#E6A23C]" />;
      case 'debt_settlement':
        return <Handshake className="w-3 h-3 text-[#9D7CE8]" />;
      case 'banker_adjust':
        return <ShieldAlert className="w-3 h-3 text-[#67C23A]" />;
      case 'reversal':
        return <RotateCcw className="w-3 h-3 text-amber-400" />;
      default:
        return <History className="w-3 h-3 text-text-muted" />;
    }
  };

  const handleExecuteReverse = async () => {
    if (!confirmTx || !onReverseTransaction || reversing) return;
    setReversing(true);
    setError(null);
    try {
      await onReverseTransaction(confirmTx.id);
      setConfirmTx(null);
    } catch (err: any) {
      setError(err.message || 'İşlem geri alınamadı.');
    } finally {
      setReversing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-100 overflow-y-auto">
      <div className="bg-[#0E1218] border border-white/[0.08] w-full max-w-sm rounded-3xl p-4.5 sm:p-5 shadow-2xl shadow-black/90 max-h-[90dvh] flex flex-col my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle mb-2.5">
          <div className="flex items-center gap-1.5">
            <History className="w-4 h-4 text-text-muted" />
            <h3 className="font-bold text-sm text-text-main">İşlem Geçmişi</h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Confirmation Banner for Reversal */}
        {confirmTx && (
          <div className="mb-2.5 p-2.5 rounded-xl border border-amber-500/40 bg-amber-950/25 space-y-2 animate-in fade-in duration-100 shrink-0">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs min-w-0">
                <strong className="text-amber-300 font-bold block mb-0.5">Hatalı İşlemi Geri Al</strong>
                <p className="text-[11px] text-text-subtle leading-relaxed">
                  <strong>{confirmTx.from_player_name || 'Banka'}</strong> → <strong>{confirmTx.to_player_name || 'Banka'}</strong> arasındaki <strong className="text-accent font-money">{formatMoney(confirmTx.amount)}</strong> tutarındaki işlem geri alınacak ve para iade edilecek.
                </p>
              </div>
            </div>
            {error && (
              <div className="text-[11px] text-money-neg font-medium">{error}</div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={reversing}
                onClick={() => {
                  setConfirmTx(null);
                  setError(null);
                }}
                className="py-1 px-2.5 text-xs rounded border border-border-subtle text-text-muted hover:text-text-main cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={reversing}
                onClick={handleExecuteReverse}
                className="py-1 px-3 text-xs rounded bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center gap-1 cursor-pointer"
              >
                {reversing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                <span>İşlemi Geri Al</span>
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-2 gap-1.5 mb-2.5 shrink-0">
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="input-field py-1.5 px-2 text-[11px]"
          >
            <option value="all">Tüm İşlemler</option>
            <option value="transfer">Transferler</option>
            <option value="debt_lend">Borç Verme</option>
            <option value="debt_payment">Borç Ödeme</option>
            <option value="debt_settlement">Anlaşmalı</option>
            <option value="banker_adjust">Banka</option>
            <option value="reversal">İptaller</option>
          </select>

          <select
            value={selectedPlayerId}
            onChange={e => setSelectedPlayerId(e.target.value)}
            className="input-field py-1.5 px-2 text-[11px]"
          >
            <option value="all">Tüm Oyuncular</option>
            {players.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Transactions List */}
        <div className="space-y-1.5 overflow-y-auto flex-1 pr-0.5">
          {filteredTransactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-muted">
              İşlem bulunamadı.
            </div>
          ) : (
            filteredTransactions.map(tx => {
              const isReversible = isBanker && !tx.is_reversed && (tx.type === 'transfer' || tx.type === 'bank_payment' || tx.type === 'banker_adjust');

              return (
                <div
                  key={tx.id}
                  className={`p-2 rounded-lg text-xs flex items-center justify-between border transition-colors ${
                    tx.is_reversed 
                      ? 'bg-bg-surface/50 border-border-subtle/40 opacity-60' 
                      : 'bg-bg-surface border-border-subtle/70'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      {getTransactionIcon(tx.type)}
                      <span className={`font-medium truncate text-[11px] ${tx.is_reversed ? 'line-through text-text-muted' : 'text-text-main'}`}>
                        {tx.from_player_name} → {tx.to_player_name}
                      </span>
                      {tx.is_reversed && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/[0.06] text-text-subtle border border-border-subtle shrink-0">
                          Geri Alındı
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1">
                      <span>{TRANSACTION_TYPE_LABELS[tx.type] || tx.type}</span>
                      <span>·</span>
                      <span>{formatTime(tx.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`font-money font-bold text-xs ${tx.is_reversed ? 'text-text-subtle line-through' : 'text-accent'}`}>
                      {formatMoney(tx.amount)}
                    </div>
                    {isReversible && (
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setConfirmTx(tx);
                        }}
                        className="p-1 rounded hover:bg-white/[0.08] text-text-subtle hover:text-amber-400 transition-colors cursor-pointer"
                        title="Hatalı işlemi geri al"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
