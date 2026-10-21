import React, { useState } from 'react';
import { X, Filter, History, Send, HandCoins, CheckSquare, Handshake, ShieldAlert } from 'lucide-react';
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
        return <Send className="w-3.5 h-3.5 text-accent" />;
      case 'debt_lend':
        return <HandCoins className="w-3.5 h-3.5 text-money-pos" />;
      case 'debt_payment':
        return <CheckSquare className="w-3.5 h-3.5 text-[#E6A23C]" />;
      case 'debt_settlement':
        return <Handshake className="w-3.5 h-3.5 text-[#9D7CE8]" />;
      case 'banker_adjust':
        return <ShieldAlert className="w-3.5 h-3.5 text-[#67C23A]" />;
      default:
        return <History className="w-3.5 h-3.5 text-text-muted" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-bg-card border border-border-subtle w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-bg-surface border border-border-subtle flex items-center justify-center text-text-main">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text-main">İşlem Geçmişi</h3>
              <p className="text-[11px] text-text-muted">Toplam {transactions.length} kayıt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
          <div>
            <label className="block text-[10px] text-text-muted font-medium mb-1 uppercase tracking-wider">
              İşlem Türü
            </label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="input-field text-xs py-2"
            >
              <option value="all">Tüm İşlemler</option>
              <option value="transfer">Para Gönderimi</option>
              <option value="debt_lend">Borç Verme</option>
              <option value="debt_payment">Borç Ödemesi</option>
              <option value="debt_settlement">Anlaşmalı Kapatma</option>
              <option value="banker_adjust">Banka / Düzeltme</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-text-muted font-medium mb-1 uppercase tracking-wider">
              Oyuncu Filtresi
            </label>
            <select
              value={selectedPlayerId}
              onChange={e => setSelectedPlayerId(e.target.value)}
              className="input-field text-xs py-2"
            >
              <option value="all">Tüm Oyuncular</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-2 overflow-y-auto flex-1 pr-1">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center bg-bg-surface border border-border-subtle rounded-2xl">
              <Filter className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-60" />
              <p className="text-xs text-text-muted">Filtreye uygun işlem bulunamadı.</p>
            </div>
          ) : (
            filteredTransactions.map(tx => (
              <div
                key={tx.id}
                className="p-3 bg-bg-surface border border-border-subtle rounded-xl text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {getTransactionIcon(tx.type)}
                    <span className="font-semibold text-text-main text-[11px]">
                      {TRANSACTION_TYPE_LABELS[tx.type] || tx.type}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-muted">
                    {formatTime(tx.created_at)}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-0.5">
                  <div className="font-medium text-text-main text-xs">
                    {tx.from_player_name}{' '}
                    <span className="text-text-muted">→</span>{' '}
                    {tx.to_player_name}
                  </div>
                  <div className="font-money font-bold text-sm text-accent">
                    {formatMoney(tx.amount)}
                  </div>
                </div>

                {tx.description && (
                  <div className="text-[11px] text-text-muted italic pt-0.5 border-t border-border-subtle/40">
                    "{tx.description}"
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
