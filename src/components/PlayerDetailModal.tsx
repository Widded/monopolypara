import React, { useState, useEffect } from 'react';
import { X, Send, HandCoins, ArrowUpRight, ArrowDownLeft, Skull, AlertTriangle } from 'lucide-react';
import { Player, Debt, Transaction } from '../types';
import { formatMoney } from '../utils/formatters';

interface PlayerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  currentPlayer: Player;
  players?: Player[];
  debts: Debt[];
  transactions: Transaction[];
  onOpenTransfer: (targetPlayer: Player) => void;
  onOpenLend: (targetPlayer: Player) => void;
  onOpenPayDebt: (debtId?: string) => void;
  onOpenDebtDetail?: (debt: Debt) => void;
  onDeclareBankruptcy?: (beneficiaryId?: string | null) => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  isOpen,
  onClose,
  player,
  currentPlayer,
  players = [],
  debts,
  onOpenTransfer,
  onOpenLend,
  onOpenPayDebt,
  onDeclareBankruptcy,
}) => {
  const [confirmBankruptcy, setConfirmBankruptcy] = useState(false);
  const [beneficiaryTarget, setBeneficiaryTarget] = useState<string>('bank');

  useEffect(() => {
    if (!isOpen) {
      setConfirmBankruptcy(false);
      setBeneficiaryTarget('bank');
    }
  }, [isOpen]);

  if (!isOpen || !player) return null;

  const isSelf = player.id === currentPlayer.id;
  const isBankrupt = player.is_bankrupt === true;
  const playerDebts = debts.filter(d => d.debtor_id === player.id && (d.status === 'active' || d.status === 'partially_paid'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-100 overflow-y-auto">
      <div className="bg-[#0E1218] border border-white/[0.08] w-full max-w-sm rounded-3xl p-4.5 sm:p-5 shadow-2xl shadow-black/90 max-h-[92dvh] overflow-y-auto my-auto animate-in zoom-in-95 duration-150">
        {/* Başlık */}
        <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle mb-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="font-bold text-base text-text-main tracking-tight">{player.name}</h3>
            {isSelf && (
              <span className="text-xs font-semibold text-accent">
                (Sen)
              </span>
            )}
            {player.is_banker && (
              <span className="text-[11px] text-[#7E99D3]">
                · Bankacı
              </span>
            )}
            {isBankrupt && (
              <span className="text-[11px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                <Skull className="w-3 h-3" /> İflas Etti
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-subtle hover:text-text-main p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bakiye Özeti */}
        <div className={`py-3 px-3.5 bg-bg-surface border rounded-lg text-center mb-3 ${isBankrupt ? 'border-red-500/30 bg-red-950/10' : 'border-border-subtle'}`}>
          <div className="text-[11px] text-text-muted mb-0.5">Nakit Bakiye</div>
          <div className={`font-money font-bold text-2xl ${isBankrupt ? 'text-text-muted line-through' : 'text-text-main'}`}>
            {formatMoney(player.balance)}
          </div>
          <div className="flex justify-center gap-4 text-xs text-text-muted pt-2 border-t border-border-subtle mt-2">
            <span>
              Alacak: <strong className="font-money text-money-pos font-semibold">{formatMoney(player.total_receivable || 0)}</strong>
            </span>
            <span className="text-border-subtle">·</span>
            <span>
              Borç: <strong className="font-money text-money-neg font-semibold">{formatMoney(player.total_debt || 0)}</strong>
            </span>
          </div>
        </div>

        {/* Kurtarma PIN Kodu - Herkese Görünür */}
        {!isBankrupt && (
          <div className="py-2.5 px-3 bg-bg-surface border border-white/[0.08] rounded-xl flex items-center justify-between text-xs mb-3 shadow-inner">
            <div>
              <span className="text-[11px] text-text-muted font-bold block">Kurtarma Kodu (PIN)</span>
              <span className="text-[10px] text-text-subtle">
                {isSelf ? 'Çıkış yaparsan bu kodla geri dönersin' : 'Oyuncu çıkış yaparsa bu kodla geri dönebilir'}
              </span>
            </div>
            <span className="font-mono font-bold text-sm text-accent bg-bg-card border border-accent/30 px-2.5 py-0.5 rounded-lg tracking-widest select-all">
              {player.recovery_pin || '----'}
            </span>
          </div>
        )}

        {/* Başkasıysa işlem butonları */}
        {!isSelf && !isBankrupt && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTransfer(player);
              }}
              className="btn-primary py-2 text-xs font-bold"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Para Gönder</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLend(player);
              }}
              className="btn-secondary py-2 text-xs font-semibold"
            >
              <HandCoins className="w-3.5 h-3.5" />
              <span>Borç Ver</span>
            </button>
          </div>
        )}

        {/* Açık Borçları */}
        {playerDebts.length > 0 && !isBankrupt && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-semibold text-text-muted">
              Açık Borçları ({playerDebts.length})
            </div>
            {playerDebts.map(d => (
              <div
                key={d.id}
                className="py-2 px-3 bg-bg-surface border border-border-subtle rounded-lg flex items-center justify-between text-xs"
              >
                <div>
                  <span className="text-text-main font-medium">{d.creditor_name}'e</span>
                  <span className="text-[11px] text-money-neg font-money block">
                    Kalan: {formatMoney(d.remaining_amount)}
                  </span>
                </div>
                {isSelf && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPayDebt(d.id);
                    }}
                    className="btn-secondary py-1 px-2.5 text-[11px]"
                  >
                    Öde
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* İflas Bildirme Alanı (Yalnızca Kendisi ve İflas Etmemişse) */}
        {isSelf && !isBankrupt && onDeclareBankruptcy && (
          <div className="pt-2 border-t border-border-subtle mt-3">
            {!confirmBankruptcy ? (
              <button
                type="button"
                onClick={() => setConfirmBankruptcy(true)}
                className="w-full py-2 px-3 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Skull className="w-3.5 h-3.5" />
                <span>İflas Bildir (Masadan Çekil)</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl border border-red-500/40 bg-red-950/30 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1 min-w-0">
                    <strong className="text-red-400 font-semibold block text-xs">İflas ve Varlık Devri</strong>
                    <p className="text-[11px] text-text-subtle leading-relaxed">
                      Borcunuzu ödeyemediğiniz için iflas bildireceksiniz. Kalan tüm paranız seçtiğiniz alacaklıya aktarılır ve oyundan elenirsiniz.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                    Varlığınız Kime Aktarılacak?
                  </label>
                  <select
                    value={beneficiaryTarget}
                    onChange={e => setBeneficiaryTarget(e.target.value)}
                    className="input-field py-1.5 px-2 text-xs w-full bg-bg-surface border-border-subtle"
                  >
                    <option value="bank">Banka Kasası (Vergi / Ceza)</option>
                    {players
                      .filter(p => p.id !== player.id && !p.is_bankrupt && p.is_online !== false)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Kira / Tapu Alacaklısı)
                        </option>
                      ))}
                  </select>
                </div>

                <div className="p-2 rounded-lg bg-bg-surface/60 border border-border-subtle text-[11px] text-text-muted">
                  {beneficiaryTarget === 'bank' ? (
                    <span>
                      Kalan <strong className="font-money text-accent">{formatMoney(player.balance)}</strong> tutarındaki bakiyeniz <strong>Banka Kasasına</strong> devredilecek.
                    </span>
                  ) : (
                    <span>
                      Kalan <strong className="font-money text-accent">{formatMoney(player.balance)}</strong> tutarındaki bakiyeniz <strong>{players.find(p => p.id === beneficiaryTarget)?.name || 'seçilen oyuncuya'}</strong> devredilecek.
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setConfirmBankruptcy(false)}
                    className="py-1.5 px-3 rounded-lg border border-border-subtle bg-bg-surface hover:bg-white/[0.05] text-text-muted text-xs font-medium cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmBankruptcy(false);
                      onClose();
                      onDeclareBankruptcy(beneficiaryTarget === 'bank' ? null : beneficiaryTarget);
                    }}
                    className="py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-red-950/50 cursor-pointer"
                  >
                    <Skull className="w-3.5 h-3.5" />
                    <span>İflası Onayla</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
