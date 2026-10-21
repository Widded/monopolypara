import React from 'react';
import { Player } from '../types';
import { PlayerCard } from './PlayerCard';
import { MyWalletCard } from './MyWalletCard';
import { UserPlus, Users } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  currentPlayer: Player;
  onSendMoney: (player: Player) => void;
  onSelectPlayer: (player: Player) => void;
  onCopyRoomCode: () => void;
  onOpenTransfer: () => void;
  onOpenLendDebt: () => void;
  onOpenPayDebt: () => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  currentPlayer,
  onSendMoney,
  onSelectPlayer,
  onCopyRoomCode,
  onOpenTransfer,
  onOpenLendDebt,
  onOpenPayDebt,
}) => {
  // Sadece diğer oyuncuları listele, mevcut oyuncu (SEN) en üstteki cüzdan kartında özel olarak görünür
  const otherPlayers = players
    .filter(p => p.id !== currentPlayer.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-3">
      {/* 1. BÖLÜM: KULLANICININ KENDİ CÜZDANI (SEN) */}
      <div>
        <MyWalletCard
          player={currentPlayer}
          onOpenTransfer={onOpenTransfer}
          onOpenLendDebt={onOpenLendDebt}
          onOpenPayDebt={onOpenPayDebt}
          onSelectSelf={() => onSelectPlayer(currentPlayer)}
        />
      </div>

      {/* 2. BÖLÜM: DİĞER OYUNCULAR LİSTESİ */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Diğer Oyuncular ({otherPlayers.length})
          </span>
        </div>

        {otherPlayers.length > 0 ? (
          <div className="space-y-2">
            {otherPlayers.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                isCurrentPlayer={false}
                onSendMoney={onSendMoney}
                onSelectPlayer={onSelectPlayer}
              />
            ))}
          </div>
        ) : (
          /* Odada sadece 1 kişi varsa */
          <div className="bg-bg-card/40 border border-dashed border-border-subtle rounded-xl p-4 text-center mt-2">
            <div className="w-8 h-8 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center mx-auto mb-2 text-accent">
              <UserPlus className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-text-main mb-1">
              Diğer Oyuncuları Bekleyin
            </h4>
            <p className="text-[11px] text-text-muted max-w-xs mx-auto mb-3">
              Arkadaşlarınızın bu odaya katılabilmesi için oda kodunu onlarla paylaşın.
            </p>
            <button
              onClick={onCopyRoomCode}
              className="btn-secondary text-xs py-2 px-3 mx-auto"
            >
              Oda Kodunu Kopyala
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
