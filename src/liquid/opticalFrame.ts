import { LOCAL_GLASS, MECHANICAL_PRESS } from './physics';
export type OpticalFrame = { x:number; y:number; vx:number; vy:number; pressure:number; depth:number };
/** Pure UI worklet, shared with host tests. Removes body pose from native coordinates. */
export function opticalFrame(x:number,y:number,vx:number,vy:number,p:number,width:number,height:number,
  reduced:boolean,intensity:number,mechanical:boolean):OpticalFrame {
  'worklet';
  const progress=Math.max(0,Math.min(1,p));
  const k=mechanical ? 1+((reduced?MECHANICAL_PRESS.reducedScale:MECHANICAL_PRESS.scale)-1)*progress : 1;
  const down=mechanical ? (reduced?MECHANICAL_PRESS.reducedTravel:MECHANICAL_PRESS.travel)*progress : 0;
  return {x:(x-width/2)/k+width/2,y:(y-down-height/2)/k+height/2,
    vx:reduced?0:vx,vy:reduced?0:vy,pressure:p,
    depth:(reduced?LOCAL_GLASS.reducedDepth:LOCAL_GLASS.depth)*Math.max(0,Math.min(2,intensity))};
}
export function sameFrame(a:OpticalFrame,b:OpticalFrame):boolean {
  'worklet'; return a.x===b.x && a.y===b.y && a.vx===b.vx && a.vy===b.vy && a.pressure===b.pressure && a.depth===b.depth;
}
export function contactPatch(x:number,y:number,width:number,height:number) {
  'worklet';
  const extent=LOCAL_GLASS.radius*1.91;
  const left=Math.max(0,x-extent),top=Math.max(0,y-extent);
  return {x:left,y:top,width:Math.max(0,Math.min(width,x+extent)-left),height:Math.max(0,Math.min(height,y+extent)-top)};
}
