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
  const [roomCode, setRoomCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Lütfen adınızı girin.');
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

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setError('Lütfen oda kodunu girin.');
      return;
    }
    if (!playerName.trim()) {
      setError('Lütfen adınızı girin.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onJoinRoom(roomCode.trim(), playerName.trim());
    } catch (err: any) {
      setError(err.message || 'Odaya katılınamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-bg-main">
      <div className="w-full max-w-sm">
        {/* Brand / Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-bg-card border border-accent/40 flex items-center justify-center mx-auto mb-4 text-accent shadow-lg shadow-accent/5">
            <span className="font-bold text-2xl font-mono">₺</span>
          </div>
          <h1 className="text-2xl font-extrabold text-text-main tracking-tight">
            Monopoly Para Takibi
          </h1>
          <p className="text-sm text-text-muted mt-2 font-medium">
            “Parayı saymakla uğraşma, oyuna odaklan.”
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-money-neg/10 border border-money-neg/30 flex items-start gap-2.5 text-xs text-money-neg animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* State 1: Selection */}
        {mode === 'selection' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <button
              onClick={() => {
                setMode('create');
                setError(null);
              }}
              className="btn-primary w-full py-4 text-sm font-semibold shadow-lg shadow-accent/10"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Yeni Oyun Oluştur</span>
            </button>

            <button
              onClick={() => {
                setMode('join');
                setError(null);
              }}
              className="btn-secondary w-full py-4 text-sm font-semibold"
            >
              <LogIn className="w-5 h-5 text-accent" />
              <span>Odaya Katıl</span>
            </button>

            <div className="pt-4 text-center">
              <span className="text-[11px] text-text-muted">
                Başlangıç bakiyesi tüm oyuncular için otomatik <strong>1.500 ₺</strong> olarak tanımlanır.
              </span>
            </div>
          </div>
        )}

        {/* State 2: Create Room */}
        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4 animate-in fade-in duration-200">
            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-bold text-text-main">Yeni Oyun Kur</h2>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Oyuncu Adınız
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder="Örn: Ahmet"
                  maxLength={24}
                  className="input-field"
                  autoFocus
                />
              </div>

              <div className="p-3 bg-bg-surface border border-border-subtle rounded-xl text-xs text-text-muted">
                Odayı kurduğunuzda hem oyuncu hem de oyunun <strong>Bankacısı</strong> olursunuz.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('selection');
                    setError(null);
                  }}
                  disabled={loading}
                  className="btn-secondary flex-1"
                >
                  Geri
                </button>
                <button
                  type="submit"
                  disabled={loading || !playerName.trim()}
                  className="btn-primary flex-1"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Başlat</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* State 3: Join Room */}
        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4 animate-in fade-in duration-200">
            <div className="card p-5 space-y-4">
              <h2 className="text-sm font-bold text-text-main">Mevcut Odaya Katıl</h2>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Oda Kodu
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Örn: IST-4821"
                  maxLength={12}
                  className="input-field font-mono font-bold tracking-wider uppercase text-base"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Oyuncu Adınız
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder="Örn: Mehmet"
                  maxLength={24}
                  className="input-field"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('selection');
                    setError(null);
                  }}
                  disabled={loading}
                  className="btn-secondary flex-1"
                >
                  Geri
                </button>
                <button
                  type="submit"
                  disabled={loading || !roomCode.trim() || !playerName.trim()}
                  className="btn-primary flex-1"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Katıl</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
