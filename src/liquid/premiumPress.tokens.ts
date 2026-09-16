/** Registrar-only behavior. Logical dp / milliseconds; NOT measurements of the
 * reference movie. The native resting artwork and its color tokens are separate. */
export const PREMIUM_PRESS = {
  entryMs: 96,
  reducedMs: 55,
  mass: 0.4,
  stiffness: 1000,
  damping: 40, // critical: 2*sqrt(mass*stiffness)
  energyThreshold: 0.00001,
  radius: 40,
  supportRatio: 1.5,
  depth: 1.8,
  reducedDepth: 0.24,
  pinStart: 2.4,
  pinEnd: 8,
  bevelHeight: 2.8,
  bevelWidth: 10,
  bevelTravel: 1.5,
  refraction: 7.5,
  projection: 0.35,
  maxRefraction: 2.75,
  contentTravel: 0,
  scrollSlop: 10,
  scrollDominance: 1.25,
  contactHapticSeparationMs: 100,
} as const;
