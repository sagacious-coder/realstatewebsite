import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1200px',
        '2xl': '1200px',
      },
    },
    extend: {
      colors: {
        navy: {
          DEFAULT: 'var(--navy)',
          2: 'var(--navy-2)',
        },
        ivory: 'var(--ivory)',
        gold: {
          DEFAULT: 'var(--gold)',
          deep: 'var(--gold-deep)',
          light: 'var(--gold-light)',
        },
        emerald: {
          DEFAULT: 'var(--emerald)',
          deep: 'var(--emerald-deep)',
        },
        mist: 'var(--mist)',
        sea: 'var(--sea)',
        muted: 'var(--muted)',
        line: 'var(--line)',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '4px',
        md: '6px',
        card: '6px',
        none: '0',
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(16, 27, 51, 0.06)',
      },
      fontFamily: {
        serif: ['var(--font-lora)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        arabic: ['var(--font-ibm-plex-arabic)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
