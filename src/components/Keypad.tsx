import React from 'react';
import { Delete, RotateCcw } from 'lucide-react';

interface KeypadProps {
  value: string;
  onChange: (newValue: string) => void;
  quickPresets?: number[];
  max?: number;
}

export const Keypad: React.FC<KeypadProps> = ({
  value,
  onChange,
  quickPresets = [50, 100, 200, 500],
  max,
}) => {
  const handleDigit = (digit: string) => {
    // If current value is '0', replace with digit
    if (value === '0' || value === '') {
      onChange(digit);
      return;
    }
    const next = value + digit;
    if (max !== undefined && parseFloat(next) > max) {
      onChange(max.toString());
      return;
    }
    // Limit to 7 digits (up to 9.999.999 ₺)
    if (next.length <= 7) {
      onChange(next);
    }
  };

  const handleBackspace = () => {
    if (value.length <= 1) {
      onChange('');
    } else {
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    onChange('');
  };

  const handleQuickAdd = (delta: number) => {
    const current = parseFloat(value) || 0;
    const next = current + delta;
    if (max !== undefined && next > max) {
      onChange(max.toString());
    } else {
      onChange(next.toString());
    }
  };

  return (
    <div className="space-y-1.5 select-none touch-manipulation">
      {/* Quick Add Presets Row */}
      {quickPresets && quickPresets.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5 mb-1.5">
          {quickPresets.map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => handleQuickAdd(preset)}
              className="py-2 rounded-xl bg-bg-surface hover:bg-bg-hover border border-white/[0.08] text-xs font-mono font-bold text-neutral-300 hover:text-white active:scale-95 transition-all cursor-pointer"
            >
              +{preset}
            </button>
          ))}
        </div>
      )}

      {/* 3x4 Keypad Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="py-3 rounded-xl bg-bg-surface hover:bg-bg-hover active:bg-accent/20 active:text-accent border border-white/[0.08] text-lg font-mono font-bold text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm"
          >
            {digit}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          onClick={handleClear}
          className="py-3 rounded-xl bg-bg-surface hover:bg-bg-hover active:bg-rose-500/20 active:text-rose-400 border border-white/[0.08] text-xs font-semibold text-neutral-400 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
          title="Temizle"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Sil</span>
        </button>

        {/* Zero */}
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="py-3 rounded-xl bg-bg-surface hover:bg-bg-hover active:bg-accent/20 active:text-accent border border-white/[0.08] text-lg font-mono font-bold text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm"
        >
          0
        </button>

        {/* Backspace Button */}
        <button
          type="button"
          onClick={handleBackspace}
          className="py-3 rounded-xl bg-bg-surface hover:bg-bg-hover active:bg-rose-500/20 active:text-rose-400 border border-white/[0.08] text-neutral-400 hover:text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          title="Son basamağı sil"
        >
          <Delete className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
