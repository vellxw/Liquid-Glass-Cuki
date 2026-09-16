import { PREMIUM_PRESS as P } from './premiumPress.tokens';
export const VOLUME = {
  radius:P.radius, shoulderRatio:P.supportRatio, depth:P.depth, reducedDepth:P.reducedDepth,
  pinStart:P.pinStart, pinEnd:P.pinEnd, bevelHeight:P.bevelHeight, bevelWidth:P.bevelWidth,
  projection:P.projection, refraction:P.refraction, maxRefraction:P.maxRefraction,
  contentTravel:0, entrance:P.entryMs,
} as const;
const sat=(x:number)=>{ 'worklet'; return Math.max(0,Math.min(1,x)); };
/** Negative height and smooth analytic slope. Optical displacement also compresses
 * BOTH interior bevels toward the middle. The outer silhouette remains pinned. */
export function volumeSample(x:number,y:number,cx:number,cy:number,w:number,h:number,p:number,depth:number=VOLUME.depth){
  'worklet';
  const rr=h/2, ex=x-Math.max(rr,Math.min(w-rr,x)),ey=y-rr;
  const el=Math.hypot(ex,ey),edge=rr-el;
  const dx=x-cx,dy=y-cy, r2=VOLUME.radius**2, q=(dx*dx+dy*dy)/r2;
  const a=Math.max(0,1-q), b=Math.max(0,1-q/(VOLUME.shoulderRatio**2));
  const k=.65*a*a*a+.35*b*b*b;
  const dk=(-1.95*a*a-1.05*b*b/(VOLUME.shoulderRatio**2))*2/r2;
  const u=sat((edge-VOLUME.pinStart)/(VOLUME.pinEnd-VOLUME.pinStart));
  const pin=u*u*(3-2*u),dPin=6*u*(1-u)/(VOLUME.pinEnd-VOLUME.pinStart);
  const nx=el>1e-6?-ex/el:0,ny=el>1e-6?-ey/el:0;
  const z=-depth*p*k*pin;
  const gx=-depth*p*(dk*dx*pin+k*dPin*nx),gy=-depth*p*(dk*dy*pin+k*dPin*ny);
  const band=Math.max(0,1-edge/18);
  // Inverse sampling moves the top reflection downward and bottom upward.
  const squeeze=P.bevelTravel*(depth/P.depth)*p*k*pin*band*band*Math.sign(ey);
  let sx=gx*VOLUME.refraction*pin,sy=(gy*VOLUME.refraction+z*VOLUME.projection)*pin+squeeze;
  const limit=VOLUME.maxRefraction/Math.sqrt(VOLUME.maxRefraction**2+sx*sx+sy*sy);
  sx*=limit;sy*=limit;
  return {z,gx,gy,sx,sy,k,pin,edge};
}
/** Compatibility helper: labels and icons are deliberately fixed in this version. */
export function contentDepth(_x:number,_y:number,_cx:number,_cy:number,_p:number,_reduced=false){
  'worklet'; return 0;
}
