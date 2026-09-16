import { useEffect, type ReactNode, type RefObject } from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import { Canvas, Fill, Rect, Shader, ImageShader, Skia, FilterMode, MipmapMode, type SkImage } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { VOLUME_SKSL, EMPTY_SUBSTRATE_SKSL } from './volumeShader';
import { OPTIMIZED_VOLUME_SKSL, IDENTITY_VOLUME_SKSL } from './optimizedShader';
import { contactRect, useGlassPerformance } from './performance';
import { OpticalFrameCoordinator, type OpticalFrame } from './useOpticalFrame';
import { VOLUME } from './volumeField';
import { useNativeMaterialCache } from './useNativeMaterialCache';
import type { LiquidPhysics } from './types';

const effect=(()=>{try{return Skia.RuntimeEffect.Make(VOLUME_SKSL);}catch{return null;}})();
const fastEffect=(()=>{try{return Skia.RuntimeEffect.Make(OPTIMIZED_VOLUME_SKSL);}catch{return null;}})();
const identityEffect=(()=>{try{return Skia.RuntimeEffect.Make(IDENTITY_VOLUME_SKSL);}catch{return null;}})();
const empty=Skia.RuntimeEffect.Make(EMPTY_SUBSTRATE_SKSL);
const NO_REGION={x:0,y:0,width:0,height:0};
export type VolumeSurfaceProps={
  physics:LiquidPhysics; children:ReactNode; enabled?:boolean; lighting?:boolean; debug?:boolean;
  /** Rigid native insert excluded from both deformation and texture sampling. */
  protectedCircle?:readonly [number,number,number];
  /** Controlled live scene if supplied. Otherwise an optional native backdrop is copied at layout. */
  substrate?:SkImage|null; backdropTarget?:RefObject<View|null>; onReady?:(ready:boolean)=>void;
};
/** Native material is never replaced, even after cache preparation. The optical
 * Canvas has one persistent path and contributes only a local signed difference.
 * No pressure-dependent View opacity, per-press capture or React drag updates.
 */
export function VolumeSurface({physics,children,enabled=true,lighting=true,debug=false,substrate,backdropTarget,onReady,protectedCircle}:VolumeSurfaceProps){
  const performance=useGlassPerformance();
  const selectedEffect=performance.identity?identityEffect:performance.optimizedShader?(fastEffect??effect):effect;
  const density=PixelRatio.get();
  const {width,height,pressure,contactX,contactY,releaseX,releaseY,reduceMotion}=physics;
  const optical=useSharedValue<OpticalFrame>({x:width/2,y:height/2,p:0,reduced:false});
  const {source,host,cache,prepare}=useNativeMaterialCache(physics,backdropTarget);
  const image=cache?.material,underlay=substrate??cache?.backdrop;
  const available=!!(image&&selectedEffect&&empty);
  useEffect(()=>{onReady?.(available);},[onReady,available]);
  const region=useDerivedValue(()=>performance.localDraw
    ? contactRect(performance.coalesce?optical.value.x:contactX.value+releaseX.value,
        performance.coalesce?optical.value.y:contactY.value+releaseY.value,width,height,VOLUME.radius,
        enabled?(performance.coalesce?optical.value.p:pressure.value):0,density)
    : NO_REGION,[performance.localDraw,performance.coalesce,width,height,enabled,density]);
  const uniforms=useDerivedValue(()=>({
    protectedCircle:protectedCircle?[...protectedCircle]:[0,0,0],
    size:[width,height],touch:performance.coalesce?[optical.value.x,optical.value.y]:[contactX.value+releaseX.value,contactY.value+releaseY.value],
    pressure:enabled?(performance.coalesce?optical.value.p:pressure.value):0,depth:((performance.coalesce?optical.value.reduced:reduceMotion.value)?VOLUME.reducedDepth:VOLUME.depth)*Math.max(0,Math.min(2,physics.intensity)),
    radius:VOLUME.radius,lighting:lighting&&performance.lighting?1:0,proof:substrate?1:underlay?2:0,debug:debug?1:0,
  }),[width,height,enabled,lighting,debug,substrate,underlay,physics.intensity,protectedCircle,performance.lighting,performance.coalesce]);
  const paint=<Shader source={selectedEffect!} uniforms={uniforms}>
        <ImageShader image={image!} fit="fill" rect={{x:0,y:0,width,height}} tx="clamp" ty="clamp"
          sampling={{filter:FilterMode.Linear,mipmap:MipmapMode.None}}/>
        {underlay ? <ImageShader image={underlay} fit="fill" rect={{x:0,y:0,width,height}} tx="clamp" ty="clamp"
          sampling={{filter:FilterMode.Linear,mipmap:MipmapMode.None}}/> : <Shader source={empty!}/>}
      </Shader>;
  return <View ref={host} collapsable={false} pointerEvents="none" style={{width,height}}>
    {performance.coalesce && <OpticalFrameCoordinator physics={physics} frame={optical}/>}
    {substrate && <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Fill><ImageShader image={substrate} fit="fill" rect={{x:0,y:0,width,height}} tx="clamp" ty="clamp"
        sampling={{filter:FilterMode.Linear,mipmap:MipmapMode.None}}/></Fill>
    </Canvas>}
    <View ref={source} collapsable={false} onLayout={prepare}
      renderToHardwareTextureAndroid={performance.cacheArtwork} shouldRasterizeIOS={performance.cacheArtwork}
      style={StyleSheet.absoluteFill}>{children}</View>
    {available && <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
      {performance.localDraw?<Rect rect={region}>{paint}</Rect>:<Fill>{paint}</Fill>}
    </Canvas>}
  </View>;
}
export function makeProofSubstrate(width:number,height:number):SkImage|null{
  let paths='';for(let x=0;x<460;x+=22)paths+=`M${x} 0V122`;
  for(let y=0;y<122;y+=22)paths+=`M0 ${y}H460`;
  const xml=`<svg xmlns="http://www.w3.org/2000/svg" width="460" height="122" viewBox="0 0 460 122"><defs><clipPath id="pill"><rect width="460" height="122" rx="61"/></clipPath></defs><g clip-path="url(#pill)"><rect width="460" height="122" fill="#18252b"/><rect x="186" y="0" width="84" height="122" fill="#5092ff"/><path d="${paths}" fill="none" stroke="#ffffff" stroke-width="3"/></g></svg>`;
  const svg=Skia.SVG.MakeFromString(xml),pw=Math.ceil(width*PixelRatio.get()),ph=Math.ceil(height*PixelRatio.get());
  if(!svg)return null;const surface=Skia.Surface.Make(pw,ph);if(!surface)return null;
  const canvas=surface.getCanvas();canvas.clear(Skia.Color('transparent'));canvas.scale(pw/460,ph/122);
  canvas.drawSvg(svg,460,122);surface.flush();return surface.makeImageSnapshot();
}
