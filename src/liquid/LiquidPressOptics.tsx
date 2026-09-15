import { useMemo } from 'react';
import { ClipPath, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import { capsuleSamples, dentedRim, localContact, OPTICS, unit } from './physics';
import type { LiquidPhysics } from './types';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = { id: string; physics: LiquidPhysics; width: number; height: number };

/** Insert INSIDE an SVG, between its immutable material and rigid foreground.
 * Explicit portable fallback: contact-linked inner shading and a displaced normal
 * profile. It does NOT sample, magnify or refract arbitrary native views behind it.
 * No new bright glow; 0 pressure = 0 visible pixels. All colors are interaction ink.
 */
export function LiquidPressOptics({ id, physics, width, height }: Props) {
  const { pressure, contactX, contactY, reduceMotion, intensity, width: dpWidth, height: dpHeight } = physics;
  const samples = useMemo(() => capsuleSamples(width, height, OPTICS.inset), [width, height]);
  const key = (name: string) => `${id}-pressure-${name}`;
  const url = (name: string) => `url(#${key(name)})`;
  const group = useAnimatedProps(() => ({ opacity: unit(pressure.value) * unit(intensity) }));
  const contact = useAnimatedProps(() => {
    const point = localContact(contactX.value, contactY.value, dpWidth, dpHeight, pressure.value, reduceMotion.value, intensity);
    return { cx: point.u*width, cy: point.v*height, opacity: reduceMotion.value ? 0 : OPTICS.occlusion };
  });
  const rim = useAnimatedProps(() => {
    const p = unit(pressure.value);
    if (p === 0 || reduceMotion.value) return { d: '', opacity: 0 };
    const point = localContact(contactX.value, contactY.value, dpWidth, dpHeight, p, false, intensity);
    return { d: dentedRim(samples, point.u*width, point.v*height, p*unit(intensity)), opacity: OPTICS.bentRimOpacity };
  });
  return <G pointerEvents="none">
    <Defs>
      <ClipPath id={key('clip')}><Rect x={0.7} y={0.7} width={width-1.4} height={height-1.4} rx={height/2-0.7} /></ClipPath>
      <LinearGradient id={key('top')} x1={0} y1={0} x2={0} y2={height} gradientUnits="userSpaceOnUse">
        <Stop offset={0} stopColor={OPTICS.ink} stopOpacity={1} />
        <Stop offset={0.08} stopColor={OPTICS.ink} stopOpacity={0.55} />
        <Stop offset={0.26} stopColor={OPTICS.ink} stopOpacity={0.08} />
        <Stop offset={0.5} stopColor={OPTICS.ink} stopOpacity={0} />
        <Stop offset={1} stopColor={OPTICS.ink} stopOpacity={0} />
      </LinearGradient>
      <RadialGradient id={key('contact')} cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
        <Stop offset={0} stopColor={OPTICS.ink} stopOpacity={1} />
        <Stop offset={0.25} stopColor={OPTICS.ink} stopOpacity={0.85} />
        <Stop offset={0.55} stopColor={OPTICS.ink} stopOpacity={0.29} />
        <Stop offset={0.8} stopColor={OPTICS.ink} stopOpacity={0.035} />
        <Stop offset={1} stopColor={OPTICS.ink} stopOpacity={0} />
      </RadialGradient>
    </Defs>
    <AnimatedG animatedProps={group} opacity={0} clipPath={url('clip')}>
      <Rect x={1} y={1} width={width-2} height={height-2} rx={height/2-1} fill={OPTICS.ink} opacity={OPTICS.internalShade} />
      <Rect x={0} y={0} width={width} height={height} rx={height/2} fill={url('top')} opacity={OPTICS.topAttenuation} />
      <AnimatedEllipse animatedProps={contact} rx={OPTICS.contactRx} ry={OPTICS.contactRy} fill={url('contact')} />
      <AnimatedPath animatedProps={rim} fill="none" stroke={OPTICS.ink} strokeWidth={OPTICS.bentRimStroke} />
    </AnimatedG>
  </G>;
}
