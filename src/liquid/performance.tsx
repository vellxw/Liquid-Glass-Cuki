import { createContext, useContext } from 'react';

/** Fixed per experiment/scene. Never changed automatically in the middle of a gesture.
 * Diagnostic variants are NOT quality tiers and are never selected by the product. */
export type GlassPerformanceMode = 'optimized' | 'baseline' | 'roi-only' | 'cache-only' |
  'no-blur' | 'no-lighting' | 'no-content' | 'identity';
export type GlassPerformance = Readonly<{
  localDraw: boolean; cacheArtwork: boolean; optimizedShader: boolean;
  nativeBlur: boolean; lighting: boolean; contentFollow: boolean; identity: boolean;
}>;
const base: GlassPerformance = {
  localDraw:false, cacheArtwork:false, optimizedShader:false,
  nativeBlur:true, lighting:true, contentFollow:true, identity:false,
};
const optimized: GlassPerformance = {...base, localDraw:true, cacheArtwork:true, optimizedShader:true};
export const GLASS_PERFORMANCE: Readonly<Record<GlassPerformanceMode, GlassPerformance>> = {
  baseline:base, optimized,
  'roi-only':{...base, localDraw:true, optimizedShader:true},
  'cache-only':{...base, cacheArtwork:true},
  'no-blur':{...optimized, nativeBlur:false},
  'no-lighting':{...optimized, lighting:false},
  'no-content':{...optimized, contentFollow:false},
  identity:{...optimized, identity:true},
};
/** Default is the measured full-quality path, with no physics/quality changes. */
export const GlassPerformanceContext = createContext<GlassPerformance>(optimized);
export const useGlassPerformance = () => useContext(GlassPerformanceContext);

/** Outward pixel rounding protects the complete 1.5R field, including subpixel AA.
 * Coordinates stay absolute within the original Canvas; no patch rescaling. */
export function contactRect(cx:number,cy:number,width:number,height:number,radius:number,pressure:number,density:number){
  'worklet';
  if(pressure===0 || !Number.isFinite(cx+cy+width+height) || width<=0 || height<=0)
    return {x:0,y:0,width:0,height:0};
  const d=Math.max(1,density), support=radius*1.5+1/d;
  const x=Math.max(0,Math.floor((cx-support)*d)/d);
  const y=Math.max(0,Math.floor((cy-support)*d)/d);
  const r=Math.min(width,Math.ceil((cx+support)*d)/d);
  const b=Math.min(height,Math.ceil((cy+support)*d)/d);
  return {x,y,width:Math.max(0,r-x),height:Math.max(0,b-y)};
}
