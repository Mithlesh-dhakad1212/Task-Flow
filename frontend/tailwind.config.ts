import type { Config } from 'tailwindcss';

/** Colour backed by a CSS variable holding an "R G B" triplet (supports /opacity). */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (prefix: string, steps: number[]) =>
  Object.fromEntries(steps.map((s) => [s, v(`${prefix}-${s}`)]));

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: scale('brand', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        ink: scale('ink', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        surface: v('surface'),
        canvas: v('canvas'),
        elevated: v('elevated'),
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        lift: '0 12px 32px -8px rgb(15 23 42 / 0.22)',
        glow: '0 8px 24px -6px rgb(var(--brand-500) / 0.45)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        pop: { '0%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.25)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'scale-in': 'scale-in 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in': 'slide-in 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        pop: 'pop 250ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
