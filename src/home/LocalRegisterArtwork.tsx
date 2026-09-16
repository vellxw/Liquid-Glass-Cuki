import { memo, useCallback, useId, useMemo, useState, type RefObject } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg,{ Circle,Defs,G,LinearGradient,Stop } from 'react-native-svg';
import Animated, {useAnimatedStyle} from 'react-native-reanimated';
import { RegisterButtonMaterial } from './RegisterButtonMaterial';
import { HomeIcon } from './HomeIcon';
import { HomeText } from './HomeText';
import { GLASS,HOME_REFERENCE,PX } from './tokens';
import { VolumeSurface,makeProofSubstrate } from '../liquid/VolumeSurface';
import { useGlassPerformance } from '../liquid/performance';
import { contentDepth } from '../liquid/volumeField';
import type { LiquidPhysics } from '../liquid/types';

type Props={physics:LiquidPhysics;scale:number;label:string;fontFamily?:string;
  blurTarget?:RefObject<View|null>;enabled?:boolean;debug?:boolean;proofGrid?:boolean;
  contentFollow?:boolean;lighting?:boolean;onReady?:(ready:boolean)=>void};
/** The optical surface is always Skia. No capsule scale/down, no per-press snapshots.
 * The plus insert stays fixed in its original SVG compositing pass. Crisp text may follow .9dp. */
export const LocalRegisterArtwork=memo(function LocalRegisterArtwork({physics,scale,label,fontFamily,blurTarget,enabled=true,
  debug=false,proofGrid=false,contentFollow=true,lighting=true,onReady}:Props){
  const performance=useGlassPerformance();
  const id=`volume${useId().replace(/[^a-zA-Z0-9]/g,'')}`,s=PX*scale,w=460*s,h=122*s;
  const canBlur=performance.nativeBlur && (Platform.OS!=='android'||!!blurTarget);
  const [supported,setSupported]=useState(true);
  const ready=useCallback((value:boolean)=>{setSupported(value);onReady?.(value);},[onReady]);
  const substrate=useMemo(()=>proofGrid?makeProofSubstrate(w,h):null,[proofGrid,w,h]);
  const labelStyle=useAnimatedStyle(()=>({transform:[{translateY:enabled && contentFollow && supported && performance.contentFollow?
    contentDepth(300*s,61*s,physics.contactX.value,physics.contactY.value,physics.pressure.value,physics.reduceMotion.value):0}]}),[enabled,contentFollow,performance.contentFollow,supported,s]);
  return <View pointerEvents="none" style={{width:w,height:h}}>
    {canBlur && <View style={[StyleSheet.absoluteFill,{borderRadius:h/2,overflow:'hidden'}]}>
      <BlurView intensity={GLASS.blur} tint="dark" blurTarget={blurTarget}
        blurMethod={Platform.OS==='android'?'dimezisBlurViewSdk31Plus':'none'}
        style={[StyleSheet.absoluteFill,{opacity:GLASS.blurOpacity}]}/>
    </View>}
    <VolumeSurface key={`${w}:${h}`} physics={physics} enabled={enabled} debug={debug} lighting={lighting}
      substrate={substrate} backdropTarget={blurTarget} onReady={ready} protectedCircle={[118*s,61*s,32.5*s]}>
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
    <Animated.View style={[StyleSheet.absoluteFill,labelStyle]}>
      <View renderToHardwareTextureAndroid={performance.cacheArtwork} shouldRasterizeIOS={performance.cacheArtwork} style={StyleSheet.absoluteFill}>
      <HomeText x={193} baseline={HOME_REFERENCE.bodyTop+75} width={254} size={34}
        scale={scale} fontFamily={fontFamily}>{label}</HomeText>
      </View>
    </Animated.View>
  </View>;
});
