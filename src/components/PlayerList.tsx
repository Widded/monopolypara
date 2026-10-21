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
  // Masada aktif olan oyuncular
  const activePlayers = players.filter(p => p.is_online !== false);

  // Masadan çıkış yapmış olanlar
  const offlinePlayers = players.filter(p => p.is_online === false && p.id !== currentPlayer?.id);

  // Kullanıcının kendisi (Ben / Sen)
  const me = activePlayers.find(p => p.id === currentPlayer?.id) || currentPlayer;

  // Diğer aktif oyuncular (Alfabetik)
  const otherPlayers = activePlayers
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

      {/* 3. DİĞER AKTİF OYUNCULAR */}
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

      {/* 4. MASADAN AYRILAN OYUNCULAR (PIN İLE GERİ DÖNEBİLİRLER) */}
      {offlinePlayers.length > 0 && (
        <div className="pt-3 border-t border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="text-[10px] font-bold text-text-subtle uppercase tracking-wider">
              Masadan Ayrılanlar ({offlinePlayers.length})
            </span>
            <span className="text-[10px] text-text-subtle">
              PIN ile geri dönebilirler
            </span>
          </div>

          <div className="space-y-1.5">
            {offlinePlayers.map(p => (
              <div
                key={p.id}
                onClick={() => onSelectPlayer(p)}
                className="p-2.5 rounded-xl bg-bg-surface/50 border border-white/[0.05] hover:border-white/[0.12] flex items-center justify-between text-xs cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-muted group-hover:text-white transition-colors">
                    {p.name}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-text-subtle">
                    Ayrıldı
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-[10px] text-text-subtle">PIN:</span>
                  <span className="font-bold text-accent tracking-wider bg-bg-card border border-white/[0.08] px-2 py-0.5 rounded-md">
                    {p.recovery_pin || '----'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


