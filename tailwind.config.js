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
          main: '#08090C',    // Derin, mat, sakin siyah/obsidiyen
          card: '#101318',    // Mat sakin yüzey
          surface: '#161A22', // İkincil interaktif yüzey
          hover: '#1B202A',   // Hover durumu
        },
        border: {
          subtle: '#1C2028',  // Kılcal, zarif 1px ayırıcılar
          active: '#2A313E',  // Odaklanmış/aktif sınırlar
        },
        text: {
          main: '#F4F5F7',    // Kırık beyaz, yüksek kontrast
          muted: '#828896',   // Ölçülü editoryal gri
          subtle: '#525765',  // İkincil silik detaylar
        },
        money: {
          pos: '#2ED573',     // Canlı fakat doğal para yeşili
          neg: '#FF5252',     // Doğal kırmızı
        },
        accent: {
          DEFAULT: '#2ED573',
          hover: '#26af5f',
          subtle: 'rgba(46, 213, 115, 0.12)',
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
