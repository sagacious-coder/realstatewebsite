/**
 * Wild Hills Brand Tokens - Section 4.1
 */
export const tokens = {
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
  borderRadius: {
    card: '6px',
    button: '4px',
    input: '4px',
  },
  maxWidth: {
    container: '1200px',
  },
} as const;

export type BrandColors = typeof tokens.colors;
