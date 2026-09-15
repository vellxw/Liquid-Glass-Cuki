/** Logical dp; implementation calibration, not physical measurements from the video. */
export const VOLUME = {
  radius:42, shoulderRatio:1.5, depth:2.45, reducedDepth:0.32,
  pinStart:2.4, pinEnd:8.0, bevelHeight:2.8, bevelWidth:10,
  projection:0.78, refraction:9.5, maxRefraction:3.4,
  contentTravel:0.9, entrance:86,
} as const;
const sat=(x:number)=>{ 'worklet'; return Math.max(0,Math.min(1,x)); };
/** Shared compact, C2 contact kernel: inner depression plus visible shoulder. */
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
  let sx=gx*VOLUME.refraction*pin, sy=(gy*VOLUME.refraction+z*VOLUME.projection)*pin;
  const limit=VOLUME.maxRefraction/Math.sqrt(VOLUME.maxRefraction**2+sx*sx+sy*sy);
  sx*=limit;sy*=limit;
  return {z,gx,gy,sx,sy,k,pin,edge};
}
export function contentDepth(anchorX:number,anchorY:number,cx:number,cy:number,pressure:number,reduced=false){
  'worklet';
  const d2=(anchorX-cx)**2+(anchorY-cy)**2;
  // Crisp content moves as a plate, never a mesh; only a sub-dp follow-through.
  return Math.min(1,Math.max(0,pressure))*(reduced?.12:VOLUME.contentTravel)*Math.exp(-d2/(58*58));
}
