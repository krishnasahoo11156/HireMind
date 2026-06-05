import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'sans-serif']
      },
      colors: {
        // Light mode
        background: '#FAFAF9',
        surface: '#FFFFFF',
        primary: '#111827',
        secondary: '#6B7280',
        accent: '#A16207',
        success: '#15803D',
        warning: '#B45309',
        danger: '#B91C1C',
        border: '#E5E7EB',
        foreground: 'hsl(var(--foreground))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        // Dark mode
        darkbg: '#0B0F14',
        darksurface: '#121722',
        darktext: '#F9FAFB',
        darkmuted: '#9CA3AF',
        darkaccent: '#D4A017',
        darkborder: '#232936'
      },
      boxShadow: {
        panel: '0 1px 2px rgba(15, 17, 21, 0.06)',
        card: '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
        glow: '0 0 0 3px rgba(161,98,7,0.18)'
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem'
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '18': '4.5rem',
        '70': '17.5rem',
        '72': '18rem'
      },
      maxWidth: {
        content: '1600px'
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'count-up': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        },
        'slow-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.08' },
          '50%': { transform: 'scale(1.15)', opacity: '0.04' }
        }
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
        'fade-up': 'fade-up 0.4s ease-out both',
        'count-up': 'count-up 0.6s ease-out both',
        'slow-pulse': 'slow-pulse 8s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
