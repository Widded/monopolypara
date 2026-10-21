import React, { useState } from 'react';
import { X, History, Send, HandCoins, CheckSquare, Handshake, ShieldAlert } from 'lucide-react';
import { Transaction, Player, TransactionType } from '../types';
import { formatMoney, formatTime, TRANSACTION_TYPE_LABELS } from '../utils/formatters';

interface HistoryViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  players: Player[];
}

export const HistoryViewModal: React.FC<HistoryViewModalProps> = ({
  isOpen,
  onClose,
  transactions,
  players,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all');

  if (!isOpen) return null;

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
      case 'debt_lend':
        return <HandCoins className="w-3 h-3 text-money-pos" />;
      case 'debt_payment':
        return <CheckSquare className="w-3 h-3 text-[#E6A23C]" />;
      case 'debt_settlement':
        return <Handshake className="w-3 h-3 text-[#9D7CE8]" />;
      case 'banker_adjust':
        return <ShieldAlert className="w-3 h-3 text-[#67C23A]" />;
      default:
        return <History className="w-3 h-3 text-text-muted" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="bg-bg-card border border-border-subtle w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-4 shadow-xl max-h-[85vh] flex flex-col">
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
            filteredTransactions.map(tx => (
              <div
                key={tx.id}
                className="p-2 bg-bg-surface border border-border-subtle/70 rounded-lg text-xs flex items-center justify-between"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1">
                    {getTransactionIcon(tx.type)}
                    <span className="font-medium text-text-main truncate text-[11px]">
                      {tx.from_player_name} → {tx.to_player_name}
                    </span>
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1">
                    <span>{TRANSACTION_TYPE_LABELS[tx.type] || tx.type}</span>
                    <span>·</span>
                    <span>{formatTime(tx.created_at)}</span>
                  </div>
                </div>
                <div className="font-money font-bold text-xs text-accent shrink-0">
                  {formatMoney(tx.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
