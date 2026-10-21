import React, { useState } from 'react';
import { Debt, Player } from '../types';
import { formatMoney } from '../utils/formatters';

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
      {/* Gelen Borç Teklifi */}
      {incomingPending.map(debt => (
        <div
          key={debt.id}
          className="bg-bg-surface border border-border-active rounded-lg p-3 text-xs"
        >
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <span className="font-semibold text-text-main">
              {debt.creditor_name} size borç teklif etti
            </span>
            <span className="font-money font-bold text-money-pos text-sm">
              +{formatMoney(debt.initial_amount)}
            </span>
          </div>

          {debt.description && (
            <p className="text-[11px] text-text-muted mb-2">"{debt.description}"</p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              disabled={processingId === debt.id}
              onClick={() => handleAction(debt.id, 'approve')}
              className="btn-primary flex-1 py-1.5 text-xs font-bold"
            >
              {processingId === debt.id ? 'İşleniyor...' : 'Kabul Et'}
            </button>
            <button
              type="button"
              disabled={processingId === debt.id}
              onClick={() => handleAction(debt.id, 'reject')}
              className="btn-secondary py-1.5 px-3 text-xs text-money-neg hover:text-money-neg"
            >
              Reddet
            </button>
          </div>
        </div>
      ))}

      {/* Giden Borç Teklifi */}
      {outgoingPending.map(debt => (
        <div
          key={debt.id}
          className="bg-bg-card border border-border-subtle rounded-lg px-3 py-2 flex items-center justify-between gap-2 text-xs"
        >
          <div className="text-text-muted min-w-0 truncate">
            <span className="text-text-main font-medium">{debt.debtor_name}</span> için{' '}
            <strong className="font-money text-text-main">{formatMoney(debt.initial_amount)}</strong> onay bekliyor
          </div>
          <button
            type="button"
            disabled={processingId === debt.id}
            onClick={() => handleAction(debt.id, 'reject')}
            className="text-[11px] text-text-subtle hover:text-money-neg shrink-0"
          >
            İptal
          </button>
        </div>
      ))}
    </div>
  );
};
