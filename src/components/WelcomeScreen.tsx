import React, { useState } from 'react';
import { PlusCircle, LogIn, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';

interface WelcomeScreenProps {
  onCreateRoom: (playerName: string) => Promise<void>;
  onJoinRoom: (roomCode: string, playerName: string) => Promise<void>;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
}) => {
  const [mode, setMode] = useState<'selection' | 'create' | 'join'>('selection');
  const [playerName, setPlayerName] = useState<string>('');
  const [roomDigits, setRoomDigits] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const quickNames = ['Ahmet', 'Mehmet', 'Ali', 'Ayşe', 'Zeynep', 'Can', 'Emre', 'Elif'];

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!playerName.trim()) {
      setError('Lütfen bir ad girin veya seçin.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onCreateRoom(playerName.trim());
    } catch (err: any) {
      setError(err.message || 'Oda oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanDigits = roomDigits.replace(/\D/g, '');
    if (!cleanDigits) {
      setError('Lütfen oda kodunu girin.');
      return;
    }
    if (!playerName.trim()) {
      setError('Lütfen adınızı girin.');
      return;
    }
    const fullRoomCode = `WID-${cleanDigits}`;
    setLoading(true);
    setError(null);
    try {
      await onJoinRoom(fullRoomCode, playerName.trim());
    } catch (err: any) {
      setError(err.message || 'Odaya katılınamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-3.5 bg-bg-main overflow-y-auto">
      <div className="w-full max-w-sm my-auto">
        {/* Brand / Logo */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-bg-card border border-accent/40 flex items-center justify-center mx-auto mb-2.5 text-accent shadow-lg shadow-accent/5">
            <span className="font-bold text-xl font-mono">₺</span>
          </div>
          <h1 className="text-xl font-extrabold text-text-main tracking-tight">
            Monopoly Para Takibi
          </h1>
          <p className="text-xs text-text-muted mt-1 font-medium">
            “Parayı saymakla uğraşma, oyuna odaklan.”
          </p>
        </div>

        {error && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-money-neg/10 border border-money-neg/30 flex items-center gap-2 text-xs text-money-neg animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {/* State 1: Selection */}
        {mode === 'selection' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <button
              onClick={() => {
                setMode('create');
                setError(null);
              }}
              className="btn-primary w-full py-3.5 text-sm font-semibold shadow-lg shadow-accent/10"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Yeni Oyun Oluştur</span>
            </button>

            <button
              onClick={() => {
                setMode('join');
                setError(null);
              }}
              className="btn-secondary w-full py-3.5 text-sm font-semibold"
            >
              <LogIn className="w-4 h-4 text-accent" />
              <span>Odaya Katıl</span>
            </button>

            <div className="pt-3 text-center">
              <span className="text-[11px] text-text-muted">
                Başlangıç bakiyesi tüm oyuncular için otomatik <strong>1.500 ₺</strong> tanımlanır.
              </span>
            </div>
          </div>
        )}

        {/* State 2: Create Room */}
        {mode === 'create' && (
          <form onSubmit={handleCreate} className="card p-4 space-y-3.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-text-main uppercase tracking-wider">
                Yeni Oyun Kur
              </h2>
              <button
                type="button"
                onClick={() => setMode('selection')}
                className="text-xs text-text-muted hover:text-text-main"
              >
                Geri
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                Oyuncu Adınız
              </label>
              <input
                type="text"
                value={playerName}
                onChange={e => {
                  setPlayerName(e.target.value);
                  setError(null);
                }}
                placeholder="Örn: Ahmet"
                maxLength={24}
                className="input-field text-base py-2.5 font-medium"
                autoFocus
              />
            </div>

            {/* Quick Name Chips */}
            <div>
              <div className="text-[10px] text-text-muted uppercase font-semibold mb-1">
                Hızlı İsimler
              </div>
              <div className="flex flex-wrap gap-1">
                {quickNames.map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setPlayerName(name);
                      setError(null);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      playerName === name
                        ? 'bg-accent/20 border-accent text-accent font-semibold'
                        : 'bg-bg-surface border-border-subtle text-text-muted hover:text-text-main'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !playerName.trim()}
              className="btn-primary w-full py-3 text-xs font-bold mt-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <div className="flex items-center justify-center gap-1.5">
                  <span>Oyunu Başlat (1.500 ₺)</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </button>
          </form>
        )}

        {/* State 3: Join Room */}
        {mode === 'join' && (
          <form onSubmit={handleJoin} className="card p-4 space-y-3.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-text-main uppercase tracking-wider">
                Odaya Katıl
              </h2>
              <button
                type="button"
                onClick={() => setMode('selection')}
                className="text-xs text-text-muted hover:text-text-main"
              >
                Geri
              </button>
            </div>

            {/* Room Code Input with fixed WID- prefix and native numeric keyboard */}
            <div>
              <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                Oda Kodu (Yalnızca Rakam)
              </label>
              <div className="flex items-center rounded-xl bg-bg-surface border border-border-subtle focus-within:border-accent focus-within:ring-1 focus-within:ring-accent overflow-hidden transition-all">
                {/* Fixed, unchangeable prefix */}
                <span className="bg-[#151921] border-r border-border-subtle px-3 py-2.5 font-mono font-bold text-accent text-sm select-none tracking-wider shrink-0">
                  WID-
                </span>
                {/* Numeric input triggering native mobile numeric keyboard */}
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={roomDigits}
                  onChange={e => {
                    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 5);
                    setRoomDigits(digitsOnly);
                    setError(null);
                  }}
                  placeholder="12345"
                  maxLength={5}
                  className="w-full bg-transparent px-3 py-2.5 text-base font-mono font-bold text-text-main placeholder-text-muted/50 outline-none tracking-widest"
                  autoFocus
                />
              </div>
            </div>

            {/* Player Name */}
            <div>
              <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                Oyuncu Adınız
              </label>
              <input
                type="text"
                value={playerName}
                onChange={e => {
                  setPlayerName(e.target.value);
                  setError(null);
                }}
                placeholder="Örn: Mehmet"
                maxLength={24}
                className="input-field text-base py-2.5 font-medium"
              />
            </div>

            {/* Quick Name Chips */}
            <div>
              <div className="text-[10px] text-text-muted uppercase font-semibold mb-1">
                Hızlı İsimler
              </div>
              <div className="flex flex-wrap gap-1">
                {quickNames.map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setPlayerName(name);
                      setError(null);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      playerName === name
                        ? 'bg-accent/20 border-accent text-accent font-semibold'
                        : 'bg-bg-surface border-border-subtle text-text-muted hover:text-text-main'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !roomDigits.trim() || !playerName.trim()}
              className="btn-primary w-full py-3 text-xs font-bold mt-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <div className="flex items-center justify-center gap-1.5">
                  <span>Odaya Katıl</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
