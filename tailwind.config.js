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
          main: '#0B0D10',
          card: '#14171C',
          surface: '#1B1F26',
        },
        border: {
          subtle: '#282D35',
        },
        text: {
          main: '#F3F4F6',
          muted: '#9299A5',
        },
        money: {
          pos: '#39D98A',
          neg: '#FF626C',
        },
        accent: {
          DEFAULT: '#72E3A1',
          hover: '#5ecc8b',
          glow: 'rgba(114, 227, 161, 0.15)',
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
