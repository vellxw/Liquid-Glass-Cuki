import { memo, useId, type RefObject } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg,{ Circle,ClipPath,Defs,G,LinearGradient,Path,Rect,Stop } from 'react-native-svg';
import { RegisterButtonMaterial } from './RegisterButtonMaterial';
import { HomeIcon } from './HomeIcon';
import { HomeText } from './HomeText';
import { GLASS,HOME_REFERENCE,PX } from './tokens';
import { LocalGlassSurface } from '../liquid/LocalGlassSurface';
import { MechanicalSupport } from '../liquid/MechanicalSupport';
import type { LiquidPhysics } from '../liquid/types';

type Props={physics:LiquidPhysics;scale:number;label:string;fontFamily?:string;
  blurTarget?:RefObject<View|null>;enabled?:boolean;debug?:boolean;proofGrid?:boolean;mechanicalSupport?:boolean;onReady?:(ready:boolean)=>void};
/** Deliberately separates the material from crisp, stationary native content.
 * The SVG material, circle, label and their original coordinates are unchanged. */
export const LocalRegisterArtwork=memo(function LocalRegisterArtwork({physics,scale,label,fontFamily,blurTarget,enabled=true,debug=false,proofGrid=false,mechanicalSupport=false,onReady}:Props){
  const id=`local${useId().replace(/[^a-zA-Z0-9]/g,'')}`,s=PX*scale,w=460*s,h=122*s;
  const canBlur=Platform.OS!=='android'||!!blurTarget;
  // Keep the original native-vector outer 2.4dp instead of resampling its antialiasing.
  const inset=2.4/s, rr=61-inset;
  const inner=`M61 ${inset}H399A${rr} ${rr} 0 0 1 399 ${122-inset}H61A${rr} ${rr} 0 0 1 61 ${inset}Z`;
  const rim=<View style={{width:w,height:h,borderRadius:h/2,overflow:'hidden'}}><Svg width={w} height={h} viewBox="0 0 460 122">
    <Defs><ClipPath id={`${id}-rim-clip`}><Path d={`M-1 -1H461V123H-1Z ${inner}`} clipRule="evenodd" fillRule="evenodd"/></ClipPath></Defs>
    <G clipPath={`url(#${id}-rim-clip)`}><RegisterButtonMaterial id={`${id}-fixed-rim`}/></G>
  </Svg></View>;
  let grid='';
  if(proofGrid){
    for(let x=12;x<460;x+=22)grid+=`M${x} 7V115`;
    for(let y=12;y<122;y+=22)grid+=`M7 ${y}H453`;
  }
  return <View pointerEvents="none" style={{width:w,height:h}}><MechanicalSupport physics={physics} enabled={mechanicalSupport && enabled}>
    {canBlur && <View style={[StyleSheet.absoluteFill,{borderRadius:h/2,overflow:'hidden'}]}>
      <BlurView intensity={GLASS.blur} tint="dark" blurTarget={blurTarget}
        blurMethod={Platform.OS==='android'?'dimezisBlurViewSdk31Plus':'none'}
        style={[StyleSheet.absoluteFill,{opacity:GLASS.blurOpacity}]} />
    </View>}
    <LocalGlassSurface physics={physics} rim={rim} mechanicalSupport={mechanicalSupport} enabled={enabled} debug={debug} revision={proofGrid} onReady={onReady}>
      <View style={[StyleSheet.absoluteFill,{borderRadius:h/2,overflow:'hidden'}]}>
        <Svg width={w} height={h} viewBox="0 0 460 122">
          <RegisterButtonMaterial id={`${id}-material`} />
          {proofGrid && <>
            <Defs><ClipPath id={`${id}-proof-clip`}><Rect x="6" y="6" width="448" height="110" rx="55"/></ClipPath></Defs>
            <G clipPath={`url(#${id}-proof-clip)`}><Path d={grid} stroke="#ABBABD" strokeWidth=".8" opacity=".42" /></G>
          </>}
        </Svg>
      </View>
    </LocalGlassSurface>
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={w} height={h} viewBox="0 0 460 122">
      <Defs><LinearGradient id={`${id}-circle`} x1="0" y1="0" x2="1" y2="1">
        <Stop stopColor="#34464F"/><Stop offset="0.55" stopColor="#0C171D"/><Stop offset="1" stopColor="#4D5F67"/>
      </LinearGradient></Defs>
      <Circle cx="118" cy="61" r="32.5" fill="#081015" opacity="0.6"/>
      <Circle cx="118" cy="61" r="30.5" fill={`url(#${id}-circle)`} stroke="#DCE8ED" strokeWidth="2"/>
      <G transform="translate(101 44)"><HomeIcon name="plus" width={34}/></G>
    </Svg>
    <HomeText x={193} baseline={HOME_REFERENCE.bodyTop+75} width={254} size={34}
      scale={scale} fontFamily={fontFamily}>{label}</HomeText>
  </MechanicalSupport></View>;
});
