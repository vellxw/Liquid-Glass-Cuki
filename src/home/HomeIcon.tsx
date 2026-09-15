import Svg, { Circle, G, Path } from 'react-native-svg';
export type HomeIconName = 'cutlery' | 'chevron' | 'leaf' | 'plus' | 'dumbbell' | 'clock' | 'list' | 'arrow';
export function HomeIcon({ name, width, height = width, color = '#EDF1F4' }: {
  name: HomeIconName; width: number; height?: number; color?: string;
}) {
  let shape;
  switch (name) {
    case 'cutlery': shape = <Path d="M5 3v11c0 5 9 5 9 0V3M9.5 3v29M25 3c-6 4-7 9-7 17h7M25 3v29" />; break;
    case 'chevron': shape = <Path d="m11 6 10 11-10 11" />; break;
    case 'leaf': shape = <Path fill={color} stroke="none" d="M3 29C5 10 14 4 31 3c-1 16-8 24-24 24L22 11 4 30Z" />; break;
    case 'plus': shape = <Path d="M17 5v24M5 17h24" />; break;
    case 'dumbbell': shape = <Path d="M5 3h5v28H5v-7H1V10h4ZM24 3h5v7h4v14h-4v7h-5ZM14 17h6" />; break;
    case 'clock': shape = <><Circle cx="17" cy="17" r="15" /><Path d="M17 7v11l7 5" /></>; break;
    case 'list': shape = <><Path d="M13 6h20M13 17h20M13 28h20" />{[6,17,28].map(cy => <Circle key={cy} cx="4" cy={cy} r="1.5" fill={color} />)}</>; break;
    case 'arrow': shape = <Path d="M3 17h27M20 7l10 10-10 10" />; break;
  }
  return <Svg width={width} height={height} viewBox="0 0 34 34">
    <G fill="none" stroke={color} strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">{shape}</G>
  </Svg>;
}
