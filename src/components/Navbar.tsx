import React, { useState } from 'react';
import { Copy, Check, Users, Shield, LogOut, Radio } from 'lucide-react';
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
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-bg-main/90 backdrop-blur-md border-b border-border-subtle px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: App Title & Room Code */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-text-main">
              Monopoly İstanbul
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                isLive
                  ? 'bg-money-pos/15 text-money-pos border border-money-pos/30'
                  : 'bg-accent/15 text-accent border border-accent/30'
              }`}
              title={isLive ? 'Supabase Realtime Bağlı' : 'Yerel Senkronizasyon (Multi-Tab)'}
            >
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              {isLive ? 'Canlı' : 'Yerel'}
            </span>
          </div>
          
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors mt-0.5 group w-fit"
            title="Oda kodunu kopyala"
          >
            <span>Oda:</span>
            <span className="font-mono font-bold text-text-main group-hover:text-accent">
              {room.code}
            </span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-money-pos" />
            ) : (
              <Copy className="w-3 h-3 text-text-muted group-hover:text-accent" />
            )}
            {copied && <span className="text-[10px] text-money-pos font-medium">Kopyalandı!</span>}
          </button>
        </div>

        {/* Right: Actions & Badges */}
        <div className="flex items-center gap-2">
          {/* Player Count Badge */}
          <div className="flex items-center gap-1 bg-bg-surface px-2.5 py-1.5 rounded-lg border border-border-subtle text-xs text-text-muted font-medium">
            <Users className="w-3.5 h-3.5 text-accent" />
            <span>{playerCount}</span>
          </div>

          {/* Banker Action Button if Current Player is Banker */}
          {currentPlayer.is_banker && (
            <button
              onClick={onOpenBankerPanel}
              className="flex items-center gap-1.5 bg-accent/15 hover:bg-accent/25 border border-accent/40 text-accent px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
              title="Bankacı Panelini Aç"
            >
              <Shield className="w-3.5 h-3.5 text-accent" />
              <span className="hidden xs:inline">Bankacı</span>
            </button>
          )}

          {/* Leave / Switch Player Button */}
          <button
            onClick={onLeaveRoom}
            className="p-1.5 rounded-lg hover:bg-bg-surface text-text-muted hover:text-money-neg transition-colors"
            title="Odadan Ayrıl"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
