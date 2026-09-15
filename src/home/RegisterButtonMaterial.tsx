import { Defs, G, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

/** Smooth arclength envelope; tangent fields overlap without hard line ends. */
function arcLight(name: string, cx: number, radius: number, from: number, to: number,
  peak: number, sigma: number, color: string, strength: number, ry: number) {
  const count = Math.ceil((to - from) / 3.5) + 1;
  return Array.from({ length: count }, (_, i) => {
    const angle = from + (to - from) * i / (count - 1);
    const radians = angle * Math.PI / 180;
    return { name: `${name}-${i}`, x: cx + radius * Math.cos(radians),
      y: 61 + radius * Math.sin(radians), angle: angle + 90,
      rx: 9, ry, color, strength: strength * Math.exp(-0.5 * ((angle - peak) / sigma) ** 2) };
  });
}

/** Material-only coordinates. The host owns the unchanged 460 x 122 geometry. */
export const REGISTER_MATERIAL = {
  width: 460,
  height: 122,
  outerInset: 0.9,
  outerStroke: 1.4,
  bevelInset: 7.6,
  bevelStroke: 1.25,
  grooveInset: 3.9,
  grooveStroke: 1.6,
  baseTop: '#475259',
  baseMiddle: '#1A2022',
  baseBottom: '#303B40',
  grooveColor: '#02070A',
  // Separate parameters: halos do not increase the core stroke's thickness.
  // Integrate a Gaussian falloff with overlapping, sub-pixel-spaced strokes.
  // Their alpha is a DIFFERENCE of adjacent samples, not repeated white rings.
  glowBands: Array.from({ length: 18 }, (_, i) => {
    const halfWidth = 8 - i * 0.45;
    const floor = Math.exp(-64 / 24);
    const alpha = (d: number) => 0.64 * (Math.exp(-(d * d) / 24) - floor) / (1 - floor);
    const opacity = i === 0 ? alpha(halfWidth) :
      (alpha(halfWidth) - alpha(halfWidth + 0.45)) / (1 - alpha(halfWidth + 0.45));
    return { inset: 8.4, width: halfWidth * 2, opacity };
  }),
  // Tangent-aligned elliptical fields overlap to follow the curved inner face.
  // No hard-edged lens paths: intensity fades across AND along each reflection.
  specular: [
    ...arcLight('ice-spec', 61, 50, 216, 265, 236, 10.5, '#F2FCFF', 0.8, 4.1),
    ...arcLight('warm-spec', 399, 52, 279, 330, 302, 11, '#FFF9E9', 0.82, 4.1),
    ...arcLight('lower-left', 61, 53.5, 100, 142, 115.5, 9, '#FFF7E9', 0.94, 3.1),
    ...arcLight('lower-right', 399, 53.8, 38, 86, 65, 10, '#FFF6F0', 0.86, 3.0),
  ],
  lights: [
    { name: 'ice', cx: 37, cy: 18, rx: 79, ry: 54, color: '#D7F4FF', strength: 0.98 },
    { name: 'champagne', cx: 422, cy: 23, rx: 67, ry: 53, color: '#FFE9C7', strength: 0.97 },
    { name: 'mint', cx: 27, cy: 104, rx: 62, ry: 43, color: '#D9E8C3', strength: 0.97 },
    { name: 'pearl', cx: 421, cy: 109, rx: 70, ry: 31, color: '#F7DCE4', strength: 0.92 },
  ],
} as const;

type Props = { id: string };

/**
 * Closed capsule strokes with radial falloff: there are no open highlight ends.
 * No SVG filters, bitmap textures or offscreen masks. All strokes fit the viewport.
 * Uses the host's unique useId prefix; never shares gradient IDs across buttons.
 */
export function RegisterButtonMaterial({ id }: Props) {
  const m = REGISTER_MATERIAL;
  const key = (name: string) => `${id}-register-${name}`;
  const url = (name: string) => `url(#${key(name)})`;
  const capsule = (inset: number) => ({
    x: inset, y: inset,
    width: m.width - inset * 2, height: m.height - inset * 2,
    rx: m.height / 2 - inset,
  });

  return <G>
    <Defs>
      <LinearGradient id={key('body')} x1={0} y1={0} x2={0} y2={122} gradientUnits="userSpaceOnUse">
        <Stop offset={0} stopColor={m.baseTop} stopOpacity={0.72} />
        <Stop offset={0.22} stopColor="#252E33" stopOpacity={0.86} />
        <Stop offset={0.53} stopColor={m.baseMiddle} stopOpacity={0.9} />
        <Stop offset={0.81} stopColor="#222C32" stopOpacity={0.87} />
        <Stop offset={1} stopColor={m.baseBottom} stopOpacity={0.85} />
      </LinearGradient>
      <LinearGradient id={key('rim')} x1={0} y1={0} x2={460} y2={122} gradientUnits="userSpaceOnUse">
        <Stop offset={0} stopColor="#C9E8F4" stopOpacity={0.88} />
        <Stop offset={0.23} stopColor="#95ADB7" stopOpacity={0.73} />
        <Stop offset={0.50} stopColor="#B4B6B3" stopOpacity={0.55} />
        <Stop offset={0.78} stopColor="#DAD4BE" stopOpacity={0.65} />
        <Stop offset={1} stopColor="#B9B0BC" stopOpacity={0.66} />
      </LinearGradient>
      <LinearGradient id={key('bevel')} x1={0} y1={0} x2={0} y2={122} gradientUnits="userSpaceOnUse">
        <Stop offset={0} stopColor="#D1DFE4" stopOpacity={0.72} />
        <Stop offset={0.24} stopColor="#68828E" stopOpacity={0.2} />
        <Stop offset={0.55} stopColor="#68828E" stopOpacity={0.1} />
        <Stop offset={0.88} stopColor="#98ACB5" stopOpacity={0.33} />
        <Stop offset={1} stopColor="#AFC7D6" stopOpacity={0.63} />
      </LinearGradient>
      <LinearGradient id={key('diffusion')} x1={0} y1={0} x2={0} y2={122} gradientUnits="userSpaceOnUse">
        <Stop offset={0} stopColor="#C9DCE5" stopOpacity={0.07} />
        <Stop offset={0.14} stopColor="#B5CEDA" stopOpacity={0.03} />
        <Stop offset={0.45} stopColor="#B5CEDA" stopOpacity={0} />
        <Stop offset={0.7} stopColor="#B5CEDA" stopOpacity={0} />
        <Stop offset={1} stopColor="#A6C2D3" stopOpacity={0.06} />
      </LinearGradient>
      {m.lights.map(light => <RadialGradient key={light.name} id={key(light.name)}
        cx={light.cx} cy={light.cy} fx={light.cx} fy={light.cy} rx={light.rx} ry={light.ry}
        gradientUnits="userSpaceOnUse">
        <Stop offset={0} stopColor={light.color} stopOpacity={light.strength} />
        <Stop offset={0.25} stopColor={light.color} stopOpacity={light.strength * 0.83} />
        <Stop offset={0.55} stopColor={light.color} stopOpacity={light.strength * 0.32} />
        <Stop offset={0.8} stopColor={light.color} stopOpacity={light.strength * 0.065} />
        <Stop offset={1} stopColor={light.color} stopOpacity={0} />
      </RadialGradient>)}
      <RadialGradient id={key('scatter-ice')} cx={34} cy={24} fx={34} fy={24} rx={54} ry={45} gradientUnits="userSpaceOnUse">
        <Stop offset={0} stopColor="#CCE5EE" stopOpacity={0.24} />
        <Stop offset={0.4} stopColor="#CCE5EE" stopOpacity={0.10} />
        <Stop offset={1} stopColor="#CCE5EE" stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id={key('scatter-mint')} cx={29} cy={95} fx={29} fy={95} rx={29} ry={21} gradientUnits="userSpaceOnUse">
        <Stop offset={0} stopColor="#DFD1A6" stopOpacity={0.45} />
        <Stop offset={0.35} stopColor="#DED7B9" stopOpacity={0.23} />
        <Stop offset={1} stopColor="#C9DEBE" stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id={key('scatter-warm')} cx={426} cy={31} fx={426} fy={31} rx={44} ry={43} gradientUnits="userSpaceOnUse">
        <Stop offset={0} stopColor="#EADBBE" stopOpacity={0.24} />
        <Stop offset={0.4} stopColor="#EADBBE" stopOpacity={0.10} />
        <Stop offset={1} stopColor="#EADBBE" stopOpacity={0} />
      </RadialGradient>
      {m.specular.map(light => <RadialGradient key={light.name} id={key(light.name)}
        cx={0} cy={0} fx={0} fy={0} rx={light.rx} ry={light.ry} gradientUnits="userSpaceOnUse">
        <Stop offset={0} stopColor={light.color} stopOpacity={light.strength} />
        <Stop offset={0.25} stopColor={light.color} stopOpacity={light.strength * 0.72} />
        <Stop offset={0.5} stopColor={light.color} stopOpacity={light.strength * 0.27} />
        <Stop offset={0.8} stopColor={light.color} stopOpacity={light.strength * 0.035} />
        <Stop offset={1} stopColor={light.color} stopOpacity={0} />
      </RadialGradient>)}
    </Defs>

    <Rect {...capsule(1)} fill={url('body')} />
    <Rect {...capsule(1)} fill={url('scatter-ice')} />
    <Rect {...capsule(1)} fill={url('scatter-warm')} />
    <Rect {...capsule(1)} fill={url('scatter-mint')} />
    <Rect {...capsule(1)} fill={url('diffusion')} />
    <Rect {...capsule(m.grooveInset)} fill="none" stroke={m.grooveColor}
      strokeWidth={m.grooveStroke} opacity={0.26} />
    <Rect {...capsule(m.outerInset)} fill="none" stroke={url('rim')} strokeWidth={m.outerStroke} />
    <Rect {...capsule(m.bevelInset)} fill="none" stroke={url('bevel')} strokeWidth={m.bevelStroke} />

    {m.lights.map(light => <G key={light.name}>
      {m.glowBands.map(band => <Rect key={band.width} {...capsule(band.inset)}
        fill="none" stroke={url(light.name)} strokeWidth={band.width} opacity={band.opacity} />)}
      <Rect {...capsule(m.outerInset)} fill="none" stroke={url(light.name)} strokeWidth={m.outerStroke} opacity={0.55} />
      <Rect {...capsule(m.bevelInset)} fill="none" stroke={url(light.name)} strokeWidth={1.7} />
    </G>)}

    {m.specular.map(light => <G key={light.name} transform={`translate(${light.x} ${light.y}) rotate(${light.angle})`}>
      <Rect x={-light.rx} y={-light.ry} width={2 * light.rx} height={2 * light.ry} fill={url(light.name)} />
    </G>)}
  </G>;
}
