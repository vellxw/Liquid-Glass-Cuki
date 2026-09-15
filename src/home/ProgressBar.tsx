import { useId } from 'react';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { clampFraction } from './CaloriesRing';
export function ProgressBar({ width, height, fraction, start, end = start, track = '#303B40' }: {
  width: number; height: number; fraction: number; start: string; end?: string; track?: string;
}) {
  const id = `progress${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const fill = width * clampFraction(fraction);
  return <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
    <Defs><LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
      <Stop stopColor={start} /><Stop offset="1" stopColor={end} />
    </LinearGradient></Defs>
    <Rect width={width} height={height} rx={height/2} fill={track} />
    {fill > 0 && <Rect width={fill} height={height} rx={Math.min(height/2, fill/2)} fill={`url(#${id})`} />}
  </Svg>;
}
