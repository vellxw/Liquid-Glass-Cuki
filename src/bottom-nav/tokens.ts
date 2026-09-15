/** All geometry is measured in source-image pixels. Scale once, never per axis. */
export const REFERENCE = {
  width: 2048,
  height: 684,
  barX: 67,
  barY: 110,
} as const;

export const DESIGN = {
  width: 1912,
  height: 444,
  active: { x: 22, y: 68, width: 350, height: 340, centerOffset: 183 },
  register: { cx: 952.5, cy: 165, radius: 97.5 },
  label: {
    top: 278,
    height: 72,
    baseline: 330,
    fontSize: 56,
    lineHeight: 68,
    letterSpacing: 0,
  },
  hitTop: 45,
  hitHeight: 365,
} as const;

export const TABS = [
  { id: 'hoy', label: 'Hoy', center: 205 },
  { id: 'recetas', label: 'Recetas', center: 571 },
  { id: 'registrar', label: 'Registrar', center: 953 },
  { id: 'entrenar', label: 'Entrenar', center: 1346 },
  { id: 'progreso', label: 'Progreso', center: 1707 },
] as const;

export type BottomNavId = (typeof TABS)[number]['id'];

export const ICON_BOXES = {
  hoy: { x: 153, y: 135, width: 104, height: 104 },
  recetas: { x: 516, y: 133, width: 110, height: 106 },
  registrar: { x: 913, y: 126, width: 80, height: 80 },
  entrenar: { x: 1285, y: 146, width: 122, height: 94 },
  progreso: { x: 1668, y: 147, width: 79, height: 92 },
} satisfies Record<BottomNavId, { x: number; y: number; width: number; height: number }>;

export const COLORS = {
  backdrop: '#000000',
  glass: '#090D10',
  activeText: '#F9FAFA',
  inactiveText: '#ADB5BF',
  inactiveIcon: '#ABB5BF',
  whiteIcon: '#FCFCFD',
  mint: '#9AFFC0',
  ice: '#B3DEEC',
} as const;

export const MATERIAL = {
  blurIntensity: 32,
  blurOpacity: 0.24,
  outerBaseOpacity: 0.89,
  outerBorder: 3.0,
  activeBorder: 2.7,
  circleBorder: 2.8,
  pressedOpacity: 0.72,
  activeShadow: { width: 15, opacity: 0.17 },
  circleShadow: { width: 18, opacity: 0.18 },
  softGlow: [
    { width: 44, opacity: 0.018 },
    { width: 36, opacity: 0.025 },
    { width: 29, opacity: 0.035 },
    { width: 23, opacity: 0.045 },
    { width: 18, opacity: 0.06 },
    { width: 13, opacity: 0.075 },
    { width: 9, opacity: 0.10 },
    { width: 6, opacity: 0.14 },
  ],
} as const;

/** The top edge bows upward by ~29 px; a rounded rectangle cannot match it. */
export const OUTER_PATH = [
  'M 210 31',
  'C 653 -6.5 1195 -7.5 1712 27',
  'C 1829 35 1912 122 1911 236',
  'C 1913 357 1825 439 1695 438',
  'C 1213 445 691 445 209 439',
  'C 86 437 2 364 1 245',
  'C -4 123 82 40 210 31 Z',
].join(' ');

/** Deliberately asymmetric continuous corners, traced from the reference. */
export const ACTIVE_PATH = [
  'M 153 2 H 210',
  'C 290 2 347 61 348 143',
  'V 198 C 348 281 291 338 210 339',
  'H 153 C 61 339 2 282 2 198',
  'V 149 C 2 64 63 2 153 2 Z',
].join(' ');

export const getBarHeight = (width: number): number => {
  if (!Number.isFinite(width) || width <= 0) {
    throw new RangeError('BottomNavGlass: width must be a finite positive number.');
  }
  return (width * DESIGN.height) / DESIGN.width;
};

export function getTabBounds(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= TABS.length) {
    throw new RangeError('BottomNavGlass: invalid tab index.');
  }
  const tab = TABS[index];
  const left = index === 0 ? 0 : (TABS[index - 1].center + tab.center) / 2;
  const right = index === TABS.length - 1
    ? DESIGN.width
    : (tab.center + TABS[index + 1].center) / 2;
  return { left, width: right - left };
}
