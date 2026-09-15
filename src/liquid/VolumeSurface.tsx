import { useEffect, useMemo } from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import { Canvas, Fill, Shader, ImageShader, Skia, FilterMode, MipmapMode, type SkImage } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { VOLUME_SKSL, EMPTY_SUBSTRATE_SKSL } from './volumeShader';
import { VOLUME } from './volumeField';
import type { LiquidPhysics } from './types';

const effect=(()=>{try{return Skia.RuntimeEffect.Make(VOLUME_SKSL);}catch{return null;}})();
const empty=Skia.RuntimeEffect.Make(EMPTY_SUBSTRATE_SKSL);
/** Rasterizes VECTOR COMMANDS once on mount/resize. No View snapshots; no UI screenshot
 * files; no asset derived from the reference; no readback during a gesture. The image
 * is only an internal material cache, sampled by the SAME shader even at pressure=0. */
function raster(svgText:string,width:number,height:number):SkImage|null{
  const svg=Skia.SVG.MakeFromString(svgText);
  if(!svg)return null;
  const surface=Skia.Surface.Make(width,height);
  if(!surface)return null;
  surface.getCanvas().clear(Skia.Color('transparent'));
  surface.getCanvas().drawSvg(svg,width,height);
  surface.flush();
  return surface.makeImageSnapshot();
}
export type VolumeSurfaceProps={
  physics:LiquidPhysics; xml:string; enabled?:boolean; lighting?:boolean; debug?:boolean;
  /** Supply content authored into this optical scene. Arbitrary RN backdrops are NOT
   * captured automatically. Contents update when their SkImage reference changes. */
  substrate?:SkImage|null; onReady?:(ready:boolean)=>void;
};
export function VolumeSurface({physics,xml,enabled=true,lighting=true,debug=false,substrate,onReady}:VolumeSurfaceProps){
  const {width,height,pressure,contactX,contactY,releaseX,releaseY,reduceMotion}=physics;
  const density=PixelRatio.get();
  const image=useMemo(()=>{
    try{return raster(xml,Math.ceil(width*density),Math.ceil(height*density));}
    catch(error){console.warn('[volume-material]',String(error));return null;}
  },[xml,width,height,density]);
  const available=!!(image && effect && empty);
  useEffect(()=>{onReady?.(available);},[onReady,available]);
  const uniforms=useDerivedValue(()=>({
    size:[width,height],touch:[contactX.value+releaseX.value,contactY.value+releaseY.value],
    pressure:enabled?pressure.value:0,depth:(reduceMotion.value?VOLUME.reducedDepth:VOLUME.depth)*Math.max(0,Math.min(2,physics.intensity)),
    radius:VOLUME.radius,lighting:lighting?1:0,proof:substrate?1:0,debug:debug?1:0,
  }),[width,height,enabled,lighting,debug,substrate,physics.intensity]);
  if(!image || !effect || !empty)return null;
  // No pressure-dependent opacity, clipping substitution, mounting or layer switch.
  return <View pointerEvents="none" style={{width,height}}>
    <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Fill><Shader source={effect} uniforms={uniforms}>
        <ImageShader image={image} fit="fill" rect={{x:0,y:0,width,height}} tx="clamp" ty="clamp"
          sampling={{filter:FilterMode.Linear,mipmap:MipmapMode.None}}/>
        {substrate ? <ImageShader image={substrate} fit="fill" rect={{x:0,y:0,width,height}} tx="clamp" ty="clamp"
          sampling={{filter:FilterMode.Linear,mipmap:MipmapMode.None}}/> : <Shader source={empty}/>}
      </Shader></Fill>
    </Canvas>
  </View>;
}
export function makeProofSubstrate(width:number,height:number):SkImage|null{
  let paths='';for(let x=0;x<460;x+=22)paths+=`M${x} 0V122`;
  for(let y=0;y<122;y+=22)paths+=`M0 ${y}H460`;
  const xml=`<svg xmlns="http://www.w3.org/2000/svg" width="460" height="122" viewBox="0 0 460 122"><defs><clipPath id="pill"><rect width="460" height="122" rx="61"/></clipPath></defs><g clip-path="url(#pill)"><rect width="460" height="122" fill="#18252b"/><rect x="186" y="0" width="84" height="122" fill="#5092ff"/><path d="${paths}" fill="none" stroke="#ffffff" stroke-width="3"/></g></svg>`;
  return raster(xml,Math.ceil(width*PixelRatio.get()),Math.ceil(height*PixelRatio.get()));
}
