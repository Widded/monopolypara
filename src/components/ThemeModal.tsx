import React from 'react';
import { X, Check, Palette, Sparkles, Crown, Moon, Zap } from 'lucide-react';
import { ThemeId, ThemeOption } from '../types';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
}

export const THEME_OPTIONS: (ThemeOption & { icon: React.FC<{ className?: string }> })[] = [
  {
    id: 'fintech',
    name: 'Fintech Minimal',
    tagline: 'Apple & Revolut sadeliği. Neon zümrüt yeşili ve koyu mat siyah.',
    accentColor: '#10B981',
    cardBg: '#11141B',
    previewBg: '#0B0E14',
    icon: Sparkles,
  },
  {
    id: 'royal',
    name: 'Monopoly Royal',
    tagline: 'Klasik Monopoly asaleti. Şampanya altını detaylar ve koyu zemin.',
    accentColor: '#D4AF37',
    cardBg: '#11141B',
    previewBg: '#0B0E14',
    icon: Crown,
  },
  {
    id: 'midnight',
    name: 'Midnight Titanium',
    tagline: 'Tamamen mat titanyum & monokrom. Sıfır parlama, stealth stil.',
    accentColor: '#E2E8F0',
    cardBg: '#11141B',
    previewBg: '#0B0E14',
    icon: Moon,
  },
  {
    id: 'cyber',
    name: 'Cyber Glow',
    tagline: 'Canlı siber neon cyan parlaklık ve koyu zemin.',
    accentColor: '#00F0FF',
    cardBg: '#11141B',
    previewBg: '#0B0E14',
    icon: Zap,
  },
];

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-100 overflow-y-auto">
      <div className="bg-[#0E1218] border border-white/[0.08] w-full max-w-sm rounded-3xl p-5 shadow-2xl shadow-black/90 max-h-[92dvh] overflow-y-auto my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center shadow-sm">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Renk Teması</h3>
              <p className="text-[11px] text-neutral-400">Arayüzün görünümünü kişiselleştirin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme List */}
        <div className="space-y-2 mb-3">
          {THEME_OPTIONS.map(opt => {
            const isSelected = currentTheme === opt.id;
            const Icon = opt.icon;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onSelectTheme(opt.id);
                }}
                className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] ${
                  isSelected
                    ? 'border-accent bg-accent/15 shadow-md ring-1 ring-accent/30'
                    : 'border-white/[0.06] bg-[#141822]/80 hover:bg-[#141822] hover:border-white/[0.14]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Theme Preview Dot / Mini Swatch */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-inner transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: '#11141B',
                      borderColor: isSelected ? opt.accentColor : 'rgba(255,255,255,0.1)',
                      color: opt.accentColor,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white">
                        {opt.name}
                      </span>
                      {opt.id === 'fintech' && (
                        <span className="text-[9px] px-2 py-0.2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold">
                          Varsayılan
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-tight mt-0.5 truncate">
                      {opt.tagline}
                    </p>
                  </div>
                </div>

                {/* Selection indicator */}
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'border-accent bg-accent text-black font-bold'
                      : 'border-white/20 bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3.5]" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-2.5 border-t border-white/[0.08] text-center">
          <p className="text-[11px] text-neutral-400">
            Seçtiğiniz tema anında uygulanır ve tarayıcınıza kaydedilir.
          </p>
        </div>
      </div>
    </div>
  );
};
