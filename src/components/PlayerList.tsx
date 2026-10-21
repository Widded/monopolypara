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
    if (a.id === currentPlayer?.id) return -1;
    if (b.id === currentPlayer?.id) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <div className="pt-1 space-y-2">
      {/* Liste Başlığı */}
      <div className="flex items-center justify-between px-1 text-xs">
        <span className="font-semibold text-text-subtle text-[11px] uppercase tracking-wider">
          Oyuncular ({players.length})
        </span>
        <span className="text-[10px] text-text-subtle">
          Detay için dokun
        </span>
      </div>

      {/* Oyuncu Satırları */}
      <div className="space-y-1.5">
        {sortedPlayers.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            isCurrentPlayer={player.id === currentPlayer?.id}
            onSendMoney={onSendMoney}
            onSelectPlayer={onSelectPlayer}
          />
        ))}
      </div>

      {/* Odada tek kişi varsa sade davet uyarısı */}
      {players.length === 1 && (
        <div className="mt-3 p-3.5 rounded-xl bg-bg-surface/30 border border-border-subtle/50 text-center">
          <p className="text-xs text-text-muted mb-2">
            Masada henüz başka oyuncu yok. Arkadaşlarını davet etmek için oda kodunu paylaşabilirsin.
          </p>
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

