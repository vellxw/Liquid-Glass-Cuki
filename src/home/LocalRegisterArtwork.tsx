import { memo, useCallback, useState, useId, useMemo, type RefObject } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated,{useAnimatedStyle} from 'react-native-reanimated';
import {faceContentTravel} from '../liquid/faceCompression';
import { BlurView } from 'expo-blur';
import Svg,{ Circle,Defs,G,LinearGradient,Stop } from 'react-native-svg';
import { RegisterButtonMaterial } from './RegisterButtonMaterial';
import { HomeIcon } from './HomeIcon';
import { HomeText } from './HomeText';
import { GLASS,HOME_REFERENCE,PX } from './tokens';
import { VolumeSurface,makeProofSubstrate } from '../liquid/VolumeSurface';
import { useGlassPerformance } from '../liquid/performance';
import { usePremiumScroll } from '../liquid/PremiumScrollScope';
import type { LiquidPhysics } from '../liquid/types';

type Props={physics:LiquidPhysics;scale:number;label:string;fontFamily?:string;
  blurTarget?:RefObject<View|null>;enabled?:boolean;debug?:boolean;proofGrid?:boolean;
  contentFollow?:boolean;lighting?:boolean;onReady?:(ready:boolean)=>void};
/** The optical surface is always Skia. No capsule scale/down, no per-press snapshots.
 * Native REST stays exact. During pressure the optical renderer translates the
 * circle rigidly; native text uses the same .85dp scalar, never a mesh or scale. */
export const LocalRegisterArtwork=memo(function LocalRegisterArtwork({physics,scale,label,fontFamily,blurTarget,enabled=true,
  debug=false,proofGrid=false,contentFollow=true,lighting=true,onReady}:Props){
  const performance=useGlassPerformance();
  const scroll=usePremiumScroll();
  const id=`volume${useId().replace(/[^a-zA-Z0-9]/g,'')}`,s=PX*scale,w=460*s,h=122*s;
  const canBlur=performance.nativeBlur && (Platform.OS!=='android'||!!blurTarget);
  const [ready,setReady]=useState(false);
  const surfaceReady=useCallback((value:boolean)=>{setReady(value);onReady?.(value);},[onReady]);
  const protectedCircle=useMemo(()=>[118*s,61*s,32.5*s] as const,[s]);
  const contentStyle=useAnimatedStyle(()=>({transform:[{translateY:enabled&&ready&&contentFollow&&performance.contentFollow?
    faceContentTravel(physics.pressure.value,physics.reduceMotion.value):0}]}),[enabled,ready,contentFollow,performance.contentFollow]);
  const substrate=useMemo(()=>proofGrid?makeProofSubstrate(w,h):null,[proofGrid,w,h]);
  return <View pointerEvents="none" style={{width:w,height:h}}>
    {canBlur && <View style={[StyleSheet.absoluteFill,{borderRadius:h/2,overflow:'hidden'}]}>
      <BlurView intensity={GLASS.blur} tint="dark" blurTarget={blurTarget}
        blurMethod={Platform.OS==='android'?'dimezisBlurViewSdk31Plus':'none'}
        style={[StyleSheet.absoluteFill,{opacity:GLASS.blurOpacity}]}/>
    </View>}
    <VolumeSurface key={`${w}:${h}`} physics={physics} enabled={enabled} debug={debug} lighting={lighting}
      substrate={substrate} backdropTarget={blurTarget} onReady={surfaceReady} contentFollow={contentFollow} resourceRevision={scroll?.resourceRevision} protectedCircle={protectedCircle}>
      <View style={[StyleSheet.absoluteFill,{borderRadius:h/2,overflow:'hidden'}]}>
        <Svg width={w} height={h} viewBox="0 0 460 122">
          <Defs><LinearGradient id={`${id}-circle`} x1="0" y1="0" x2="1" y2="1">
            <Stop stopColor="#34464F"/><Stop offset="0.55" stopColor="#0C171D"/><Stop offset="1" stopColor="#4D5F67"/>
          </LinearGradient></Defs>
          <RegisterButtonMaterial id={`${id}-material`}/>
          <Circle cx="118" cy="61" r="32.5" fill="#081015" opacity="0.6"/>
          <Circle cx="118" cy="61" r="30.5" fill={`url(#${id}-circle)`} stroke="#DCE8ED" strokeWidth="2"/>
          <G transform="translate(101 44)"><HomeIcon name="plus" width={34}/></G>
        </Svg>
      </View>
    </VolumeSurface>
    <Animated.View style={[StyleSheet.absoluteFill,contentStyle]}>
      <View renderToHardwareTextureAndroid={performance.cacheArtwork} shouldRasterizeIOS={performance.cacheArtwork} style={StyleSheet.absoluteFill}>
      <HomeText x={193} baseline={HOME_REFERENCE.bodyTop+75} width={254} size={34}
        scale={scale} fontFamily={fontFamily}>{label}</HomeText>
      </View>
    </Animated.View>
  </View>;
});
