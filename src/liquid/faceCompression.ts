import { PREMIUM_PRESS as P } from './premiumPress.tokens';
const clamp=(x:number,a:number,b:number)=>{ 'worklet'; return Math.max(a,Math.min(b,x)); };
const smooth=(x:number)=>{ 'worklet'; const t=clamp(x,0,1);return t*t*(3-2*t); };
/** A monotone C1 interpolation in SOURCE coordinates. It maps a visibly displaced
 * inner edge back to its original pixels, instead of attenuating travel with
 * three masks at the very edge that must move. Never scales the capsule. */
export function hermite(x:number,x0:number,x1:number,y0:number,y1:number,m0:number,m1:number){
  'worklet';
  const length=Math.max(.0001,x1-x0),t=clamp((x-x0)/length,0,1),t2=t*t,t3=t2*t;
  return (2*t3-3*t2+1)*y0+(t3-2*t2+t)*length*m0+(-2*t3+3*t2)*y1+(t3-t2)*length*m1;
}
export function faceKnots(x:number,cx:number,cy:number,w:number,h:number,pressure:number,depthScale=1){
  'worklet';
  const r=h/2,dx=x-clamp(x,r,w-r),inset=h*P.innerBevelDesignInset/122;
  const outer=r-Math.sqrt(Math.max(0,r*r-dx*dx));
  const a=r-Math.sqrt(Math.max(.01,(r-inset)**2-dx*dx)),b=h-a;
  const span=P.radius*P.supportRatio;
  const envelope=1-smooth(Math.abs(x-cx)/span);
  const weight=envelope*clamp(pressure,0,1)*clamp(depthScale,0,1)*smooth((b-a-16)/12);
  const bias=clamp((cy/h-.5)*2,-1,1);
  const top=Math.min(P.faceTopTravel*(1-.15*bias)*weight,Math.max(0,a-outer-P.pinStart)*1.65);
  const bottom=Math.min(P.faceBottomTravel*(1+.15*bias)*weight,Math.max(0,a-outer-P.pinStart)*1.65);
  return {outer,lo:outer+P.pinStart,hi:h-outer-P.pinStart,a,b,at:a+top,bt:b-bottom,
    top,bottom,weight,envelope,valid:Math.abs(dx)<r-inset-1&&a>outer+P.pinStart};
}
export function faceSample(x:number,y:number,cx:number,cy:number,w:number,h:number,p:number,depthScale=1){
  'worklet';
  const f=faceKnots(x,cx,cy,w,h,p,depthScale);
  if(p===0||!f.valid||f.weight===0||y<=f.lo||y>=f.hi)return {sx:0,sy:0,weight:0};
  const slope=(f.b-f.a)/Math.max(1,f.bt-f.at);
  const sample=y<f.at?hermite(y,f.lo,f.at,f.lo,f.a,1,slope)
    :y>f.bt?hermite(y,f.bt,f.hi,f.b,f.hi,slope,1):f.a+(y-f.at)*slope;
  return {sx:0,sy:sample-y,weight:f.weight};
}
/** A single rigid .85dp follow-through for BOTH foreground elements. Not a second
 * animation, not movement toward the pointer. Disabling material disables this too. */
export function faceContentTravel(p:number,reduced=false){
  'worklet'; return clamp(p,0,1)*(reduced?P.reducedContentTravel:P.contentTravel);
}
