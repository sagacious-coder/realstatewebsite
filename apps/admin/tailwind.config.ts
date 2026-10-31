import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F1B29',
          light: '#1B2A3D',
          dark: '#080E17',
        },
        ivory: '#F7F5F0',
        sand: '#F2EDE4',
        gold: {
          DEFAULT: '#C5A880',
          deep: '#9E825D',
          light: '#DFCCA8',
        },
        emerald: {
          DEFAULT: '#1B4332',
          light: '#2D6A4F',
        },
        slate: {
          850: '#15202E',
          900: '#0F172A',
        },
        line: '#E2DCD2',
        muted: '#6B7280',
        card: '#FFFFFF',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;

