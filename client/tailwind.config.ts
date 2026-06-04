import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        background: '#F8F8F7',
        surface: '#FFFFFF',
        primary: '#1F2937',
        secondary: '#4B5563',
        accent: '#A16207',
        success: '#166534',
        warning: '#B45309',
        danger: '#B91C1C',
        border: '#E5E7EB',
        darkbg: '#0F1115',
        darksurface: '#181B22',
        darktext: '#F9FAFB',
        darkmuted: '#9CA3AF',
        darkaccent: '#D4A017',
        darkborder: '#2B303B'
      },
      boxShadow: {
        panel: '0 1px 2px rgba(15, 17, 21, 0.06)'
      }
    }
  },
  plugins: []
};

export default config;
