import React from 'react';
import { Users, UserPlus } from 'lucide-react';
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
    <div className="space-y-2 pt-1">
      {/* Liste Başlığı */}
      <div className="flex items-center justify-between px-1 text-xs">
        <div className="flex items-center gap-1.5 text-text-subtle font-bold text-[11px] uppercase tracking-wider">
          <Users className="w-3.5 h-3.5 text-text-muted" />
          <span>Masadaki Oyuncular ({players.length})</span>
        </div>
        <span className="text-[10px] text-text-subtle font-medium">
          Detay için dokun
        </span>
      </div>

      {/* Oyuncu Satırları */}
      <div className="space-y-2">
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

      {/* Odada tek kişi varsa şık bir davet kartı */}
      {players.length === 1 && (
        <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-[#121624] to-[#0E111B] border border-white/[0.08] text-center shadow-lg">
          <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-2 text-accent">
            <UserPlus className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-white mb-1">Masada henüz kimse yok</h4>
          <p className="text-[11px] text-text-muted mb-3 max-w-xs mx-auto">
            Arkadaşların oda kodunu girerek veya bağlantıyı kullanarak masaya anında katılabilir.
          </p>
          <button
            type="button"
            onClick={onCopyRoomCode}
            className="btn-primary text-xs py-2 px-4 mx-auto font-bold"
          >
            Oda Kodunu Kopyala
          </button>
        </div>
      )}
    </div>
  );
};


