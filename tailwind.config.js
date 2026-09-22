/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wt: {
          dark: '#161a1e',
          panel: '#1b2026',
          card: '#1e242c',
          border: '#323a44',
          accent: '#2f74b5',
          gold: '#f4d776',
          red: '#f74a38',
          green: '#a1d26a',
          cyan: '#6ab6e8',
          textMuted: '#8b949e',
          textBright: '#ffffff',
          textSubtle: '#c8d0d8',
        }
      },
      fontFamily: {
        ptsans: ['PTSans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
