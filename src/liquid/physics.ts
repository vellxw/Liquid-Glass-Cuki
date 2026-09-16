import { PREMIUM_PRESS as P } from './premiumPress.tokens';
/** One scalar spring, no inertia of the whole capsule or residual lateral drift. */
export const LOCAL_GLASS = {
  radius: P.radius, contactSeed: 0, contactDuration: P.entryMs,
  maxVelocity: 1600, releaseKick: 0, velocityExpiryMs: 80,
} as const;
export const SPRINGS = {
  settle: { mass: P.mass, stiffness: P.stiffness, damping: P.damping,
    velocity: 0, overshootClamping: true, energyThreshold: P.energyThreshold },
} as const;
export const PRESS = {
  reducedDuration: P.reducedMs, disabledOpacity: 0.45,
  staleHapticMs: 90, hapticSeparationMs: P.contactHapticSeparationMs,
} as const;
export function insideCapsule(x: number, y: number, width: number, height: number): boolean {
  'worklet';
  if (![x,y,width,height].every(Number.isFinite) || width<=0 || height<=0) return false;
  const r=Math.min(width,height)/2;
  const cx=Math.max(r,Math.min(width-r,x)), cy=Math.max(r,Math.min(height-r,y));
  return (x-cx)**2+(y-cy)**2<=r*r;
}
export function yieldsToScroll(dx:number,dy:number,enabled:boolean):boolean {
  'worklet';
  return enabled && Math.abs(dy)>P.scrollSlop && Math.abs(dy)>Math.abs(dx)*P.scrollDominance;
}
