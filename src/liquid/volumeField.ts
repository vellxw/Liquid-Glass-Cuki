import { PREMIUM_PRESS as P } from './premiumPress.tokens';
import { faceSample,faceContentTravel } from './faceCompression';
export const VOLUME = {
  radius:P.radius,shoulderRatio:P.supportRatio,depth:P.depth,reducedDepth:P.reducedDepth,
  pinStart:P.pinStart,pinEnd:P.pinEnd,bevelHeight:P.bevelHeight,bevelWidth:P.bevelWidth,
  projection:P.projection,refraction:P.refraction,maxRefraction:P.maxRefraction,
  contentTravel:P.contentTravel,entrance:P.entryMs,
} as const;
/** Host/numerical description; actual visible travel is given by faceSample.
 * Physical depth and measured pixel travel are no longer confused. */
export function volumeSample(x:number,y:number,cx:number,cy:number,w:number,h:number,p:number,depth:number=VOLUME.depth){
  'worklet';
  const r=h/2,ex=x-Math.max(r,Math.min(w-r,x)),ey=y-r,edge=r-Math.hypot(ex,ey);
  const d=(x-cx)/(P.radius*P.supportRatio),t=Math.min(1,Math.abs(d));
  const k=1-t*t*(3-2*t);
  const z=-depth*Math.max(0,p)*k;
  const gx=depth*Math.max(0,p)*6*t*(1-t)*Math.sign(d)/(P.radius*P.supportRatio);
  const s=faceSample(x,y,cx,cy,w,h,p,depth/P.depth);
  return {z:s.weight===0?0:z,gx:s.weight===0?0:gx,gy:0,sx:s.sx,sy:s.sy,k,pin:s.weight===0?0:1,edge};
}
export function contentDepth(_x:number,_y:number,_cx:number,_cy:number,p:number,reduced=false){
  'worklet';return faceContentTravel(p,reduced);
}
