import { memo, useId } from 'react';
import Svg, {
  Circle, ClipPath, Defs, G, LinearGradient, Path, RadialGradient, Stop,
} from 'react-native-svg';
import { HOME_PATH } from './GlassIcons';
import {
  ACTIVE_PATH, COLORS, DESIGN, MATERIAL, OUTER_PATH, TABS, type BottomNavId,
} from './tokens';

type Props = { width: number; height: number; activeTab: BottomNavId };

type GlowProps = { d: string; stroke: string };
function SoftStroke({ d, stroke }: GlowProps) {
  return (
    <G fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round">
      {MATERIAL.softGlow.map(({ width, opacity }) => (
        <Path key={width} d={d} strokeWidth={width} opacity={opacity} />
      ))}
    </G>
  );
}

/**
 * Reflection layers are actual SVG primitives rendered by react-native-svg.
 * Soft falloffs use radial gradients + nested strokes, not SVG filter support.
 * Backdrop blur is a separate native layer in BottomNavGlass.tsx.
 */
export const GlassMaterial = memo(function GlassMaterial({ width, height, activeTab }: Props) {
  const instanceId = useId();
  const prefix = `glass${instanceId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const id = (name: string) => `${prefix}-${name}`;
  const paint = (name: string) => `url(#${id(name)})`;
  const selected = TABS.find(tab => tab.id === activeTab) ?? TABS[0];
  const activeX = selected.center - DESIGN.active.centerOffset;
  const mintEdge = 'M 7 154 V 199 C 8 278 61 333 153 334 H 210';
  const warmEdge = 'M 10 143 C 11 63 69 7 153 7 H 210';

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${DESIGN.width} ${DESIGN.height}`} accessible={false}>
      <Defs>
        <ClipPath id={id('outer-clip')}><Path d={OUTER_PATH} /></ClipPath>
        <ClipPath id={id('active-clip')}><Path d={ACTIVE_PATH} /></ClipPath>
        <ClipPath id={id('circle-clip')}><Circle r={DESIGN.register.radius} /></ClipPath>

        <LinearGradient id={id('outer-depth')} x1="0" y1="0" x2="0" y2="444" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#52606A" stopOpacity={0.16} />
          <Stop offset="0.15" stopColor="#182124" stopOpacity={0.08} />
          <Stop offset="0.5" stopColor="#000407" stopOpacity={0.12} />
          <Stop offset="0.82" stopColor="#14222B" stopOpacity={0.09} />
          <Stop offset="1" stopColor="#597381" stopOpacity={0.15} />
        </LinearGradient>
        <LinearGradient id={id('outer-rim')} x1="0" y1="0" x2="0" y2="444" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#BCD4EB" stopOpacity={0.94} />
          <Stop offset="0.36" stopColor="#A8B6B8" stopOpacity={0.75} />
          <Stop offset="0.68" stopColor="#8CABB4" stopOpacity={0.60} />
          <Stop offset="1" stopColor="#B5D6DC" stopOpacity={0.50} />
        </LinearGradient>
        <RadialGradient id={id('outer-left')} cx="90" cy="57" rx="310" ry="275" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#D4D1B9" stopOpacity={0.50} />
          <Stop offset="0.5" stopColor="#BECAC3" stopOpacity={0.28} />
          <Stop offset="1" stopColor="#BACDCB" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={id('outer-right')} cx="1750" cy="94" rx="302" ry="220" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#A6B1B3" stopOpacity={0.072} />
          <Stop offset="1" stopColor="#A6B1B3" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={id('outer-bottom')} cx="930" cy="431" rx="995" ry="29" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#456070" stopOpacity={0.09} />
          <Stop offset="1" stopColor="#456070" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={id('outer-mint')} cx="90" cy="370" rx="300" ry="181" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#A2F4B8" stopOpacity={0.22} />
          <Stop offset="1" stopColor="#A2F4B8" stopOpacity={0} />
        </RadialGradient>

        <LinearGradient id={id('active-body')} x1="170" y1="0" x2="215" y2="340" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#353B3E" stopOpacity={0.88} />
          <Stop offset="0.30" stopColor="#24282B" stopOpacity={0.87} />
          <Stop offset="0.62" stopColor="#121C1E" stopOpacity={0.94} />
          <Stop offset="0.84" stopColor="#14211F" stopOpacity={0.96} />
          <Stop offset="1" stopColor="#314F48" stopOpacity={0.90} />
        </LinearGradient>
        <RadialGradient id={id('active-warm')} cx="97" cy="60" rx="151" ry="153" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#E5B9A0" stopOpacity={0.22} />
          <Stop offset="0.55" stopColor="#D3AB90" stopOpacity={0.10} />
          <Stop offset="1" stopColor="#D3AB90" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={id('home-aura')} cx="183" cy="112" rx="119" ry="115" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFDFBA" stopOpacity={0.40} />
          <Stop offset="0.36" stopColor="#EFAB7D" stopOpacity={0.26} />
          <Stop offset="0.75" stopColor="#D8A275" stopOpacity={0.055} />
          <Stop offset="1" stopColor="#D8A275" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={id('active-cool')} cx="300" cy="98" rx="87" ry="117" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#D6E4EE" stopOpacity={0.08} />
          <Stop offset="1" stopColor="#D6E4EE" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={id('active-green')} cx="34" cy="256" rx="173" ry="158" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#A5FDB8" stopOpacity={0.65} />
          <Stop offset="0.45" stopColor="#82E5A1" stopOpacity={0.26} />
          <Stop offset="1" stopColor="#82E5A1" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={id('active-corner')} cx="71" cy="296" rx="108" ry="89" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#B5FFD0" stopOpacity={0.38} />
          <Stop offset="1" stopColor="#7BFFAE" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={id('active-bottom')} cx="166" cy="333" rx="159" ry="32" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#9CFFBA" stopOpacity={0.16} />
          <Stop offset="1" stopColor="#76DEA3" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={id('active-ice')} cx="310" cy="318" rx="103" ry="74" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#9ACFE0" stopOpacity={0.23} />
          <Stop offset="1" stopColor="#9ACFE0" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={id('hot-upper')} cx="62" cy="43" rx="77" ry="25" gradientTransform="rotate(-46 62 43)" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFEF9" stopOpacity={1} />
          <Stop offset="0.43" stopColor="#FFFAEF" stopOpacity={0.98} />
          <Stop offset="0.70" stopColor="#FFE3C8" stopOpacity={0.45} />
          <Stop offset="0.90" stopColor="#FFD1B5" stopOpacity={0.10} />
          <Stop offset="1" stopColor="#FFD1B5" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={id('hot-lower')} cx="52" cy="286" rx="78" ry="17" gradientTransform="rotate(43 52 286)" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#F8FFFC" stopOpacity={1} />
          <Stop offset="0.29" stopColor="#E5FFEB" stopOpacity={0.95} />
          <Stop offset="0.56" stopColor="#AEFFC3" stopOpacity={0.50} />
          <Stop offset="0.80" stopColor="#87FFB1" stopOpacity={0.18} />
          <Stop offset="1" stopColor="#9BFFBD" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={id('hot-right')} cx="320" cy="74" rx="23" ry="70" gradientTransform="rotate(-26 320 74)" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#F5E4E0" stopOpacity={0.79} />
          <Stop offset="0.2" stopColor="#EAE2E0" stopOpacity={0.56} />
          <Stop offset="0.45" stopColor="#DFE6EB" stopOpacity={0.30} />
          <Stop offset="0.7" stopColor="#CCD9E2" stopOpacity={0.10} />
          <Stop offset="1" stopColor="#CCD9E2" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={id('active-rim')} x1="123" y1="0" x2="232" y2="340" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#F8FBFD" stopOpacity={0.97} />
          <Stop offset="0.31" stopColor="#DCE5EE" stopOpacity={0.85} />
          <Stop offset="0.55" stopColor="#ABC5D3" stopOpacity={0.69} />
          <Stop offset="0.77" stopColor="#BBE9DF" stopOpacity={0.86} />
          <Stop offset="1" stopColor="#A6F2D7" stopOpacity={0.96} />
        </LinearGradient>
        <LinearGradient id={id('mint-rim')} x1="9" y1="224" x2="248" y2="326" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#CBFFD4" stopOpacity={0.54} />
          <Stop offset="0.26" stopColor="#F0FFF1" stopOpacity={1} />
          <Stop offset="0.55" stopColor="#ACFFC8" stopOpacity={0.74} />
          <Stop offset="1" stopColor="#8CFCC4" stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id={id('warm-rim')} x1="20" y1="92" x2="226" y2="9" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFF8DB" stopOpacity={0.22} />
          <Stop offset="0.26" stopColor="#FFFFFF" stopOpacity={0.96} />
          <Stop offset="0.54" stopColor="#FFD4BC" stopOpacity={0.68} />
          <Stop offset="1" stopColor="#FFE3D1" stopOpacity={0.06} />
        </LinearGradient>

        <LinearGradient id={id('circle-body')} x1="-12" y1="-98" x2="20" y2="98" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#2A343C" />
          <Stop offset="0.32" stopColor="#12191E" />
          <Stop offset="0.64" stopColor="#0A1116" />
          <Stop offset="1" stopColor="#1D2B34" />
        </LinearGradient>
        <RadialGradient id={id('circle-top-left')} cx="-55" cy="-67" rx="83" ry="67" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#BCD1DC" stopOpacity={0.19} />
          <Stop offset="1" stopColor="#BCD1DC" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={id('circle-top-right')} cx="54" cy="-60" rx="50" ry="67" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#E5EAF3" stopOpacity={0.30} />
          <Stop offset="1" stopColor="#E5EAF3" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={id('circle-center')} cx="-7" cy="6" rx="90" ry="78" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#000307" stopOpacity={0.20} />
          <Stop offset="1" stopColor="#000307" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={id('circle-side')} cx="0" cy="0" rx="98" ry="132" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#BEDCEA" stopOpacity={0} />
          <Stop offset="0.74" stopColor="#BEDCEA" stopOpacity={0} />
          <Stop offset="0.84" stopColor="#BEDCEA" stopOpacity={0.02} />
          <Stop offset="0.94" stopColor="#BEDCEA" stopOpacity={0.28} />
          <Stop offset="0.985" stopColor="#BEDCEA" stopOpacity={0.20} />
          <Stop offset="1" stopColor="#BEDCEA" stopOpacity={0.08} />
        </RadialGradient>
        <RadialGradient id={id('circle-haze')} cx="0" cy="-18" rx="48" ry="57" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#84908F" stopOpacity={0.095} />
          <Stop offset="1" stopColor="#84908F" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={id('circle-bottom')} cx="0" cy="97" rx="69" ry="29" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#A0D0E5" stopOpacity={0.10} />
          <Stop offset="1" stopColor="#A0D0E5" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={id('circle-rim')} x1="-22" y1="-98" x2="27" y2="98" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#F4FAFF" stopOpacity={0.98} />
          <Stop offset="0.28" stopColor="#BCD1DE" stopOpacity={0.72} />
          <Stop offset="0.65" stopColor="#8FB6CF" stopOpacity={0.83} />
          <Stop offset="1" stopColor="#B8DCF2" stopOpacity={0.88} />
        </LinearGradient>
        <LinearGradient id={id('circle-hot')} x1="-90" y1="-70" x2="83" y2="-40" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#F6FDFF" stopOpacity={0.08} />
          <Stop offset="0.22" stopColor="#FFFFFF" stopOpacity={0.94} />
          <Stop offset="0.47" stopColor="#FFFFFF" stopOpacity={0.10} />
          <Stop offset="0.80" stopColor="#FFFFFF" stopOpacity={0.59} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
      </Defs>

      <Path d={OUTER_PATH} fill={COLORS.glass} fillOpacity={MATERIAL.outerBaseOpacity} />
      <Path d={OUTER_PATH} fill={paint('outer-depth')} />
      <Path d={OUTER_PATH} fill={paint('outer-left')} opacity={activeTab === 'hoy' ? 1 : 0.22} />
      <Path d={OUTER_PATH} fill={paint('outer-right')} />
      <Path d={OUTER_PATH} fill={paint('outer-bottom')} />
      {activeTab !== 'registrar' && (
        <G clipPath={paint('outer-clip')}>
          <G transform={`translate(${activeX - DESIGN.active.x} 0)`}>
            <Path d={OUTER_PATH} fill={paint('outer-mint')} />
          </G>
        </G>
      )}
      <G clipPath={paint('outer-clip')}>
        <Path d={OUTER_PATH} fill="none" stroke="#90A7B1" strokeWidth={18} opacity={0.027} />
        <Path d={OUTER_PATH} fill="none" stroke="#99AFB8" strokeWidth={8} opacity={0.032} />
        <G transform="translate(7 7) scale(0.9927 0.966)">
          <Path d={OUTER_PATH} fill="none" stroke="#8CA5AF" strokeWidth={2} opacity={0.048} />
        </G>
      </G>
      <Path d={OUTER_PATH} fill="none" stroke={paint('outer-rim')} strokeWidth={MATERIAL.outerBorder} />

      {activeTab !== 'registrar' && (
        <G transform={`translate(${activeX} ${DESIGN.active.y})`}>
          <Path d={ACTIVE_PATH} fill="#04090C" stroke="#000000" strokeWidth={MATERIAL.activeShadow.width} opacity={MATERIAL.activeShadow.opacity} />
          <Path d={ACTIVE_PATH} fill={paint('active-body')} />
          <Path d={ACTIVE_PATH} fill={paint('active-warm')} />
          <Path d={ACTIVE_PATH} fill={paint('home-aura')} />
          <Path d={ACTIVE_PATH} fill={paint('active-cool')} />
          <Path d={ACTIVE_PATH} fill={paint('active-green')} />
          <Path d={ACTIVE_PATH} fill={paint('active-corner')} />
          <Path d={ACTIVE_PATH} fill={paint('active-bottom')} />
          <Path d={ACTIVE_PATH} fill={paint('active-ice')} />
          <Path d={ACTIVE_PATH} fill={paint('hot-upper')} />
          <Path d={ACTIVE_PATH} fill={paint('hot-lower')} />
          <Path d={ACTIVE_PATH} fill={paint('hot-right')} />
          {activeTab === 'hoy' && (
            <G transform="translate(131 67)" fill="none" stroke="#FFF3E5" strokeLinejoin="round">
              <Path d={HOME_PATH} strokeWidth={20} opacity={0.018} />
              <Path d={HOME_PATH} strokeWidth={12} opacity={0.025} />
              <Path d={HOME_PATH} strokeWidth={6} opacity={0.045} />
            </G>
          )}
          <G clipPath={paint('active-clip')}>
            <Path d={ACTIVE_PATH} fill="none" stroke={paint('active-rim')} strokeWidth={16} opacity={0.09} />
            <Path d={ACTIVE_PATH} fill="none" stroke={paint('active-rim')} strokeWidth={7} opacity={0.15} />
            <SoftStroke d={mintEdge} stroke={paint('mint-rim')} />
            <SoftStroke d={warmEdge} stroke={paint('warm-rim')} />
            <Path d={mintEdge} fill="none" stroke={paint('mint-rim')} strokeWidth={3.8} />
            <Path d={warmEdge} fill="none" stroke={paint('warm-rim')} strokeWidth={2.8} />
            <Path d="M 16 249 C 30 291 63 318 104 328" fill="none" stroke={paint('mint-rim')} strokeWidth={5.4} strokeLinecap="round" opacity={0.87} />
            <Path d="M 18 92 C 29 57 58 28 88 17" fill="none" stroke={paint('warm-rim')} strokeWidth={5} strokeLinecap="round" />
            <G transform="translate(5 5) scale(0.9714 0.9706)">
              <Path d={ACTIVE_PATH} fill="none" stroke="#00090D" strokeWidth={1.6} opacity={0.35} />
            </G>
          </G>
          <Path d={ACTIVE_PATH} fill="none" stroke={paint('active-rim')} strokeWidth={MATERIAL.activeBorder} />
        </G>
      )}

      <G transform={`translate(${DESIGN.register.cx} ${DESIGN.register.cy})`}>
        <Circle r={DESIGN.register.radius} fill="#000000" stroke="#000000" strokeWidth={MATERIAL.circleShadow.width} opacity={MATERIAL.circleShadow.opacity} />
        <Circle r={DESIGN.register.radius} fill={paint('circle-body')} fillOpacity={0.96} />
        <Circle r={DESIGN.register.radius} fill={paint('circle-top-left')} />
        <Circle r={DESIGN.register.radius} fill={paint('circle-top-right')} />
        <Circle r={DESIGN.register.radius} fill={paint('circle-center')} />
        <Circle r={DESIGN.register.radius} fill={paint('circle-side')} />
        <Circle r={DESIGN.register.radius} fill={paint('circle-haze')} />
        <Circle r={DESIGN.register.radius} fill={paint('circle-bottom')} />
        <G clipPath={paint('circle-clip')}>
          <Circle r={96} fill="none" stroke={paint('circle-rim')} strokeWidth={16} opacity={0.025} />
          <Circle r={95} fill="none" stroke={paint('circle-rim')} strokeWidth={8} opacity={0.07} />
          <Circle r={93.8} fill="none" stroke="#070E16" strokeWidth={2.4} opacity={0.39} />
          <Path d="M -78 -54 A 95 95 0 0 1 81 -48" fill="none" stroke={paint('circle-hot')} strokeWidth={3.1} strokeLinecap="round" />
          <Path d="M -79 51 A 94 94 0 0 0 -3 94" fill="none" stroke={paint('circle-hot')} strokeWidth={3.2} strokeLinecap="round" />
        </G>
        <Circle r={DESIGN.register.radius} fill="none" stroke={paint('circle-rim')} strokeWidth={MATERIAL.circleBorder} />
        {activeTab === 'registrar' && <Circle r={95.7} fill="none" stroke="#EDF9FF" strokeWidth={1.6} opacity={0.45} />}
      </G>
    </Svg>
  );
});
