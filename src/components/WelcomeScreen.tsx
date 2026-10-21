import React, { useState } from 'react';
import { PlusCircle, LogIn, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { TextKeyboard } from './TextKeyboard';

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
  const [activeJoinField, setActiveJoinField] = useState<'code' | 'name'>('code');
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
    <div className="min-h-screen flex flex-col items-center justify-center p-3 bg-bg-main select-none">
      <div className="w-full max-w-sm">
        {/* Brand / Logo */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-bg-card border border-accent/40 flex items-center justify-center mx-auto mb-2 text-accent shadow-lg shadow-accent/5">
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
          <div className="mb-3 p-2.5 rounded-xl bg-money-neg/10 border border-money-neg/30 flex items-center gap-2 text-xs text-money-neg animate-in fade-in">
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

            <div className="pt-3 text-center">
              <span className="text-[11px] text-text-muted">
                Başlangıç bakiyesi tüm oyuncular için otomatik <strong>1.500 ₺</strong> olarak tanımlanır.
              </span>
            </div>
          </div>
        )}

        {/* State 2: Create Room */}
        {mode === 'create' && (
          <div className="card p-4 space-y-3 animate-in fade-in duration-150">
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

            {/* Display Player Name Field (No native keyboard!) */}
            <div className="bg-bg-surface border border-accent/40 rounded-xl p-2.5 flex items-center justify-between">
              <span className="text-xs text-text-muted">Oyuncu Adı:</span>
              <span className="font-bold text-base text-accent">
                {playerName || <span className="text-text-muted/50 font-normal">Seçin / Yazın...</span>}
              </span>
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
                        ? 'bg-accent/20 border-accent text-accent'
                        : 'bg-bg-surface border-border-subtle text-text-muted hover:text-text-main'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* On-Screen Keyboard */}
            <TextKeyboard
              value={playerName}
              onChange={val => {
                setPlayerName(val);
                setError(null);
              }}
            />

            <button
              type="button"
              onClick={() => handleCreate()}
              disabled={loading || !playerName.trim()}
              className="btn-primary w-full py-3 text-xs font-bold"
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
          </div>
        )}

        {/* State 3: Join Room */}
        {mode === 'join' && (
          <div className="card p-4 space-y-3 animate-in fade-in duration-150">
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

            {/* Two selectable displays: Code and Name */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveJoinField('code')}
                className={`p-2 rounded-xl border text-left transition-all ${
                  activeJoinField === 'code'
                    ? 'border-accent bg-accent/15 ring-1 ring-accent'
                    : 'border-border-subtle bg-bg-surface'
                }`}
              >
                <div className="text-[10px] text-text-muted font-medium">Oda Kodu</div>
                <div className="font-mono font-bold text-xs text-text-main truncate">
                  {roomCode || 'GİRİN...'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveJoinField('name')}
                className={`p-2 rounded-xl border text-left transition-all ${
                  activeJoinField === 'name'
                    ? 'border-accent bg-accent/15 ring-1 ring-accent'
                    : 'border-border-subtle bg-bg-surface'
                }`}
              >
                <div className="text-[10px] text-text-muted font-medium">Adınız</div>
                <div className="font-bold text-xs text-text-main truncate">
                  {playerName || 'GİRİN...'}
                </div>
              </button>
            </div>

            {/* Quick Name Chips if name is active */}
            {activeJoinField === 'name' && (
              <div className="flex flex-wrap gap-1">
                {quickNames.map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setPlayerName(name);
                      setError(null);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                      playerName === name
                        ? 'bg-accent/20 border-accent text-accent'
                        : 'bg-bg-surface border-border-subtle text-text-muted'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}

            {/* On-Screen Keyboard routing to active field */}
            <TextKeyboard
              value={activeJoinField === 'code' ? roomCode : playerName}
              onChange={val => {
                if (activeJoinField === 'code') {
                  setRoomCode(val.toUpperCase());
                } else {
                  setPlayerName(val);
                }
                setError(null);
              }}
            />

            <button
              type="button"
              onClick={() => handleJoin()}
              disabled={loading || !roomCode.trim() || !playerName.trim()}
              className="btn-primary w-full py-3 text-xs font-bold"
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
          </div>
        )}
      </div>
    </div>
  );
};
