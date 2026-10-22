import React, { useState } from 'react';
import { ArrowUpDown, UserPlus, Skull, Users } from 'lucide-react';
import { Player } from '../types';
import { PlayerCard } from './PlayerCard';
import { HeroPlayerCard } from './HeroPlayerCard';

interface PlayerListProps {
  players: Player[];
  currentPlayer: Player;
  onSendMoney: (player?: Player | null) => void;
  onPayBank: () => void;
  onLendDebt: (debtor?: Player | null) => void;
  onSelectPlayer: (player: Player) => void;
  onCopyRoomCode: () => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  currentPlayer,
  onSendMoney,
  onPayBank,
  onLendDebt,
  onSelectPlayer,
  onCopyRoomCode,
}) => {
  const [sortBy, setSortBy] = useState<'balance' | 'name'>('balance');

  // Masada aktif ve iflas etmemiş olan oyuncular
  const activePlayers = players.filter(p => p.is_online !== false && !p.is_bankrupt);

  // Masadan çıkış yapmış olanlar (iflas etmeyenler)
  const offlinePlayers = players.filter(
    p => p.is_online === false && !p.is_bankrupt && p.id !== currentPlayer?.id
  );

  // İflas eden oyuncular
  const bankruptPlayers = players.filter(p => p.is_bankrupt === true);

  // Kullanıcının kendisi (Sen)
  const me = players.find(p => p.id === currentPlayer?.id) || currentPlayer;

  // Liderlik sıralaması (Bakiye bazlı genel masa derecesi)
  const rankedPlayers = [...activePlayers].sort((a, b) => b.balance - a.balance);
  const getRank = (playerId: string) => {
    const idx = rankedPlayers.findIndex(p => p.id === playerId);
    return idx >= 0 ? idx + 1 : undefined;
  };

  // Diğer aktif oyuncular
  const otherPlayers = activePlayers
    .filter(p => p.id !== currentPlayer?.id)
    .sort((a, b) => {
      if (sortBy === 'balance') {
        return b.balance - a.balance;
      }
      return (a.name || '').localeCompare(b.name || '');
    });

  const toggleSort = () => {
    setSortBy(prev => (prev === 'balance' ? 'name' : 'balance'));
  };

  return (
    <div className="space-y-4 pt-1">
      {/* 1. KULLANICININ KENDİSİ: APPLE HERO KARTI */}
      {me && (
        <HeroPlayerCard
          player={me}
          rank={getRank(me.id)}
          totalPlayers={activePlayers.length}
          onSendMoney={() => onSendMoney(null)}
          onPayBank={onPayBank}
          onLendDebt={() => onLendDebt(null)}
          onSelectPlayer={onSelectPlayer}
        />
      )}

      {/* 2. DİĞER OYUNCULAR BÖLÜMÜ */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-neutral-300 tracking-tight flex items-center gap-1.5 select-none">
            <Users className="w-4 h-4 text-neutral-400" />
            <span>Diğer Oyuncular</span>
            <span className="text-neutral-500 font-normal">({otherPlayers.length})</span>
          </h2>

          {otherPlayers.length > 1 && (
            <button
              type="button"
              onClick={toggleSort}
              className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer select-none active:scale-95"
              title="Sıralamayı değiştir"
            >
              <span>{sortBy === 'balance' ? 'Bakiye sıralı' : 'İsim sıralı'}</span>
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          )}
        </div>

        {otherPlayers.length > 0 ? (
          <div className="space-y-2">
            {otherPlayers.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                isCurrentPlayer={false}
                rank={getRank(player.id)}
                onSendMoney={onSendMoney}
                onSelectPlayer={onSelectPlayer}
              />
            ))}
          </div>
        ) : (
          /* Masada henüz başka oyuncu yoksa şık davet kartı */
          <div className="p-5 rounded-3xl bg-[#0E1218] border border-white/[0.08] text-center shadow-lg">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2.5 text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Masada henüz başka oyuncu yok</h4>
            <p className="text-xs text-neutral-400 mb-3.5 max-w-xs mx-auto">
              Arkadaşların oda kodunu girerek masaya anında katılabilir.
            </p>
            <button
              type="button"
              onClick={onCopyRoomCode}
              className="btn-primary text-xs py-2.5 px-5 mx-auto font-bold cursor-pointer"
            >
              Oda Kodunu Kopyala
            </button>
          </div>
        )}
      </div>

      {/* 3. MASADAN AYRILAN OYUNCULAR (PIN İLE GERİ DÖNEBİLİRLER) */}
      {offlinePlayers.length > 0 && (
        <div className="pt-3 border-t border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Masadan Ayrılanlar ({offlinePlayers.length})
            </span>
            <span className="text-[10px] text-neutral-500">
              PIN ile geri dönebilirler
            </span>
          </div>

          <div className="space-y-1.5">
            {offlinePlayers.map(p => (
              <div
                key={p.id}
                onClick={() => onSelectPlayer(p)}
                className="p-2.5 rounded-xl bg-[#0E1218]/60 border border-white/[0.05] hover:border-white/[0.12] flex items-center justify-between text-xs cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-300 group-hover:text-white transition-colors">
                    {p.name}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-neutral-400">
                    Ayrıldı
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-[10px] text-neutral-500">PIN:</span>
                  <span className="font-bold text-emerald-400 tracking-wider bg-black/40 border border-white/[0.08] px-2 py-0.5 rounded-md">
                    {p.recovery_pin || '----'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. İFLAS EDEN OYUNCULAR */}
      {bankruptPlayers.length > 0 && (
        <div className="pt-3 border-t border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <Skull className="w-3 h-3 text-red-400" />
              <span>İflas Edenler ({bankruptPlayers.length})</span>
            </span>
            <span className="text-[10px] text-neutral-500">Oyundan elendi</span>
          </div>

          <div className="space-y-1.5">
            {bankruptPlayers.map(p => (
              <div
                key={p.id}
                onClick={() => onSelectPlayer(p)}
                className="p-2.5 rounded-xl bg-red-950/20 border border-red-500/20 hover:border-red-500/40 flex items-center justify-between text-xs cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-300 line-through group-hover:text-red-300 transition-colors">
                    {p.name}
                  </span>
                  {p.id === currentPlayer?.id && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-bold">
                      Sen
                    </span>
                  )}
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                    İFLAS
                  </span>
                </div>
                <div className="text-[11px] font-mono text-neutral-500">
                  0 ₺
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
