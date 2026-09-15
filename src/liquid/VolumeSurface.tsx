import { useEffect, type ReactNode, type RefObject } from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import { Canvas, Fill, Shader, ImageShader, Skia, FilterMode, MipmapMode, type SkImage } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { VOLUME_SKSL, EMPTY_SUBSTRATE_SKSL } from './volumeShader';
import { VOLUME } from './volumeField';
import { useNativeMaterialCache } from './useNativeMaterialCache';
import type { LiquidPhysics } from './types';

const effect=(()=>{try{return Skia.RuntimeEffect.Make(VOLUME_SKSL);}catch{return null;}})();
const empty=Skia.RuntimeEffect.Make(EMPTY_SUBSTRATE_SKSL);
export type VolumeSurfaceProps={
  physics:LiquidPhysics; children:ReactNode; enabled?:boolean; lighting?:boolean; debug?:boolean;
  /** Controlled live scene if supplied. Otherwise an optional native backdrop is copied at layout. */
  substrate?:SkImage|null; backdropTarget?:RefObject<View|null>; onReady?:(ready:boolean)=>void;
};
/** The SAME cache is rendered in REST, CONTACT and RELEASE. It is prepared from
 * this instance's native vector artwork, not a PNG asset or reference screenshot.
 * No pressure-dependent backing opacity, native/Skia swap or per-press snapshot.
 */
export function VolumeSurface({physics,children,enabled=true,lighting=true,debug=false,substrate,backdropTarget,onReady}:VolumeSurfaceProps){
  const {width,height,pressure,contactX,contactY,releaseX,releaseY,reduceMotion}=physics;
  const {source,host,cache,prepare}=useNativeMaterialCache(physics,backdropTarget);
  const image=cache?.material,underlay=substrate??cache?.backdrop;
  const available=!!(image&&effect&&empty);
  useEffect(()=>{onReady?.(available);},[onReady,available]);
  const uniforms=useDerivedValue(()=>({
    size:[width,height],touch:[contactX.value+releaseX.value,contactY.value+releaseY.value],
    pressure:enabled?pressure.value:0,depth:(reduceMotion.value?VOLUME.reducedDepth:VOLUME.depth)*Math.max(0,Math.min(2,physics.intensity)),
    radius:VOLUME.radius,lighting:lighting?1:0,proof:substrate?1:underlay?2:0,debug:debug?1:0,
  }),[width,height,enabled,lighting,debug,substrate,underlay,physics.intensity]);
  return <View ref={host} collapsable={false} pointerEvents="none" style={{width,height}}>
    {!available && <View ref={source} collapsable={false} onLayout={prepare} style={StyleSheet.absoluteFill}>{children}</View>}
    {available && <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Fill><Shader source={effect!} uniforms={uniforms}>
        <ImageShader image={image!} fit="fill" rect={{x:0,y:0,width,height}} tx="clamp" ty="clamp"
          sampling={{filter:FilterMode.Linear,mipmap:MipmapMode.None}}/>
        {underlay ? <ImageShader image={underlay} fit="fill" rect={{x:0,y:0,width,height}} tx="clamp" ty="clamp"
          sampling={{filter:FilterMode.Linear,mipmap:MipmapMode.None}}/> : <Shader source={empty!}/>}
      </Shader></Fill>
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
