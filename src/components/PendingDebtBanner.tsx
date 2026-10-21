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
    <div className="space-y-2 select-none">
      {/* Gelen Borç Teklifi */}
      {incomingPending.map(debt => (
        <div
          key={debt.id}
          className="bg-[#0E1218] border border-emerald-500/30 rounded-2xl p-3.5 text-xs shadow-lg animate-in fade-in"
        >
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <span className="font-bold text-white text-sm">
              {debt.creditor_name} size borç teklif etti
            </span>
            <span className="font-mono font-bold text-emerald-400 text-base">
              +{formatMoney(debt.initial_amount)}
            </span>
          </div>

          {debt.description && (
            <p className="text-xs text-neutral-400 mb-2.5">"{debt.description}"</p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              disabled={processingId === debt.id}
              onClick={() => handleAction(debt.id, 'approve')}
              className="btn-primary flex-1 py-2 text-xs font-bold"
            >
              {processingId === debt.id ? 'İşleniyor...' : 'Kabul Et'}
            </button>
            <button
              type="button"
              disabled={processingId === debt.id}
              onClick={() => handleAction(debt.id, 'reject')}
              className="btn-secondary py-2 px-4 text-xs text-rose-400 hover:text-rose-300 font-semibold"
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
          className="bg-[#0E1218] border border-white/[0.08] rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs shadow-md animate-in fade-in"
        >
          <div className="text-neutral-400 min-w-0 truncate">
            <span className="text-white font-semibold">{debt.debtor_name}</span> için{' '}
            <strong className="font-mono text-emerald-400 font-bold">{formatMoney(debt.initial_amount)}</strong> onay bekliyor
          </div>
          <button
            type="button"
            disabled={processingId === debt.id}
            onClick={() => handleAction(debt.id, 'reject')}
            className="text-xs text-neutral-400 hover:text-rose-400 font-semibold shrink-0 cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.04]"
          >
            İptal
          </button>
        </div>
      ))}
    </div>
  );
};
