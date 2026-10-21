import React, { useState } from 'react';
import { Check, Copy, Shield, LogOut } from 'lucide-react';
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
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <header className="shrink-0 z-30 bg-bg-main border-b border-border-subtle px-4 pt-[calc(0.6rem+env(safe-area-inset-top))] pb-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand + Room Code */}
        <div className="flex items-baseline gap-2.5 min-w-0">
          <h1 className="font-extrabold text-[15px] tracking-tight text-text-main shrink-0">
            Monopoly
          </h1>

          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main transition-colors group cursor-pointer"
            title="Oda kodunu kopyala"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isLive ? 'bg-money-pos' : 'bg-text-subtle'
              }`}
            />
            <span className="font-mono text-[11px] font-semibold text-text-muted group-hover:text-text-main">
              {room.code}
            </span>
            {copied ? (
              <span className="text-[10px] text-money-pos font-medium">Kopyalandı</span>
            ) : (
              <Copy className="w-3 h-3 text-text-subtle group-hover:text-text-muted opacity-60" />
            )}
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {currentPlayer.is_banker && (
            <button
              type="button"
              onClick={onOpenBankerPanel}
              className="flex items-center gap-1 text-[11px] font-medium text-[#8EA3D0] hover:text-[#A8BDE5] bg-[#121620] border border-[#20283A] px-2 py-1 rounded transition-colors"
            >
              <Shield className="w-3 h-3" />
              <span>Banka</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLeaveRoom}
            className="text-[11px] text-text-subtle hover:text-money-neg px-1.5 py-1 transition-colors"
            title="Odadan Ayrıl"
          >
            Çıkış
          </button>
        </div>
      </div>
    </header>
  );
};
