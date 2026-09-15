/** All lengths are logical dp. Values are calibrated implementation parameters,
 * not claimed measurements of the reference video's physical depth or haptics. */
export const LOCAL_GLASS = {
  radius: 42,
  depth: 1.65,
  refraction: 24,
  maxRefraction: 3.6,
  pinnedRim: 2.4,
  rimTransition: 7,
  supportStart: 1.35,
  supportEnd: 1.85,
  derivativeStep: 0.35,
  contactSeed: 0.25,
  contactDuration: 86,
  velocitySettleMs: 80,
  maxVelocity: 1600,
  releaseKick: 0.6,
  reducedDepth: 0.28,
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
export function unit(value: number): number {
  'worklet';
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}
export function insideCapsule(x: number, y: number, width: number, height: number): boolean {
  'worklet';
  if (![x,y,width,height].every(Number.isFinite) || width<=0 || height<=0) return false;
  const r=Math.min(width,height)/2;
  const cx=Math.max(r,Math.min(width-r,x)), cy=Math.max(r,Math.min(height-r,y));
  return (x-cx)**2+(y-cy)**2<=r*r;
}
export function smooth(a: number,b: number,x: number): number {
  'worklet'; const t=unit((x-a)/(b-a));return t*t*(3-2*t);
}
/** Positive distance inside a horizontal pill. Shared by the host numerical tests. */
export function rimDistance(x:number,y:number,w:number,h:number):number {
  'worklet'; const r=h/2,cx=Math.max(r,Math.min(w-r,x));return r-Math.hypot(x-cx,y-r);
}
/** Negative height = depression, never a positive bulge. No clock/wave input. */
export function heightAt(x:number,y:number,cx:number,cy:number,w:number,h:number,p:number,r=LOCAL_GLASS.radius,depth=LOCAL_GLASS.depth):number {
  'worklet';
  const q=Math.hypot(x-cx,y-cy)/r;
  const pin=smooth(LOCAL_GLASS.pinnedRim,LOCAL_GLASS.pinnedRim+LOCAL_GLASS.rimTransition,rimDistance(x,y,w,h));
  const falloff=Math.exp(-q*q)*(1-smooth(LOCAL_GLASS.supportStart,LOCAL_GLASS.supportEnd,q));
  return -depth*p*falloff*pin;
}
/** Mirrors the shader for independent checks; never run from React for each pixel. */
export function localSample(x:number,y:number,cx:number,cy:number,w:number,h:number,p:number) {
  const e=LOCAL_GLASS.derivativeStep;
  const z=heightAt(x,y,cx,cy,w,h,p);
  const gx=(heightAt(x+e,y,cx,cy,w,h,p)-heightAt(x-e,y,cx,cy,w,h,p))/(2*e);
  const gy=(heightAt(x,y+e,cx,cy,w,h,p)-heightAt(x,y-e,cx,cy,w,h,p))/(2*e);
  const pin=smooth(LOCAL_GLASS.pinnedRim,LOCAL_GLASS.pinnedRim+LOCAL_GLASS.rimTransition,rimDistance(x,y,w,h));
  const dx=gx*LOCAL_GLASS.refraction*pin,dy=(gy*LOCAL_GLASS.refraction+z*.4)*pin;
  const limit=Math.min(1,LOCAL_GLASS.maxRefraction/Math.max(1e-9,Math.hypot(dx,dy)));
  return {z,gx,gy,dx:dx*limit,dy:dy*limit};
}

/** Secondary support from the current brief; never substitutes the local field. */
export const MECHANICAL_PRESS = { travel: 2, scale: 0.98, reducedTravel: 0.25, reducedScale: 0.998 } as const;
