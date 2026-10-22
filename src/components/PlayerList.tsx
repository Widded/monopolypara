import React from 'react';
import { UserPlus, Skull } from 'lucide-react';
import { Player, Transaction } from '../types';
import { PlayerCard } from './PlayerCard';
import { HeroPlayerCard } from './HeroPlayerCard';
import { SummaryCard } from './SummaryCard';

interface PlayerListProps {
  players: Player[];
  currentPlayer: Player;
  totalCash?: number;
  lastTransaction?: Transaction;
  onOpenHistory?: () => void;
  onSendMoney: (player?: Player | null) => void;
  onSelectPlayer: (player: Player) => void;
  onCopyRoomCode: () => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  currentPlayer,
  totalCash,
  lastTransaction,
  onOpenHistory,
  onSendMoney,
  onSelectPlayer,
  onCopyRoomCode,
}) => {
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

  // Diğer aktif oyuncular (Bakiye sıralı)
  const otherPlayers = activePlayers
    .filter(p => p.id !== currentPlayer?.id)
    .sort((a, b) => b.balance - a.balance);

  return (
    <div className="space-y-3 pt-1">
      {/* 1. KULLANICININ KENDİSİ: ULTRA-SADE HERO KARTI */}
      {me && (
        <HeroPlayerCard
          player={me}
          onSelectPlayer={onSelectPlayer}
        />
      )}

      {/* SESSİZ MASA AKIŞI TICKER */}
      {totalCash !== undefined && (
        <SummaryCard
          playerCount={activePlayers.length}
          totalCash={totalCash}
          lastTransaction={lastTransaction}
          onOpenHistory={onOpenHistory || (() => {})}
        />
      )}

      {/* 2. DİĞER OYUNCULAR LİSTESİ */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-neutral-400 select-none">
            Oyuncular ({otherPlayers.length})
          </span>
        </div>

        {otherPlayers.length > 0 ? (
          <div className="space-y-1.5">
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
          /* Masada henüz başka oyuncu yoksa sade davet kartı */
          <div className="p-4 rounded-2xl bg-[#0E1218] border border-white/[0.06] text-center shadow-lg">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2 text-emerald-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white mb-0.5">Masada başka oyuncu yok</h4>
            <p className="text-[11px] text-neutral-400 mb-2.5">
              Oda kodunu paylaşarak arkadaşlarını davet et.
            </p>
            <button
              type="button"
              onClick={onCopyRoomCode}
              className="btn-primary text-xs py-2 px-4 mx-auto font-bold cursor-pointer"
            >
              Kodu Kopyala
            </button>
          </div>
        )}
      </div>

      {/* 3. MASADAN AYRILAN VEYA İFLAS EDENLER (EN ALTA, SESSİZCE) */}
      {(offlinePlayers.length > 0 || bankruptPlayers.length > 0) && (
        <div className="pt-2 border-t border-white/[0.04] space-y-1.5 text-xs">
          {offlinePlayers.map(p => (
            <div
              key={p.id}
              onClick={() => onSelectPlayer(p)}
              className="p-2 rounded-xl bg-[#0E1218]/50 border border-white/[0.04] flex items-center justify-between text-neutral-400 hover:text-white cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-300 font-medium">{p.name}</span>
                <span className="text-[9px] text-neutral-500">(Ayrıldı)</span>
              </div>
              <span className="font-mono text-[11px] text-neutral-500">
                PIN: {p.recovery_pin || '----'}
              </span>
            </div>
          ))}

          {bankruptPlayers.map(p => (
            <div
              key={p.id}
              onClick={() => onSelectPlayer(p)}
              className="p-2 rounded-xl bg-red-950/10 border border-red-500/15 flex items-center justify-between text-neutral-400 hover:text-red-300 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Skull className="w-3 h-3 text-red-400" />
                <span className="line-through text-neutral-400">{p.name}</span>
                <span className="text-[9px] text-red-400 font-bold">İFLAS</span>
              </div>
              <span className="font-mono text-[11px] text-neutral-600">0 ₺</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
