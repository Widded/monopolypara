import React, { useState } from 'react';
import { Shield, Copy, Check, RotateCw, Palette, Trophy, Users } from 'lucide-react';
import { Room, Player } from '../types';

interface NavbarProps {
  room: Room;
  currentPlayer: Player;
  playerCount: number;
  isLive: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onOpenBankerPanel: () => void;
  onLeaveRoom: () => void;
  onOpenThemeModal?: () => void;
  onOpenStats?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  room,
  currentPlayer,
  playerCount,
  isLive,
  isRefreshing = false,
  onRefresh,
  onOpenBankerPanel,
  onLeaveRoom,
  onOpenThemeModal,
  onOpenStats,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    // Sadece 5 haneli rakam kısmını kopyala (WID- prefixi giriş ekranında zaten sabit var)
    const codeDigits = room.code.replace(/^WID-?/i, '');
    try {
      await navigator.clipboard.writeText(codeDigits);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const formattedCode = room.code.startsWith('WID-') ? room.code : `WID-${room.code}`;

  return (
    <header className="shrink-0 z-30 bg-[#0B0E14]/95 backdrop-blur-md border-b border-white/[0.06] px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Sol: Oda Kodu (Yeşil Işık + Kod + Kopyala) */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 py-1 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all cursor-pointer group select-none"
            title={`Oda kodunu kopyala: ${room.code.replace(/^WID-?/i, '')}`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 transition-all ${
                isLive
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse'
                  : 'bg-neutral-500'
              }`}
            />
            <span className="font-mono text-xs font-bold text-neutral-200 group-hover:text-white tracking-wider">
              {formattedCode}
            </span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300 transition-colors shrink-0" />
            )}
          </button>
        </div>

        {/* Sağ: Oyuncu Sayacı + Bizim Üst Bar Butonları + Çıkış */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Oyuncu Sayacı */}
          <div
            className="flex items-center gap-1.5 text-xs text-neutral-300 font-medium px-1.5 py-1"
            title={`Masada ${playerCount} Oyuncu`}
          >
            <Users className="w-3.5 h-3.5 text-neutral-400" />
            <span>{playerCount}</span>
          </div>

          {/* Manuel Yenile Butonu */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-all active:scale-90 disabled:opacity-60 cursor-pointer"
              title="Odayı ve oyuncuları yenile"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          )}

          {/* Tema Değiştir Butonu */}
          {onOpenThemeModal && (
            <button
              type="button"
              onClick={onOpenThemeModal}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-emerald-400 transition-all active:scale-90 cursor-pointer"
              title="Renk Temasını Değiştir"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Masa İstatistikleri & Liderlik Butonu */}
          {onOpenStats && (
            <button
              type="button"
              onClick={onOpenStats}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-amber-400 transition-all active:scale-90 cursor-pointer"
              title="Masa İstatistikleri ve Liderlik"
            >
              <Trophy className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Bankacı Paneli Butonu */}
          {currentPlayer?.is_banker && (
            <button
              type="button"
              onClick={onOpenBankerPanel}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all active:scale-90 cursor-pointer"
              title="Banka Yönetim Paneli"
            >
              <Shield className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Çıkış */}
          <button
            type="button"
            onClick={onLeaveRoom}
            className="text-xs text-neutral-400 hover:text-white transition-colors py-1 px-1.5 font-medium ml-1 cursor-pointer select-none"
            title="Odadan Ayrıl"
          >
            Çıkış
          </button>
        </div>
      </div>
    </header>
  );
};
