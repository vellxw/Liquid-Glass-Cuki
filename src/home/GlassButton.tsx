import { useId, type RefObject } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Defs, G, LinearGradient, Rect, Stop } from 'react-native-svg';
import { GLASS, HOME_REFERENCE, PX } from './tokens';
import { HomeIcon } from './HomeIcon';
import { HomeText } from './HomeText';
import { RegisterButtonMaterial } from './RegisterButtonMaterial';
import { LocalRegisterArtwork } from './LocalRegisterArtwork';
import type { LiquidPhysics } from '../liquid/types';
export type GlassButtonProps = {
  /** With physics the artwork is passive; LiquidPressable owns input and accessibility. */
  interaction?: LiquidPhysics;
  /** Ablation: disables ALL visual pressure response, never leaves a rigid tap behind. */
  opticsEnabled?: boolean;
  debug?: boolean; proofGrid?: boolean; onSurfaceReady?: (ready: boolean) => void;
  variant: 'primary' | 'secondary'; label: string; scale: number;
  onPress?: () => void; disabled?: boolean; fontFamily?: string;
  blurTarget?: RefObject<View | null>; style?: StyleProp<ViewStyle>; testID?: string;
};
/** Separate from the original navigation material: no changes to bottom-nav sources. */
export function GlassButton({ variant, label, scale, onPress, disabled = false,
  fontFamily, blurTarget, style, testID, interaction, opticsEnabled = true, debug = false, proofGrid = false, onSurfaceReady }: GlassButtonProps) {
  const primary = variant === 'primary', w = primary ? 460 : 297, h = primary ? 122 : 79;
  const s = PX * scale, radius = h * s / 2;
  const id = `button${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const url = (name: string) => `url(#${id}-${name})`;
  const canBlur = Platform.OS !== 'android' || !!blurTarget;
  if(primary && interaction) return <LocalRegisterArtwork physics={interaction} scale={scale}
    label={label} fontFamily={fontFamily} blurTarget={blurTarget} enabled={opticsEnabled}
    debug={debug} proofGrid={proofGrid} onReady={onSurfaceReady}/>;
  const artwork = <>
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: radius }]}>
      {canBlur && <BlurView intensity={GLASS.blur} tint="dark" blurTarget={blurTarget}
        blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : 'none'}
        style={[StyleSheet.absoluteFill, { opacity: GLASS.blurOpacity }]} />}
      <Svg width={w*s} height={h*s} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
            <Stop stopColor="#86999E" stopOpacity={primary ? 0.38 : 0.23} />
            <Stop offset="0.48" stopColor="#131D23" stopOpacity="0.74" />
            <Stop offset="1" stopColor="#526269" stopOpacity="0.38" />
          </LinearGradient>
          <LinearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1">
            <Stop stopColor="#D8F6FF" /><Stop offset="0.38" stopColor="#9EADAD" />
            <Stop offset="0.66" stopColor="#EFE3CA" /><Stop offset="1" stopColor="#6F91A4" />
          </LinearGradient>
          <LinearGradient id={`${id}-circle`} x1="0" y1="0" x2="1" y2="1">
            <Stop stopColor="#34464F" /><Stop offset="0.55" stopColor="#0C171D" /><Stop offset="1" stopColor="#4D5F67" />
          </LinearGradient>
        </Defs>
        {primary ? <RegisterButtonMaterial id={id} /> :
          <Rect x="1" y="1" width={w-2} height={h-2} rx={(h-2)/2} fill={url('base')} />}
        {primary && <>
          <Circle cx="118" cy="61" r="32.5" fill="#081015" opacity="0.6" />
          <Circle cx="118" cy="61" r="30.5" fill={url('circle')} stroke="#DCE8ED" strokeWidth="2" />
        </>}
        {!primary && <Rect x="0.8" y="0.8" width={w-1.6} height={h-1.6} rx={(h-1.6)/2} fill="none"
          stroke={url('edge')} strokeWidth={GLASS.secondaryBorder} />}
        {primary ? <G transform="translate(101 44)"><HomeIcon name="plus" width={34} /></G> :
          <G transform="translate(203 26)"><HomeIcon name="arrow" width={29} /></G>}
      </Svg>
    </View>
    <HomeText x={primary ? 193 : 71} baseline={HOME_REFERENCE.bodyTop + (primary ? 75 : 49)}
      width={primary ? 254 : 134} size={primary ? 34 : 26} scale={scale} fontFamily={fontFamily}>{label}</HomeText>
  </>;
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [{ width: w*s, height: h*s, borderRadius: radius }, style,
      { opacity: disabled ? 0.45 : pressed ? GLASS.pressedOpacity : 1 }]}>{artwork}</Pressable>;
}
