/** Units: dp for travel, milliseconds for event limits, SVG units for optical profiles.
 * These are implementation choices from the brief, NOT values measured from the video.
 */
export const SPRINGS = {
  press: { mass: 0.55, stiffness: 1400, damping: 2 * Math.sqrt(0.55 * 1400), overshootClamping: true, energyThreshold: 0.00001 },
  settle: { mass: 0.65, stiffness: 1050, damping: 2 * Math.sqrt(0.65 * 1050), overshootClamping: true, energyThreshold: 0.00001 },
} as const;

export const PRESS = {
  travel: 2,
  scale: 0.98,
  movementTolerance: 12,
  // RNGH Tap otherwise times out after 500 ms. No long-press action/auto-repeat.
  maxHoldMs: 86_400_000,
  reducedTravel: 0.3,
  reducedScale: 0.998,
  reducedDuration: 55,
  disabledOpacity: 0.45,
  staleHapticMs: 90,
  hapticSeparationMs: 70,
} as const;

export const OPTICS = {
  // Controlled vector approximation of occlusion/normal change; not backdrop refraction.
  inset: 8.4,
  dent: 2.2,
  contactRx: 64,
  contactRy: 39,
  rimSigmaX: 80,
  rimSigmaY: 58,
  occlusion: 0.15,
  topAttenuation: 0.14,
  internalShade: 0.055,
  bentRimOpacity: 0.28,
  bentRimStroke: 1.05,
  ink: '#010609',
} as const;

export function unit(value: number): number {
  'worklet';
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

export function rigidPose(pressure: number, reduced: boolean, intensity = 1) {
  'worklet';
  const p = unit(pressure) * unit(intensity);
  return {
    y: (reduced ? PRESS.reducedTravel : PRESS.travel) * p,
    scale: 1 - (1 - (reduced ? PRESS.reducedScale : PRESS.scale)) * p,
  };
}

/** Inverse of the rigid view transform. The lens follows the REAL touch location,
 * including while the surface underneath that location is moving/scaling.
 */
export function localContact(x: number, y: number, width: number, height: number,
  pressure: number, reduced: boolean, intensity = 1) {
  'worklet';
  const pose = rigidPose(pressure, reduced, intensity);
  return {
    u: unit(((x - width / 2) / pose.scale + width / 2) / Math.max(1, width)),
    v: unit(((y - height / 2 - pose.y) / pose.scale + height / 2) / Math.max(1, height)),
  };
}

/** Capsule hit area, not the empty corners of its bounding rectangle. */
export function insideCapsule(x: number, y: number, width: number, height: number): boolean {
  'worklet';
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return false;
  const r = Math.min(width, height) / 2;
  const cx = Math.max(r, Math.min(width - r, x));
  const cy = Math.max(r, Math.min(height - r, y));
  return (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2;
}

export type RimPoint = { x: number; y: number; nx: number; ny: number };
/** Generated once on RN, never allocated from React on each animation frame. */
export function capsuleSamples(width: number, height: number, inset: number): RimPoint[] {
  const r = height / 2 - inset;
  const points: RimPoint[] = [];
  for (let i = 0; i < 12; i++) points.push({ x: height/2 + (width-height)*i/12, y: inset, nx: 0, ny: 1 });
  for (let i = 0; i < 20; i++) {
    const a = -Math.PI/2 + Math.PI*i/20;
    points.push({ x: width-height/2+r*Math.cos(a), y: height/2+r*Math.sin(a), nx: -Math.cos(a), ny: -Math.sin(a) });
  }
  for (let i = 0; i < 12; i++) points.push({ x: width-height/2-(width-height)*i/12, y: height-inset, nx: 0, ny: -1 });
  for (let i = 0; i < 20; i++) {
    const a = Math.PI/2 + Math.PI*i/20;
    points.push({ x: height/2+r*Math.cos(a), y: height/2+r*Math.sin(a), nx: -Math.cos(a), ny: -Math.sin(a) });
  }
  return points;
}

/** A contact-attached, inward normal displacement. No wave, expanding radius or time input.
 * A closed quadratic profile removes visible segment endings. This is a shaded inner
 * profile of the EXISTING material, never a deformation of text or icon geometry.
 */
export function dentedRim(points: readonly RimPoint[], x: number, y: number, pressure: number): string {
  'worklet';
  const p = unit(pressure);
  const displaced = points.map(q => {
    const d = OPTICS.dent * p * Math.exp(-0.5 * (((q.x-x)/OPTICS.rimSigmaX)**2 + ((q.y-y)/OPTICS.rimSigmaY)**2));
    return { x: q.x+q.nx*d, y: q.y+q.ny*d };
  });
  if (!displaced.length) return '';
  const f = displaced[0], last = displaced[displaced.length-1];
  let d = `M${((f.x+last.x)/2).toFixed(3)} ${((f.y+last.y)/2).toFixed(3)}`;
  for (let i=0; i<displaced.length; i++) {
    const q = displaced[i], next = displaced[(i+1)%displaced.length];
    d += `Q${q.x.toFixed(3)} ${q.y.toFixed(3)} ${((q.x+next.x)/2).toFixed(3)} ${((q.y+next.y)/2).toFixed(3)}`;
  }
  return d+'Z';
}
