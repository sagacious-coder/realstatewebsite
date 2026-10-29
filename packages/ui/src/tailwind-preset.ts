import type { Config } from 'tailwindcss';

export const wildHillsTailwindPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        navy: '#101B33',
        'navy-2': '#1A2848',
        ivory: '#FAF8F3',
        white: '#FFFFFF',
        gold: '#C99E4C',
        'gold-deep': '#8A6A22',
        'gold-light': '#E8D9B8',
        emerald: '#1D7A52',
        'emerald-deep': '#14583D',
        mist: '#E8F1EC',
        sea: '#24509E',
        muted: '#5A6378',
        line: '#E4DFD2',
      },
      fontFamily: {
        serif: ['var(--font-lora)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
        arabic: ['var(--font-ibm-plex-arabic)', 'sans-serif'],
      },
      borderRadius: {
        card: '6px',
        DEFAULT: '4px',
      },
      maxWidth: {
        container: '1200px',
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(16, 27, 51, 0.06)',
      },
    },
  },
};

export default wildHillsTailwindPreset;
