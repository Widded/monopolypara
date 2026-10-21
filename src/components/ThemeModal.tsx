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
    tagline: 'Apple & Revolut sadeliği. Göz yormayan, mat ve sakin.',
    accentColor: '#10B981',
    cardBg: '#11141B',
    previewBg: '#090B0E',
    icon: Sparkles,
  },
  {
    id: 'royal',
    name: 'Monopoly Royal',
    tagline: 'Klasik Monopoly zümrütü ve şampanya altın detaylar.',
    accentColor: '#D4AF37',
    cardBg: '#0B1712',
    previewBg: '#060D0A',
    icon: Crown,
  },
  {
    id: 'midnight',
    name: 'Midnight Titanium',
    tagline: 'Tamamen mat grafit & titanyum. Sıfır parlama, stealth stil.',
    accentColor: '#E2E8F0',
    cardBg: '#0C0D11',
    previewBg: '#050507',
    icon: Moon,
  },
  {
    id: 'cyber',
    name: 'Cyber Glow',
    tagline: 'Canlı neon arcade ve siber parlaklık sevenler için.',
    accentColor: '#00F0FF',
    cardBg: '#0C1222',
    previewBg: '#060913',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100 overflow-y-auto">
      <div className="bg-bg-card border border-border-subtle w-full max-w-sm rounded-2xl p-4 shadow-2xl max-h-[92dvh] overflow-y-auto my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
              <Palette className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text-main">Renk Teması</h3>
              <p className="text-[10px] text-text-muted">Arayüzün görünümünü kişiselleştirin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-main p-1 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme List */}
        <div className="space-y-2 mb-2">
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
                className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99] ${
                  isSelected
                    ? 'border-accent bg-accent/15 shadow-md ring-1 ring-accent/30'
                    : 'border-border-subtle bg-bg-surface/50 hover:bg-bg-surface hover:border-border-active'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Theme Preview Dot / Mini Swatch */}
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-inner transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: opt.cardBg,
                      borderColor: isSelected ? opt.accentColor : 'rgba(255,255,255,0.1)',
                      color: opt.accentColor,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-text-main">
                        {opt.name}
                      </span>
                      {opt.id === 'fintech' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-white/[0.08] text-text-muted font-medium">
                          Önerilen
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-text-muted leading-tight mt-0.5 truncate">
                      {opt.tagline}
                    </p>
                  </div>
                </div>

                {/* Selection indicator */}
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'border-accent bg-accent text-bg-main'
                      : 'border-white/20 bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3.5]" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-2 border-t border-border-subtle text-center">
          <p className="text-[10px] text-text-subtle">
            Seçtiğiniz tema otomatik olarak tarayıcınıza kaydedilir.
          </p>
        </div>
      </div>
    </div>
  );
};
