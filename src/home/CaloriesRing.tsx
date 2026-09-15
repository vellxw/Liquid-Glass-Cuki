import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { BOX, COPY, HOME_DATA, INK, PX } from './tokens';
import { sceneStyle } from './layout';
import { HomeText } from './HomeText';
import type { HomeSectionProps } from './types';
export const clampFraction = (n: number) => Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
export function calorieArc(fraction: number): string {
  const p = clampFraction(fraction);
  if (!p) return '';
  const point = (degrees: number) => {
    const a = degrees * Math.PI / 180;
    return [136 + 123 * Math.cos(a), 134 + 123 * Math.sin(a)].join(' ');
  };
  const start = -84;
  if (p === 1) return `M ${point(start)} A 123 123 0 1 1 ${point(start + 180)} A 123 123 0 1 1 ${point(start + 360)}`;
  return `M ${point(start)} A 123 123 0 ${p > 0.5 ? 1 : 0} 1 ${point(start + 360 * p)}`;
}
export function CaloriesRing({ scale, fontFamily, fraction = HOME_DATA.calorieFraction }: HomeSectionProps & { fraction?: number }) {
  const s = PX * scale, id = `calories${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const d = calorieArc(fraction);
  return <>
    <View pointerEvents="none" style={sceneStyle(BOX.calories, scale)}>
      <Svg width={272 * s} height={268 * s} viewBox="0 0 272 268" style={{ overflow: 'visible' }}>
        <Defs><LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop stopColor={INK.mint} /><Stop offset="1" stopColor={INK.green} />
        </LinearGradient></Defs>
        <Circle cx="136" cy="134" r="123" fill="none" stroke={INK.track} strokeWidth="22" />
        {d && <>{[42,34,28].map((w,i) => <Path key={w} d={d} fill="none" stroke={INK.mint} strokeWidth={w} opacity={0.012 + i * 0.006} strokeLinecap="round" />)}
          <Path d={d} fill="none" stroke={`url(#${id})`} strokeWidth="22" strokeLinecap="round" /></>}
      </Svg>
    </View>
    <HomeText x={44} baseline={546} width={252} size={56} scale={scale} fontFamily={fontFamily} align="center">{COPY.calories}</HomeText>
    <HomeText x={40} baseline={582} width={260} size={24} scale={scale} fontFamily={fontFamily} align="center" color={INK.muted}>{COPY.calorieGoal}</HomeText>
  </>;
}
