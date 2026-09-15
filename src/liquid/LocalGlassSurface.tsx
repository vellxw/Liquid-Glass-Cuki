import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { Canvas, Fill, Group, ImageShader, Shader, Skia, FilterMode, MipmapMode, makeImageFromView, type SkImage } from '@shopify/react-native-skia';
import Animated, { useAnimatedReaction, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { DEPRESSION_SKSL } from './depressionShader';
import { LOCAL_GLASS } from './physics';
import type { LiquidPhysics } from './types';

const EFFECT=(()=>{
  const compiled=Skia.RuntimeEffect.Make(DEPRESSION_SKSL);
  if(!compiled) throw new Error('CUKI local glass shader failed to compile.');
  return compiled;
})();
export type LocalGlassSurfaceProps={
  physics:LiquidPhysics; children:ReactNode; enabled?:boolean; debug?:boolean;
  /** Invalidate when the backdrop/material changes. A capture is never made per drag frame. */
  revision?:unknown; onReady?:(ready:boolean)=>void;
};
/** REST is the original native material, not an approximation. An in-memory texture
 * is captured from that ACTUAL view at layout/rest. During contact only the material
 * is resampled by Skia. Text/icon siblings are never included in this texture.
 * No bundled UI bitmap, no reference crop, no encoding/decoding, no JS finger stream.
 * The captured backdrop is frozen during each contact; not a live arbitrary RN backdrop.
 */
export function LocalGlassSurface({physics,children,enabled=true,debug=false,revision,onReady}:LocalGlassSurfaceProps){
  const source=useRef<View>(null);
  const [image,setImage]=useState<SkImage|null>(null);
  const alive=useRef(true), generation=useRef(0), busy=useRef(false);
  const readyCallback=useRef(onReady);readyCallback.current=onReady;
  const {width,height,pressure,contactX,contactY,velocityX,velocityY,releaseX,releaseY,reduceMotion}=physics;
  const capture=useCallback(()=>{
    const token=++generation.current;
    // Let native display/blur settle. This happens outside contact, NEVER per frame.
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(!alive.current || !source.current || token!==generation.current || busy.current || physics.active.value)return;
      busy.current=true;
      makeImageFromView(source).then(next=>{
        if(alive.current && token===generation.current){setImage(next);readyCallback.current?.(true);}
      }).catch(error=>{ console.warn('[local-glass-texture]',String(error));readyCallback.current?.(false); })
        .finally(()=>{busy.current=false;});
    }));
  },[width,height,physics.active]);
  useEffect(()=>{
    alive.current=true;
    const timer=setTimeout(capture,180);
    const app=AppState.addEventListener('change',state=>{if(state==='active')capture();});
    return ()=>{alive.current=false;generation.current++;clearTimeout(timer);app.remove();};
  },[capture,revision]);
  useAnimatedReaction(()=>pressure.value,(p,old)=>{
    if(p===0 && old!==null && old!==0) scheduleOnRN(capture);
  });
  // Discrete backing-store substitution only. Opacity never represents pressure.
  const nativeBacking=useAnimatedStyle(()=>({opacity:enabled && image!==null && pressure.value!==0 ? 0:1}),[enabled,image]);
  const activeTexture=useDerivedValue(()=>enabled && image!==null && pressure.value!==0 ? 1:0,[enabled,image]);
  const uniforms=useDerivedValue(()=>({
    size:[width,height],touch:[contactX.value+releaseX.value,contactY.value+releaseY.value],
    velocity:reduceMotion.value ? [0,0]:[velocityX.value,velocityY.value],
    pressure:enabled ? pressure.value : 0,radius:LOCAL_GLASS.radius,
    depth:(reduceMotion.value ? LOCAL_GLASS.reducedDepth : LOCAL_GLASS.depth)*physics.intensity,
    refraction:LOCAL_GLASS.refraction,debug:debug?1:0,
  }),[width,height,enabled,debug,physics.intensity]);
  return <View pointerEvents="none" style={{width,height}}>
    <Animated.View style={[StyleSheet.absoluteFill,nativeBacking]}>
      <View ref={source} collapsable={false} onLayout={capture} style={StyleSheet.absoluteFill}>{children}</View>
    </Animated.View>
    {image && <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Group opacity={activeTexture}>
        <Fill><Shader source={EFFECT} uniforms={uniforms}>
          <ImageShader image={image} fit="fill" rect={{x:0,y:0,width,height}} tx="clamp" ty="clamp"
            sampling={{filter:FilterMode.Linear,mipmap:MipmapMode.None}} />
        </Shader></Fill>
      </Group>
    </Canvas>}
  </View>;
}
