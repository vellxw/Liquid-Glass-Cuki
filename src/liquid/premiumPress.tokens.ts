/** Registrar-only behavior, in logical dp/ms. These are calibrated design values,
 * not physical measurements of the user's movie. The resting palette is unchanged. */
export const PREMIUM_PRESS = {
  entryMs:100, reducedMs:55,
  mass:.4, stiffness:1000, damping:40,
  energyThreshold:.00001,
  radius:40, supportRatio:1.5,
  depth:2.5, reducedDepth:.32,
  pinStart:2.25, pinEnd:8,
  innerBevelDesignInset:7.6,
  faceTopTravel:2.5, faceBottomTravel:1.5,
  bevelHeight:2.8, bevelWidth:10, bevelTravel:4,
  refraction:0, projection:0, maxRefraction:3.2,
  contentTravel:.85, reducedContentTravel:.12,
  scrollSlop:10, scrollDominance:1.25,
  contactHapticSeparationMs:100,
} as const;
