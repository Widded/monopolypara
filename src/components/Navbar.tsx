import React, { useState } from 'react';
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
    <header className="shrink-0 z-30 bg-bg-main border-b border-border-subtle/80 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Sol: Monopoly Başlığı + Oda Kodu + Bağlantı Noktası */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-extrabold text-[16px] tracking-tight text-text-main shrink-0 select-none">
            Monopoly
          </span>

          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main transition-colors group cursor-pointer select-none"
            title="Oda kodunu kopyala"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                isLive ? 'bg-money-pos shadow-[0_0_6px_rgba(57,217,138,0.4)]' : 'bg-text-subtle'
              }`}
            />
            <span className="font-mono text-[11px] font-semibold text-text-muted group-hover:text-text-main tracking-wide">
              {room.code}
            </span>
            {copied && (
              <span className="text-[10px] text-money-pos font-medium">Kopyalandı</span>
            )}
          </button>
        </div>

        {/* Sağ: Bankacı Paneli (varsa) ve Çıkış Butonu */}
        <div className="flex items-center gap-2.5 shrink-0">
          {currentPlayer?.is_banker && (
            <button
              type="button"
              onClick={onOpenBankerPanel}
              className="text-[11px] font-medium text-[#8EA3D0] hover:text-[#B4C6EE] transition-colors px-1 py-0.5"
            >
              Banka Paneli
            </button>
          )}

          <button
            type="button"
            onClick={onLeaveRoom}
            className="text-xs text-text-subtle hover:text-money-neg transition-colors py-0.5 px-1 font-medium"
            title="Odadan Ayrıl"
          >
            Çıkış
          </button>
        </div>
      </div>
    </header>
  );
};
