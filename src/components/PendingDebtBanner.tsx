import React, { useState } from 'react';
import { Debt, Player } from '../types';
import { formatMoney } from '../utils/formatters';
import { Check, X, Clock, HandCoins, AlertCircle } from 'lucide-react';

interface PendingDebtBannerProps {
  debts: Debt[];
  currentPlayer: Player;
  onApprove: (debtId: string) => Promise<void>;
  onReject: (debtId: string) => Promise<void>;
}

export const PendingDebtBanner: React.FC<PendingDebtBannerProps> = ({
  debts,
  currentPlayer,
  onApprove,
  onReject,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const incomingPending = debts.filter(
    d => d.debtor_id === currentPlayer.id && d.status === 'pending'
  );

  const outgoingPending = debts.filter(
    d => d.creditor_id === currentPlayer.id && d.status === 'pending'
  );

  if (incomingPending.length === 0 && outgoingPending.length === 0) {
    return null;
  }

  const handleAction = async (debtId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingId(debtId);
      if (action === 'approve') {
        await onApprove(debtId);
      } else {
        await onReject(debtId);
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-2">
      {/* Gelen Borç Teklifleri (Borcu alan oyuncu onaylamalı) */}
      {incomingPending.map(debt => (
        <div
          key={debt.id}
          className="bg-bg-surface border border-accent/40 rounded-xl p-3"
        >
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-accent/15 text-accent mt-0.5 shrink-0">
              <HandCoins className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-accent uppercase tracking-wider">
                  Borç Teklifi Onayı
                </span>
                <span className="font-money font-bold text-sm text-accent">
                  +{formatMoney(debt.initial_amount)}
                </span>
              </div>
              <p className="text-xs text-text-main mt-0.5">
                <strong className="text-white">{debt.creditor_name}</strong> size borç vermek istiyor.
              </p>
              {debt.description && (
                <p className="text-[10px] text-text-muted mt-0.5 italic truncate">
                  "{debt.description}"
                </p>
              )}

              {/* Aksiyon butonları */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  disabled={processingId === debt.id}
                  onClick={() => handleAction(debt.id, 'approve')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-accent hover:bg-accent-hover text-bg-main font-bold text-xs rounded-lg transition-colors disabled:opacity-50 active:scale-95 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  {processingId === debt.id ? 'İşleniyor...' : 'Kabul Et (+Para Al)'}
                </button>
                <button
                  type="button"
                  disabled={processingId === debt.id}
                  onClick={() => handleAction(debt.id, 'reject')}
                  className="flex items-center justify-center gap-1 py-1.5 px-3 bg-[#241C1C] hover:bg-[#341C1C] text-money-neg border border-money-neg/30 font-medium text-xs rounded-lg transition-colors disabled:opacity-50 active:scale-95"
                >
                  <X className="w-3.5 h-3.5" />
                  Reddet
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Giden Borç Teklifleri (Karşı tarafın onayı bekleniyor) */}
      {outgoingPending.map(debt => (
        <div
          key={debt.id}
          className="bg-bg-card border border-border-subtle rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-4 h-4 text-text-muted shrink-0" />
            <div className="min-w-0">
              <span className="text-text-main font-medium truncate block">
                <strong>{debt.debtor_name}</strong> kişisine{' '}
                <strong className="font-money text-accent">{formatMoney(debt.initial_amount)}</strong> borç teklifiniz onay bekliyor
              </span>
              <span className="text-[10px] text-text-muted">Onaylandığında para aktarılacaktır.</span>
            </div>
          </div>
          <button
            type="button"
            disabled={processingId === debt.id}
            onClick={() => handleAction(debt.id, 'reject')}
            className="shrink-0 text-[10px] font-semibold text-text-muted hover:text-money-neg border border-border-subtle hover:border-money-neg/40 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
          >
            İptal
          </button>
        </div>
      ))}
    </div>
  );
};
