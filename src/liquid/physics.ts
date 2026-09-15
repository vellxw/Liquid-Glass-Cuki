import { VOLUME } from './volumeField';
/** Contact dynamics only. Optical geometry is centralized in volumeField.ts. */
export const LOCAL_GLASS = {
  radius: VOLUME.radius,
  contactSeed: 0.25,
  contactDuration: VOLUME.entrance,
  velocityExpiryMs: 80,
  maxVelocity: 1600,
  releaseKick: 0.6,
} as const;
export const SPRINGS = {
  settle: { mass: 0.4, stiffness: 1500, damping: 49, overshootClamping: false, energyThreshold: 0.00001 },
} as const;
export const PRESS = {
  reducedDuration: 55,
  disabledOpacity: 0.45,
  staleHapticMs: 90,
  hapticSeparationMs: 70,
} as const;
export function insideCapsule(x: number, y: number, width: number, height: number): boolean {
  'worklet';
  if (![x,y,width,height].every(Number.isFinite) || width<=0 || height<=0) return false;
  const r=Math.min(width,height)/2;
  const cx=Math.max(r,Math.min(width-r,x)), cy=Math.max(r,Math.min(height-r,y));
  return (x-cx)**2+(y-cy)**2<=r*r;
}
