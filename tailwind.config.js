/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          main: 'var(--bg-main)',
          card: 'var(--bg-card)',
          surface: 'var(--bg-surface)',
          hover: 'var(--bg-hover)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          active: 'var(--border-active)',
        },
        text: {
          main: 'var(--text-main)',
          muted: 'var(--text-muted)',
          subtle: 'var(--text-subtle)',
        },
        money: {
          pos: 'var(--money-pos)',
          neg: 'var(--money-neg)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          subtle: 'var(--accent-subtle)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
