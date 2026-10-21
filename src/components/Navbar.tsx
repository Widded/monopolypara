import React, { useState } from 'react';
import { Copy, Check, Users, Shield, LogOut } from 'lucide-react';
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
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="shrink-0 z-30 bg-bg-main/95 backdrop-blur-md border-b border-border-subtle px-3 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Left: App Brand & Room Code Pill */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-extrabold text-sm text-text-main tracking-tight shrink-0">
            Monopoly
          </span>

          {/* Interactive Compact Room Code Pill */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 bg-bg-surface hover:bg-[#232832] border border-border-subtle active:scale-95 px-2 py-1 rounded-lg text-xs transition-all group shrink-0"
            title="Oda kodunu kopyalamak için dokunun"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLive ? 'bg-money-pos animate-pulse' : 'bg-accent'
              }`}
            />
            <span className="font-mono font-bold text-text-main group-hover:text-accent">
              {room.code}
            </span>
            {copied ? (
              <Check className="w-3 h-3 text-money-pos" />
            ) : (
              <Copy className="w-3 h-3 text-text-muted group-hover:text-accent" />
            )}
            {copied && <span className="text-[10px] text-money-pos font-semibold">Kopyalandı</span>}
          </button>
        </div>

        {/* Right: Players Count, Banker Badge, Exit */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Player Count */}
          <div
            className="flex items-center gap-1 bg-bg-surface px-2 py-1 rounded-lg border border-border-subtle text-xs text-text-muted font-medium"
            title="Odada bulunan oyuncu sayısı"
          >
            <Users className="w-3.5 h-3.5 text-accent" />
            <span className="font-semibold text-text-main">{playerCount}</span>
          </div>

          {/* Banker Action Button */}
          {currentPlayer.is_banker && (
            <button
              onClick={onOpenBankerPanel}
              className="flex items-center gap-1 bg-accent/15 hover:bg-accent/25 border border-accent/40 text-accent px-2 py-1 rounded-lg text-xs font-bold transition-all active:scale-95"
              title="Bankacı Panelini Aç"
            >
              <Shield className="w-3 h-3 text-accent" />
              <span>Banka</span>
            </button>
          )}

          {/* Leave Button */}
          <button
            onClick={onLeaveRoom}
            className="p-1 rounded-lg hover:bg-bg-surface text-text-muted hover:text-money-neg transition-colors"
            title="Odadan Ayrıl"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
