/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        'af-dark': '#0a0a1a',
        'af-surface': '#12122a',
        'af-border': '#1e1e3f',
        'af-accent': '#6366f1',
        'af-accent-hover': '#818cf8',
        'af-success': '#10b981',
        'af-warning': '#f59e0b',
        'af-error': '#ef4444',
        'af-text': '#e2e8f0',
        'af-muted': '#64748b',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(99, 102, 241, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
