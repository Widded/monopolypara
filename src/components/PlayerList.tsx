import React from 'react';
import { Player } from '../types';
import { PlayerCard } from './PlayerCard';

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
  // Kullanıcının kendisi (Sen) daima en üstte, diğerleri alfabetik
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.id === currentPlayer.id) return -1;
    if (b.id === currentPlayer.id) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-1">
      {/* Liste Başlığı */}
      <div className="flex items-center justify-between px-1 pt-1 pb-0.5 text-xs">
        <span className="font-semibold text-text-subtle text-[11px] uppercase tracking-wider">
          Oyuncular ({players.length})
        </span>
      </div>

      {/* Doğal Liste Düzeni */}
      <div className="divide-y divide-border-subtle/50 border-t border-b border-border-subtle/60">
        {sortedPlayers.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            isCurrentPlayer={player.id === currentPlayer.id}
            onSendMoney={onSendMoney}
            onSelectPlayer={onSelectPlayer}
          />
        ))}
      </div>

      {/* Odada tek kişi varsa sade davet uyarısı */}
      {players.length === 1 && (
        <div className="text-center py-6 px-4 text-xs text-text-muted">
          <p className="mb-2.5">Arkadaşlarının katılması için oda kodunu paylaş.</p>
          <button
            type="button"
            onClick={onCopyRoomCode}
            className="btn-secondary text-xs py-1.5 px-3 mx-auto"
          >
            Oda Kodunu Kopyala
          </button>
        </div>
      )}
    </div>
  );
};
