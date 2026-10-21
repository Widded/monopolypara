import React from 'react';
import { Delete, ArrowUp } from 'lucide-react';

interface TextKeyboardProps {
  value: string;
  onChange: (newValue: string) => void;
  onSubmit?: () => void;
  isUppercase?: boolean;
}

export const TextKeyboard: React.FC<TextKeyboardProps> = ({
  value,
  onChange,
  onSubmit,
  isUppercase = true,
}) => {
  const [caps, setCaps] = React.useState<boolean>(isUppercase);

  const row1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const row2 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'];
  const row3 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'];
  const row4 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç'];

  const handleChar = (char: string) => {
    if (value.length >= 20) return;
    const toInsert = caps ? char.toUpperCase() : char.toLowerCase();
    onChange(value + toInsert);
  };

  const handleBackspace = () => {
    if (value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleSpace = () => {
    if (value.length > 0 && !value.endsWith(' ') && value.length < 20) {
      onChange(value + ' ');
    }
  };

  return (
    <div className="bg-bg-surface/90 border border-border-subtle rounded-xl p-1.5 space-y-1 select-none touch-manipulation">
      {/* Numbers row */}
      <div className="flex gap-0.5 justify-center">
        {row1.map(ch => (
          <button
            key={ch}
            type="button"
            onClick={() => handleChar(ch)}
            className="flex-1 py-2 rounded bg-bg-card active:bg-accent/20 active:text-accent border border-border-subtle/60 text-xs font-mono font-bold text-text-main"
          >
            {ch}
          </button>
        ))}
      </div>

      {/* Letters Row 1 */}
      <div className="flex gap-0.5 justify-center">
        {row2.map(ch => (
          <button
            key={ch}
            type="button"
            onClick={() => handleChar(ch)}
            className="flex-1 py-2.5 rounded bg-bg-card active:bg-accent/20 active:text-accent border border-border-subtle/60 text-xs font-semibold text-text-main"
          >
            {caps ? ch.toUpperCase() : ch.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Letters Row 2 */}
      <div className="flex gap-0.5 justify-center px-1">
        {row3.map(ch => (
          <button
            key={ch}
            type="button"
            onClick={() => handleChar(ch)}
            className="flex-1 py-2.5 rounded bg-bg-card active:bg-accent/20 active:text-accent border border-border-subtle/60 text-xs font-semibold text-text-main"
          >
            {caps ? ch.toUpperCase() : ch.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Letters Row 3 with Caps and Backspace */}
      <div className="flex gap-0.5 justify-center">
        <button
          type="button"
          onClick={() => setCaps(!caps)}
          className={`w-9 py-2.5 rounded border border-border-subtle/60 flex items-center justify-center text-xs transition-colors ${
            caps ? 'bg-accent/20 text-accent font-bold' : 'bg-bg-card text-text-muted'
          }`}
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>

        {row4.map(ch => (
          <button
            key={ch}
            type="button"
            onClick={() => handleChar(ch)}
            className="flex-1 py-2.5 rounded bg-bg-card active:bg-accent/20 active:text-accent border border-border-subtle/60 text-xs font-semibold text-text-main"
          >
            {caps ? ch.toUpperCase() : ch.toLowerCase()}
          </button>
        ))}

        <button
          type="button"
          onClick={handleBackspace}
          className="w-10 py-2.5 rounded bg-bg-card active:bg-money-neg/20 active:text-money-neg border border-border-subtle/60 flex items-center justify-center text-text-muted hover:text-text-main"
        >
          <Delete className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom control row: Space, Clear, Dash */}
      <div className="flex gap-1 justify-center pt-0.5">
        <button
          type="button"
          onClick={() => handleChar('-')}
          className="px-3 py-2 rounded bg-bg-card active:bg-accent/20 border border-border-subtle/60 text-xs font-bold text-text-muted"
        >
          -
        </button>

        <button
          type="button"
          onClick={handleSpace}
          className="flex-1 py-2 rounded bg-bg-card active:bg-accent/20 border border-border-subtle/60 text-xs font-medium text-text-muted"
        >
          Boşluk
        </button>

        <button
          type="button"
          onClick={() => onChange('')}
          className="px-3 py-2 rounded bg-bg-card active:bg-money-neg/20 border border-border-subtle/60 text-xs font-semibold text-text-muted"
        >
          Temizle
        </button>
      </div>
    </div>
  );
};
