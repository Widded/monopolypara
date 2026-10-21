import React from 'react';
import { Users, UserPlus, User } from 'lucide-react';
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
  // Kullanıcının kendisi (Ben / Sen)
  const me = players.find(p => p.id === currentPlayer?.id) || currentPlayer;

  // Diğer oyuncular (Alfabetik)
  const otherPlayers = players
    .filter(p => p.id !== currentPlayer?.id)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  return (
    <div className="space-y-3 pt-0.5">
      {/* 1. KULLANICININ KENDİSİ (BEN) */}
      {me && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
              <User className="w-3 h-3 text-emerald-400" />
              <span>Senin Durumun</span>
            </div>
            <span className="text-[10px] text-text-subtle font-medium">
              Detay için dokun
            </span>
          </div>

          <PlayerCard
            key={me.id}
            player={me}
            isCurrentPlayer={true}
            onSendMoney={onSendMoney}
            onSelectPlayer={onSelectPlayer}
          />
        </div>
      )}

      {/* 2. İNCE AYIRICI ÇİZGİ */}
      <div className="relative py-1">
        <div className="border-b border-white/[0.08]" />
      </div>

      {/* 3. DİĞER OYUNCULAR */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-1.5 text-text-subtle font-bold text-[10px] uppercase tracking-wider">
            <Users className="w-3 h-3 text-text-muted" />
            <span>Diğer Oyuncular ({otherPlayers.length})</span>
          </div>
          {otherPlayers.length > 0 && (
            <span className="text-[10px] text-text-subtle font-medium">
              Para göndermek için Gönder'e dokun
            </span>
          )}
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
          /* Masada henüz başka oyuncu yoksa şık davet kartı */
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121624] to-[#0E111B] border border-white/[0.08] text-center shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-2 text-accent">
              <UserPlus className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white mb-1">Masada henüz başka oyuncu yok</h4>
            <p className="text-[11px] text-text-muted mb-3 max-w-xs mx-auto">
              Arkadaşların oda kodunu girerek masaya anında katılabilir.
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
    </div>
  );
};


