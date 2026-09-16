import { createContext, useContext } from 'react';

export type GlassPerformanceMode = 'baseline'|'optimized'|'frame-coalesced'|'shader-only'|'roi-only'|'cache-only'|'no-blur'|'no-lighting'|'no-content'|'identity';
export type GlassPerformance = {
  localDraw:boolean; optimizedShader:boolean; cacheArtwork:boolean; coalesce:boolean;
  nativeBlur:boolean; lighting:boolean; contentFollow:boolean; identity:boolean;
};
const base:GlassPerformance={localDraw:false,optimizedShader:false,cacheArtwork:false,coalesce:false,nativeBlur:true,lighting:true,contentFollow:true,identity:false};
const optimized:GlassPerformance={...base,localDraw:true,optimizedShader:true};
export const GLASS_PERFORMANCE: Readonly<Record<GlassPerformanceMode, GlassPerformance>> = {
  baseline:base, optimized,
  'frame-coalesced':{...optimized, coalesce:true},
  'shader-only':{...base, optimizedShader:true},
  'roi-only':{...base, localDraw:true, optimizedShader:true},
  'cache-only':{...base, cacheArtwork:true},
  'no-blur':{...optimized, nativeBlur:false},
  'no-lighting':{...optimized, lighting:false},
  'no-content':{...optimized, contentFollow:false},
  identity:{...optimized, identity:true},
};
/** Default is the full-quality ROI path selected in the first native A/B, with no physics/quality changes. */
export const GlassPerformanceContext = createContext<GlassPerformance>(optimized);
export const useGlassPerformance = () => useContext(GlassPerformanceContext);

/** Outward pixel rounding protects the complete 1.5R field, including subpixel AA.
 * Coordinates stay absolute within the original Canvas; no patch rescaling. */
export function contactRect(cx:number,cy:number,width:number,height:number,radius:number,pressure:number,density:number){
  'worklet';
  if(!Number.isFinite(cx+cy+width+height) || width<=0 || height<=0)
    return {x:0,y:0,width:0,height:0};
  const d=Math.max(1,density);
  // One transparent physical pixel prepares the actual GPU pipeline in REST.
  // No permanent frame loop; the approved shader returns exact alpha=0 here.
  if(pressure===0)return {x:0,y:0,width:Math.min(width,1/d),height:Math.min(height,1/d)};
  const support=radius*1.5+1/d;
  const x=Math.max(0,Math.floor((cx-support)*d)/d);
  const y=0; // face compression spans both interior edges, not a radial light patch
  const r=Math.min(width,Math.ceil((cx+support)*d)/d);
  const b=height;
  return {x,y,width:Math.max(0,r-x),height:Math.max(0,b-y)};
}
