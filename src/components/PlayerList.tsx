import React from 'react';
import { Player } from '../types';
import { PlayerCard } from './PlayerCard';
import { UserPlus } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  currentPlayer: Player;
  onSendMoney: (player: Player) => void;
  onSelectPlayer: (player: Player) => void;
  onCopyRoomCode: () => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  currentPlayer,
  onSendMoney,
  onSelectPlayer,
  onCopyRoomCode,
}) => {
  // Sort so current player is always at the top, followed by others
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.id === currentPlayer.id) return -1;
    if (b.id === currentPlayer.id) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-3">
      {sortedPlayers.map(player => (
        <PlayerCard
          key={player.id}
          player={player}
          isCurrentPlayer={player.id === currentPlayer.id}
          onSendMoney={onSendMoney}
          onSelectPlayer={onSelectPlayer}
        />
      ))}

      {/* If only 1 player is in the room, show an inviting share hint */}
      {players.length === 1 && (
        <div className="bg-bg-card/40 border border-dashed border-border-subtle rounded-2xl p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center mx-auto mb-3 text-accent">
            <UserPlus className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-text-main mb-1">
            Diğer Oyuncuları Bekleyin
          </h4>
          <p className="text-xs text-text-muted max-w-xs mx-auto mb-4">
            Arkadaşlarınızın bu odaya katılabilmesi için oda kodunu onlarla paylaşın.
          </p>
          <button
            onClick={onCopyRoomCode}
            className="btn-secondary text-xs py-2.5 px-4 mx-auto"
          >
            Oda Kodunu Kopyala
          </button>
        </div>
      )}
    </div>
  );
};
