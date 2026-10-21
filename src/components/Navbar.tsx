import React, { useState } from 'react';
import { Shield, Copy, Check } from 'lucide-react';
import { Room, Player } from '../types';

interface NavbarProps {
  room: Room;
  currentPlayer: Player;
  playerCount: number;
  isLive: boolean;
  onOpenBankerPanel: () => void;
  onLeaveRoom: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  room,
  currentPlayer,
  playerCount,
  isLive,
  onOpenBankerPanel,
  onLeaveRoom,
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
    <header className="shrink-0 z-30 bg-bg-main/95 backdrop-blur-md border-b border-white/[0.07] px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Sol: Logo + Oda Kodu Hapı */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-extrabold text-[16px] tracking-tight text-white select-none shrink-0">
            MONOPOLY
          </span>

          {/* Oda Kodu Glass Pill */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 bg-[#141824] hover:bg-[#1A2030] border border-white/[0.08] hover:border-white/[0.16] px-2.5 py-1 rounded-full transition-all active:scale-95 cursor-pointer group shadow-sm select-none"
            title="Oda kodunu kopyala"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 transition-all ${
                isLive
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)] animate-pulse'
                  : 'bg-text-subtle'
              }`}
            />
            <span className="font-mono text-xs font-bold text-text-muted group-hover:text-white tracking-wider">
              {room.code}
            </span>
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-text-subtle group-hover:text-text-muted transition-colors opacity-70" />
            )}
          </button>
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

