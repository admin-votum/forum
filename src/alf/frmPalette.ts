// frm palette — warm off-white / matte platform, amber accent
// Same shape as @bsky.app/alf's DEFAULT_PALETTE, values swapped.

const STATIC_VALUES = {
  white: '#FFFFFF',
  black: '#181815',
  pink: '#EC4899',
  yellow: '#FFC404',
}

export const FRM_PALETTE = {
  white: STATIC_VALUES.white,
  black: STATIC_VALUES.black,
  pink: STATIC_VALUES.pink,
  yellow: STATIC_VALUES.yellow,
  like: STATIC_VALUES.pink,

  // contrast_* = the neutral scale: backgrounds, borders, body text.
  // Warm off-white / parchment instead of cool blue-gray.
  contrast_0: '#FFFFFF',
  contrast_25: '#FBFAF6',
  contrast_50: '#F7F4EC',
  contrast_100: '#EFE9D8',
  contrast_200: '#E2D9C0',
  contrast_300: '#CBBFA0',
  contrast_400: '#A99C7E',
  contrast_500: '#867A5F',
  contrast_600: '#6B6049',
  contrast_700: '#524939',
  contrast_800: '#3D362A',
  contrast_900: '#2A2520',
  contrast_950: '#1F1B17',
  contrast_975: '#181512',
  contrast_1000: '#000000',

  // primary_* = the accent scale: buttons, links, active states.
  // Amber instead of blue.
  primary_25: '#FFFFFF',
  primary_50: '#FCFBF8',
  primary_100: '#F7F4EC',
  primary_200: '#F2EEE4',
  primary_300: '#EDEAE2',
  primary_400: '#EAE6DD',
  primary_500: '#E8E4DA',
  primary_600: '#D4CFC2',
  primary_700: '#B8B2A4',
  primary_800: '#948E80',
  primary_900: '#6A645A',
  primary_950: '#4A453D',
  primary_975: '#332F29',

  // positive/negative left as Bluesky's defaults — success/error semantics
  // should stay recognizable (green = good, red = bad) regardless of brand.
  positive_25: '#ECFEF5',
  positive_50: '#D3FDE8',
  positive_100: '#A3FACF',
  positive_200: '#6AF6B0',
  positive_300: '#2CF28F',
  positive_400: '#0DD370',
  positive_500: '#09B35E',
  positive_600: '#04904A',
  positive_700: '#036D38',
  positive_800: '#04522B',
  positive_900: '#033F21',
  positive_950: '#032A17',
  positive_975: '#021D0F',
  negative_25: '#FFF5F7',
  negative_50: '#FEE7EC',
  negative_100: '#FDD3DD',
  negative_200: '#FBBBCA',
  negative_300: '#F891A9',
  negative_400: '#F65A7F',
  negative_500: '#E91646',
  negative_600: '#CA123D',
  negative_700: '#A71134',
  negative_800: '#7F0B26',
  negative_900: '#5F071C',
  negative_950: '#430413',
  negative_975: '#30030D',
} as const

export const FRM_SUBDUED_PALETTE = FRM_PALETTE
