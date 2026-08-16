/**
 * Design Tokens for Sakamichi Series Link Hub
 */

export const BASE_COLORS = {
  paper: '#FBF8F3',
  paperDeep: '#F4EFE7',
  ink: '#3A3630',
  inkSoft: '#7A736A',
  inkFaint: '#B5ADA2',
  whiteVeil: 'rgba(251, 248, 243, 0.76)',
} as const;

export const GROUP_PALETTES = {
  home: {
    brand: '#9E8FB8',
    blobA: '#B79AE0',
    blobB: '#F3AEC2',
    blobC: '#8FCFEE',
    wash: '#F6F2F8',
    ink: '#3A3630',
  },
  nogizaka46: {
    brand: '#8A6BC1',
    blobA: '#B79AE0',
    blobB: '#D9C6F2',
    blobC: '#EDE3FA',
    wash: '#F3EDFB',
    ink: '#3E3355',
  },
  sakurazaka46: {
    brand: '#E88AA6',
    blobA: '#F3AEC2',
    blobB: '#F9CFDA',
    blobC: '#FDE7EE',
    wash: '#FCEFF3',
    ink: '#57323E',
  },
  hinatazaka46: {
    brand: '#5AB4E0',
    blobA: '#8FCFEE',
    blobB: '#BEE4F7',
    blobC: '#E2F2FB',
    wash: '#EDF6FC',
    ink: '#274A5C',
  },
  keyakizaka46: {
    brand: '#5FAE84',
    blobA: '#93CCAB',
    blobB: '#C0E2CE',
    blobC: '#E4F2EA',
    wash: '#EFF7F2',
    ink: '#2C4739',
  },
} as const;

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
  '5xl': '96px',
} as const;

export const RADIUS = {
  sm: '12px',
  md: '20px',
  lg: '28px',
  pill: '999px',
} as const;
