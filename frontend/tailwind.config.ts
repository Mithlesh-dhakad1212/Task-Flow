import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eff5ff',
          100: '#dbe8fe',
          200: '#bfd7fe',
          300: '#93bbfd',
          400: '#6095fa',
          500: '#3b72f6',
          600: '#2563eb',
          700: '#1d4fd8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        ink: {
          50: '#f6f8fb',
          100: '#eef1f6',
          200: '#e2e7ef',
          300: '#cbd3df',
          400: '#94a0b4',
          500: '#64708a',
          600: '#4a5568',
          700: '#334155',
          800: '#1e293b',
          900: '#0f1b2d',
          950: '#0b1424',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 27 45 / 0.04), 0 1px 3px 0 rgb(15 27 45 / 0.06)',
        lift: '0 8px 24px -6px rgb(15 27 45 / 0.16)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'scale-in': 'scale-in 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in': 'slide-in 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
