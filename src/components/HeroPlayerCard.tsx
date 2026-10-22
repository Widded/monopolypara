import React from 'react';
import { Landmark, Navigation, ChevronRight, Shield, Award, Users } from 'lucide-react';
import { Player } from '../types';
import { formatMoney } from '../utils/formatters';

interface HeroPlayerCardProps {
  player: Player;
  rank?: number;
  totalPlayers?: number;
  onSendMoney: () => void;
  onPayBank: () => void;
  onLendDebt: () => void;
  onSelectPlayer: (player: Player) => void;
}

export const HeroPlayerCard: React.FC<HeroPlayerCardProps> = ({
  player,
  rank,
  totalPlayers,
  onSendMoney,
  onPayBank,
  onLendDebt,
  onSelectPlayer,
}) => {
  const safePlayerName =
    player.name && player.name.trim().length > 0 ? player.name.trim() : 'İsimsiz Oyuncu';
  const initial = safePlayerName.charAt(0).toUpperCase();

  const receivables = Number(player.total_receivable || 0);
  const debts = Number(player.total_debt || 0);
  const hasDebtsOrReceivables = receivables > 0 || debts > 0;
  const netWorth = player.balance + receivables - debts;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#141824] via-[#0F131C] to-[#0A0D14] border border-white/[0.1] p-5 shadow-2xl shadow-black/80 select-none group transition-all duration-200">
      {/* Ambient Radial Glowing Sheen (Apple Card Aura) */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/[0.09] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />

      {/* 1. Üst Başlık Satırı: Avatar + İsim & Rozetler + Sağ Detay/Sıralama */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Glowing Avatar */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400/25 to-emerald-600/10 border border-emerald-400/35 flex items-center justify-center font-bold text-base text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.18)] shrink-0">
            {initial}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-base text-white tracking-tight truncate">
                {safePlayerName}
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                Sen
              </span>
              {player.is_banker && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                  <Shield className="w-2.5 h-2.5" />
                  <span>Bankacı</span>
                </span>
              )}
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5 font-medium">
              <span className="flex items-center gap-1 text-emerald-400/90">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Masada Aktif</span>
              </span>
              {player.recovery_pin && (
                <>
                  <span className="text-white/20 select-none">•</span>
                  <span className="font-mono text-neutral-400">PIN: {player.recovery_pin}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sağ Buton: Detaylar */}
        <button
          type="button"
          onClick={() => onSelectPlayer(player)}
          className="flex items-center gap-1 py-1.5 px-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white border border-white/[0.08] text-xs font-semibold transition-all active:scale-95 cursor-pointer shrink-0"
          title="Oyuncu ayrıntılarını ve işlem geçmişini gör"
        >
          {rank && (
            <span className="text-amber-400 font-bold flex items-center gap-0.5 mr-0.5">
              <Award className="w-3.5 h-3.5" />
              <span>#{rank}</span>
            </span>
          )}
          <span>Detay</span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
        </button>
      </div>

      {/* 2. Orta Bakiye Odak Alanı (Massive Apple Card Typography) */}
      <div className="relative z-10 my-3">
        <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest flex items-center justify-between">
          <span>Kullanılabilir Bakiye</span>
          {hasDebtsOrReceivables && (
            <span className="text-[10px] text-neutral-400 font-mono font-normal lowercase tracking-normal">
              net varlık: <strong className="text-white font-semibold font-mono">{formatMoney(netWorth)}</strong>
            </span>
          )}
        </div>

        <div className="text-4xl sm:text-[46px] font-black font-money tracking-tight text-white tabular-nums my-1.5 leading-none">
          {formatMoney(player.balance)}
        </div>

        {/* Alacak / Borç İnce Çipi - Yalnızca varsa gösterilir */}
        {hasDebtsOrReceivables ? (
          <div className="flex items-center gap-2 pt-1 font-mono text-xs">
            {receivables > 0 && (
              <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg font-medium">
                +{formatMoney(receivables)} Alacak
              </span>
            )}
            {debts > 0 && (
              <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg font-medium">
                -{formatMoney(debts)} Borç
              </span>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-neutral-500 pt-0.5">
            Aktif borç veya alacak bulunmuyor
          </div>
        )}
      </div>

      {/* 3. Alt Hızlı Aksiyon Butonları (1-Tap Fast FinTech Actions) */}
      <div className="relative z-10 pt-3 border-t border-white/[0.07] grid grid-cols-3 gap-2">
        {/* Para Gönder (Primary Hero Button) */}
        <button
          type="button"
          onClick={onSendMoney}
          className="col-span-1 sm:col-span-1 py-2.5 px-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-[#050807] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5 rotate-45 stroke-[2.8]" />
          <span>Gönder</span>
        </button>

        {/* Bankaya Öde (Tapu / Vergi / Ceza) */}
        <button
          type="button"
          onClick={onPayBank}
          className="col-span-1 py-2.5 px-2 rounded-xl bg-[#181D29] hover:bg-[#1F2636] text-amber-300 hover:text-amber-200 border border-amber-500/25 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
          title="Tapu alımı, gelir vergisi veya 50 ₺ hapis cezası öde"
        >
          <Landmark className="w-3.5 h-3.5 text-amber-400" />
          <span>Banka</span>
        </button>

        {/* Borç Ver */}
        <button
          type="button"
          onClick={onLendDebt}
          className="col-span-1 py-2.5 px-2 rounded-xl bg-[#181D29] hover:bg-[#1F2636] text-neutral-300 hover:text-white border border-white/[0.08] font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
          title="Arkadaşına borç para teklif et"
        >
          <Users className="w-3.5 h-3.5 text-neutral-400" />
          <span>Borç Ver</span>
        </button>
      </div>
    </div>
  );
};
