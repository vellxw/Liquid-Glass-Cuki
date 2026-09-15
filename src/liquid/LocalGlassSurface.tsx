import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { Canvas, Group, Image, Rect, ImageShader, Shader, Skia, FilterMode, MipmapMode, makeImageFromView, type SkImage } from '@shopify/react-native-skia';
import Animated, { useAnimatedStyle, useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { LOCAL_GLASS } from './physics';
import { opticalFrame, sameFrame, contactPatch } from './opticalFrame';
import { DEPRESSION_SKSL } from './depressionShader';
import type { LiquidPhysics } from './types';

// A failed/unsupported renderer must preserve the native control, never crash the Home.
const EFFECT=(()=>{try{return Skia.RuntimeEffect.Make(DEPRESSION_SKSL);}catch{return null;}})();
export type LocalGlassSurfaceProps={
  physics:LiquidPhysics;children:ReactNode;rim?:ReactNode;enabled?:boolean;debug?:boolean;
  mechanicalSupport?:boolean;revision?:unknown;onReady?:(ready:boolean)=>void;
};
/** Original native REST. Cached material only, not the reference and not live backdrop.
 * Texture invalidation is event-driven; capture is forbidden during CONTACT or RELEASE.
 * Pointer uniforms are coalesced once per UI frame. Only a bounded contact rectangle
 * runs the expensive shader; the rest is a single ordinary image draw. */
export function LocalGlassSurface({physics,children,rim,enabled=true,debug=false,mechanicalSupport=false,revision,onReady}:LocalGlassSurfaceProps){
  const source=useRef<View>(null);
  const [image,setImage]=useState<SkImage|null>(null);
  const generation=useRef(0);
  const readyCallback=useRef(onReady);readyCallback.current=onReady;
  const {width,height,pressure,contactX,contactY,velocityX,velocityY,releaseX,releaseY,reduceMotion}=physics;
  const [layoutRevision,setLayoutRevision]=useState(0);
  const onLayout=useCallback(()=>setLayoutRevision(v=>v+1),[]);
  useEffect(()=>{
    let alive=true,busy=false,pending:SkImage|null=null,timer:ReturnType<typeof setTimeout>|undefined;
    const token=++generation.current;
    const idle=()=>!physics.active.value && pressure.value===0;
    const attempt=()=>{
      if(!alive || token!==generation.current)return;
      if(!idle() || busy){timer=setTimeout(attempt,80);return;}
      if(pending){setImage(pending);pending=null;readyCallback.current?.(true);return;}
      if(!source.current || !EFFECT){readyCallback.current?.(false);return;}
      busy=true;
      makeImageFromView(source).then(next=>{
        if(!alive || token!==generation.current)return;
        // A capture started at REST may finish after touch-down. Never swap it mid-gesture.
        pending=next;busy=false;attempt();
      }).catch(error=>{busy=false;console.warn('[local-glass-texture]',String(error));readyCallback.current?.(false);});
    };
    timer=setTimeout(attempt,180);
    const app=AppState.addEventListener('change',state=>{if(state==='active' && alive){if(timer)clearTimeout(timer);timer=setTimeout(attempt,120);}});
    return ()=>{alive=false;generation.current++;if(timer)clearTimeout(timer);app.remove();};
  },[width,height,layoutRevision,revision,physics.active,pressure]);

  const available=enabled && image!==null && EFFECT!==null;
  const frame=useSharedValue(opticalFrame(width/2,height/2,0,0,0,width,height,false,physics.intensity,false));
  const lastInput=useSharedValue({x:width/2,y:height/2,t:0});
  const sampler=useFrameCallback(({timestamp})=>{
    const p=available?pressure.value:0;
    const x=contactX.value,y=contactY.value;
    const old=lastInput.value;
    if(x!==old.x || y!==old.y)lastInput.value={x,y,t:timestamp};
    const moving=timestamp-lastInput.value.t<LOCAL_GLASS.velocitySettleMs;
    const next=opticalFrame(x+releaseX.value,y+releaseY.value,moving?velocityX.value:0,moving?velocityY.value:0,
      p,width,height,reduceMotion.value,physics.intensity,mechanicalSupport && available);
    if(!sameFrame(frame.value,next))frame.value=next;
  },false);
  useEffect(()=>{sampler.setActive(available);return ()=>sampler.setActive(false);},[sampler,available]);
  // One boolean transition per contact/release, NOT an animated brightness/opacity response.
  const nativeBacking=useAnimatedStyle(()=>({opacity:available && frame.value.pressure!==0?0:1}),[available]);
  const nativeRim=useAnimatedStyle(()=>({opacity:available && frame.value.pressure!==0?1:0}),[available]);
  const activeTexture=useDerivedValue(()=>available && frame.value.pressure!==0?1:0,[available]);
  const uniforms=useDerivedValue(()=>({size:[width,height],touch:[frame.value.x,frame.value.y],
    velocity:[frame.value.vx,frame.value.vy],pressure:available?frame.value.pressure:0,
    radius:LOCAL_GLASS.radius,depth:frame.value.depth,refraction:LOCAL_GLASS.refraction,debug:debug?1:0}),[width,height,available,debug]);
  const patch=useDerivedValue(()=>contactPatch(frame.value.x,frame.value.y,width,height),[width,height]);
  const inset=LOCAL_GLASS.pinnedRim;
  const innerClip={rect:{x:inset,y:inset,width:width-inset*2,height:height-inset*2},rx:height/2-inset,ry:height/2-inset};
  return <View pointerEvents="none" style={{width,height}}>
    <Animated.View style={[StyleSheet.absoluteFill,nativeBacking]}>
      <View ref={source} collapsable={false} onLayout={onLayout} style={StyleSheet.absoluteFill}>{children}</View>
    </Animated.View>
    {image && EFFECT && <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Group opacity={activeTexture} clip={innerClip}>
        <Image image={image} x={0} y={0} width={width} height={height} fit="fill"
          sampling={{filter:FilterMode.Linear,mipmap:MipmapMode.None}}/>
        <Rect rect={patch} blendMode="src">
          <Shader source={EFFECT} uniforms={uniforms}>
            <ImageShader image={image} fit="fill" rect={{x:0,y:0,width,height}} tx="clamp" ty="clamp"
              sampling={{filter:FilterMode.Linear,mipmap:MipmapMode.None}}/>
          </Shader>
        </Rect>
      </Group>
    </Canvas>}
    {rim && <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,nativeRim]}>{rim}</Animated.View>}
  </View>;
}
