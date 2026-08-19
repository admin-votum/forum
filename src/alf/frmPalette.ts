// forum palette — Catppuccin-inspired mocha neutrals with warm accents.
// The identity, logo, and amber/orange details remain forum; this only
// shifts the interface surfaces, text, borders, and semantic accents.

const STATIC_VALUES = {
  white: '#FFFFFF',
  black: '#11111B',
  pink: '#F5C2E7',
  yellow: '#F9E2AF',
}

export const FRM_PALETTE = {
  white: STATIC_VALUES.white,
  black: STATIC_VALUES.black,
  pink: STATIC_VALUES.pink,
  yellow: STATIC_VALUES.yellow,
  like: '#F5C2E7',

  // Latte-to-Mocha neutral ramp: parchment light mode, mocha dark mode.
  contrast_0: '#FFFFFF',
  contrast_25: '#FDFBFF',
  contrast_50: '#F7F3FA',
  contrast_100: '#EEEAF3',
  contrast_200: '#D9D2E2',
  contrast_300: '#B9B0C5',
  contrast_400: '#988FA6',
  contrast_500: '#7F7790',
  contrast_600: '#625A70',
  contrast_700: '#4D465A',
  contrast_800: '#383343',
  contrast_900: '#302B3D',
  contrast_950: '#1E1E2E',
  contrast_975: '#181825',
  contrast_1000: '#11111B',

  // Mauve primary ramp, with peach retained for forum's recognizable accent.
  primary_25: '#FFF9FF',
  primary_50: '#FCEBFF',
  primary_100: '#F5D9FC',
  primary_200: '#E8C4F5',
  primary_300: '#DDB0F1',
  primary_400: '#D3A8EE',
  primary_500: '#CBA6F7',
  primary_600: '#B58BE6',
  primary_700: '#9A72C8',
  primary_800: '#7956A8',
  primary_900: '#5B3D82',
  primary_950: '#422A61',
  primary_975: '#2E1D45',

  positive_25: '#F2FBEF',
  positive_50: '#DFF5D7',
  positive_100: '#C1EAB8',
  positive_200: '#A6E3A1',
  positive_300: '#8BD896',
  positive_400: '#74C98A',
  positive_500: '#A6E3A1',
  positive_600: '#70B77B',
  positive_700: '#4B8D5C',
  positive_800: '#356744',
  positive_900: '#244A32',
  positive_950: '#193323',
  positive_975: '#12251A',
  negative_25: '#FFF5F6',
  negative_50: '#FDE2E7',
  negative_100: '#F9C6D0',
  negative_200: '#F5A8B7',
  negative_300: '#F38BA8',
  negative_400: '#ED7897',
  negative_500: '#F38BA8',
  negative_600: '#D96882',
  negative_700: '#B84E68',
  negative_800: '#8A374D',
  negative_900: '#66283A',
  negative_950: '#481C2A',
  negative_975: '#32131E',
} as const

export const FRM_SUBDUED_PALETTE = FRM_PALETTE
