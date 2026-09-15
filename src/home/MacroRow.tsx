import { View } from 'react-native';
import { HomeText } from './HomeText';
import { ProgressBar } from './ProgressBar';
import { sceneStyle } from './layout';
import { INK, PX } from './tokens';
import type { HomeSectionProps } from './types';
const MACROS = [
  { letter: 'P', value: '108 g', color: INK.mint, fraction: 0.48 },
  { letter: 'C', value: '184 g', color: INK.purple, fraction: 0.52 },
  { letter: 'G', value: '49 g', color: INK.peach, fraction: 0.48 },
] as const;
export function MacroRow({ scale, fontFamily }: HomeSectionProps) {
  const s = PX * scale;
  return <>{MACROS.map((macro, i) => {
    const x = 29 + 115 * i;
    return <View key={macro.letter} pointerEvents="box-none">
      <HomeText x={x} baseline={719} width={20} size={22} scale={scale} fontFamily={fontFamily} color={INK.muted}>{macro.letter}</HomeText>
      <HomeText x={x + 22} baseline={719} width={68} size={22} scale={scale} fontFamily={fontFamily}>{macro.value}</HomeText>
      <View style={sceneStyle({ x, y: 735, width: 72, height: 11 }, scale)}>
        <ProgressBar width={72*s} height={11*s} fraction={macro.fraction} start={macro.color} />
      </View>
      {i < 2 && <View style={[sceneStyle({ x: x + 94, y: 697, width: 1, height: 48 }, scale), { backgroundColor: INK.divider }]} />}
    </View>;
  })}</>;
}
