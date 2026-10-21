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
        <div className="grid grid-cols-4 gap-1 mb-1">
          {quickPresets.map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => handleQuickAdd(preset)}
              className="py-1.5 rounded-lg bg-bg-surface hover:bg-[#252b36] border border-border-subtle text-[11px] font-money font-semibold text-text-muted hover:text-text-main active:scale-95 transition-all"
            >
              +{preset}
            </button>
          ))}
        </div>
      )}

      {/* 3x4 Keypad Grid */}
      <div className="grid grid-cols-3 gap-1">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="py-2.5 rounded-lg bg-bg-surface hover:bg-[#252b36] active:bg-accent/20 active:text-accent border border-border-subtle/80 text-base font-money font-bold text-text-main transition-all active:scale-95 flex items-center justify-center"
          >
            {digit}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          onClick={handleClear}
          className="py-2.5 rounded-lg bg-bg-surface hover:bg-[#252b36] active:bg-money-neg/20 active:text-money-neg border border-border-subtle/80 text-xs font-semibold text-text-muted transition-all active:scale-95 flex items-center justify-center gap-1"
          title="Temizle"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Sil</span>
        </button>

        {/* Zero */}
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="py-2.5 rounded-lg bg-bg-surface hover:bg-[#252b36] active:bg-accent/20 active:text-accent border border-border-subtle/80 text-base font-money font-bold text-text-main transition-all active:scale-95 flex items-center justify-center"
        >
          0
        </button>

        {/* Backspace Button */}
        <button
          type="button"
          onClick={handleBackspace}
          className="py-2.5 rounded-lg bg-bg-surface hover:bg-[#252b36] active:bg-money-neg/20 active:text-money-neg border border-border-subtle/80 text-text-muted hover:text-text-main transition-all active:scale-95 flex items-center justify-center"
          title="Son basamağı sil"
        >
          <Delete className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
