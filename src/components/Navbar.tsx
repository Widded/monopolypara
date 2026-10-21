import React, { useState } from 'react';
import { Shield, Copy, Check, RotateCw, Palette } from 'lucide-react';
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
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <header className="shrink-0 z-30 bg-bg-main/95 backdrop-blur-md border-b border-border-subtle px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Sol: Logo + Oda Kodu Hapı + Yenileme & Tema Butonu */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-extrabold text-[16px] tracking-tight text-text-main select-none shrink-0">
            MONOPOLY
          </span>

          {/* Oda Kodu Glass Pill */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 bg-bg-surface hover:bg-bg-hover border border-border-subtle hover:border-border-active px-2.5 py-1 rounded-full transition-all active:scale-95 cursor-pointer group shadow-sm select-none"
            title="Oda kodunu kopyala"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 transition-all ${
                isLive
                  ? 'bg-accent shadow-[0_0_8px_var(--accent)] animate-pulse'
                  : 'bg-text-subtle'
              }`}
            />
            <span className="font-mono text-xs font-bold text-text-muted group-hover:text-text-main tracking-wider">
              {room.code}
            </span>
            {copied ? (
              <Check className="w-3 h-3 text-accent" />
            ) : (
              <Copy className="w-3 h-3 text-text-subtle group-hover:text-text-muted transition-colors opacity-70" />
            )}
          </button>

          {/* Manuel Yenile Butonu (Mobil için anında senkronize) */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-bg-surface hover:bg-bg-hover border border-border-subtle hover:border-border-active text-text-muted hover:text-text-main transition-all active:scale-90 disabled:opacity-60 cursor-pointer"
              title="Odayı ve oyuncuları yenile"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
            </button>
          )}

          {/* Tema Değiştir Butonu */}
          {onOpenThemeModal && (
            <button
              type="button"
              onClick={onOpenThemeModal}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-bg-surface hover:bg-bg-hover border border-border-subtle hover:border-border-active text-text-muted hover:text-accent transition-all active:scale-90 cursor-pointer"
              title="Renk Temasını Değiştir"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sağ: Bankacı Paneli ve Çıkış Butonları */}
        <div className="flex items-center gap-2 shrink-0">
          {currentPlayer?.is_banker && (
            <button
              type="button"
              onClick={onOpenBankerPanel}
              className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-300 border border-amber-500/30 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all shadow-sm"
              title="Banka Yönetim Paneli"
            >
              <Shield className="w-3 h-3 text-amber-400" />
              <span>Banka</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLeaveRoom}
            className="text-xs text-text-muted hover:text-money-neg transition-colors py-1 px-1.5 font-medium rounded-lg hover:bg-white/[0.04]"
            title="Odadan Ayrıl"
          >
            Çıkış
          </button>
        </div>
      </div>
    </header>
  );
};

