/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        app: '#0b1220',
        surface: '#121a2b',
        elevated: '#162238',
        line: '#26324a',
        primary: '#e6edf7',
        secondary: '#a9b4c9',
        muted: '#7e8aa6',
        accent: {
          DEFAULT: '#22d3ee',
          teal: '#2dd4bf',
          strong: '#60a5fa',
        },
        success: '#34d399',
        warning: '#fbbf24',
        danger: '#f87171',
      },
      backgroundImage: {
        'app-gradient':
          'radial-gradient(1200px 600px at 70% -200px, rgba(34,211,238,.12), transparent), radial-gradient(900px 500px at -100px 80%, rgba(96,165,250,.10), transparent)',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,.03), 0 8px 30px -10px rgba(34,211,238,.18)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
