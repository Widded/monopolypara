import React, { useEffect, useState } from 'react';
import { X, Handshake, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Debt, DebtPayment, DebtSettlement } from '../types';
import { formatMoney, formatTime } from '../utils/formatters';
import { dataService } from '../services/dataService';

interface DebtDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
  onPayShortcut?: (debt: Debt) => void;
}

export const DebtDetailModal: React.FC<DebtDetailModalProps> = ({
  isOpen,
  onClose,
  debt,
  onPayShortcut,
}) => {
  const [details, setDetails] = useState<{
    payments: DebtPayment[];
    settlement: DebtSettlement | null;
  } | null>(null);

  useEffect(() => {
    if (isOpen && debt) {
      dataService.getDebtDetails(debt.id).then(res => {
        if (res) {
          setDetails({
            payments: res.payments || [],
            settlement: res.settlement || null,
          });
        }
      });
    } else {
      setDetails(null);
    }
  }, [isOpen, debt]);

  if (!isOpen || !debt) return null;

  const isClosed = debt.status === 'settled' || debt.remaining_amount === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-bg-card border border-border-subtle w-full max-w-md rounded-2xl p-5 shadow-2xl max-h-[90dvh] overflow-y-auto my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-text-main">Borç Detayı</h3>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isClosed
                  ? 'bg-money-pos/15 text-money-pos border border-money-pos/30'
                  : 'bg-accent/15 text-accent border border-accent/30'
              }`}
            >
              {isClosed ? 'Kapatıldı' : 'Açık Borç'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Players & Status */}
        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 text-xs mb-3">
            <div>
              <span className="text-text-muted block text-[11px]">Borç Veren (Alacaklı)</span>
              <span className="font-semibold text-text-main text-sm">{debt.creditor_name}</span>
            </div>
            <div>
              <span className="text-text-muted block text-[11px]">Borç Alan (Borçlu)</span>
              <span className="font-semibold text-text-main text-sm">{debt.debtor_name}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-subtle text-center">
            <div>
              <span className="text-[10px] text-text-muted block">İlk Tutar</span>
              <span className="font-money font-semibold text-xs text-text-main">
                {formatMoney(debt.initial_amount)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-text-muted block">Ödenen</span>
              <span className="font-money font-semibold text-xs text-money-pos">
                {formatMoney(debt.paid_amount)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-text-muted block">Kalan</span>
              <span
                className={`font-money font-bold text-sm ${
                  debt.remaining_amount > 0 ? 'text-accent' : 'text-text-muted'
                }`}
              >
                {formatMoney(debt.remaining_amount)}
              </span>
            </div>
          </div>

          {debt.description && (
            <div className="mt-3 pt-2 border-t border-border-subtle/50 text-xs text-text-muted italic">
              Açıklama: "{debt.description}"
            </div>
          )}
        </div>

        {/* Settlement notice if exists */}
        {details?.settlement && (
          <div className="mb-4 p-3 bg-accent/10 border border-accent/30 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-accent font-semibold">
              <Handshake className="w-4 h-4" />
              <span>Anlaşmalı Olarak Kapatıldı</span>
            </div>
            <div className="text-text-muted">
              Anlaşılan Ödeme:{' '}
              <span className="font-money text-text-main font-semibold">
                {formatMoney(details.settlement.agreed_payment)}
              </span>{' '}
              · Silinen Tutar:{' '}
              <span className="font-money text-money-neg font-semibold">
                {formatMoney(details.settlement.forgiven_amount)}
              </span>
            </div>
          </div>
        )}

        {/* Payment History Timeline */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Ödeme Geçmişi
          </h4>
          {!details?.payments || details.payments.length === 0 ? (
            <div className="p-4 bg-bg-surface border border-border-subtle rounded-xl text-xs text-text-muted text-center">
              Henüz bu borç için yapılmış bir ödeme kaydı yok.
            </div>
          ) : (
            <div className="space-y-2">
              {details.payments.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="p-3 bg-bg-surface border border-border-subtle rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-money-pos" />
                    <div>
                      <span className="font-medium text-text-main">Kısmi Ödeme</span>
                      <span className="text-[10px] text-text-muted block">
                        {formatTime(p.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-money font-semibold text-money-pos text-xs">
                      +{formatMoney(p.amount)}
                    </span>
                    <span className="text-[10px] text-text-muted block font-money">
                      Kalan: {formatMoney(p.remaining_after)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Button if open */}
        {!isClosed && onPayShortcut && (
          <button
            onClick={() => {
              onClose();
              onPayShortcut(debt);
            }}
            className="btn-primary w-full text-xs"
          >
            Bu Borcu Öde / Kapat
          </button>
        )}
      </div>
    </div>
  );
};
