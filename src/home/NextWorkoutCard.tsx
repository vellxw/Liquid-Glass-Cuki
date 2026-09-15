import { View } from 'react-native';
import { HomeText } from './HomeText';
import { HomeIcon, type HomeIconName } from './HomeIcon';
import { GlassButton } from './GlassButton';
import { BOX, COPY, INK, PX } from './tokens';
import { sceneStyle } from './layout';
import type { HomeSectionProps } from './types';
export function NextWorkoutCard({ scale, fontFamily, blurTarget, onOpenRoutine }: HomeSectionProps & { onOpenRoutine?: () => void }) {
  const s = PX * scale, text = { scale, fontFamily };
  const icon = (name: HomeIconName, x: number, y: number, width: number, height = width) =>
    <View pointerEvents="none" style={sceneStyle({ x, y, width, height }, scale)}>
      <HomeIcon name={name} width={width*s} height={height*s} color={INK.muted} />
    </View>;
  return <>
    {icon('dumbbell', 43, 1020, 36, 34)}
    <HomeText {...text} x={108} baseline={1045} width={430} size={20} color={INK.muted}>{COPY.next}</HomeText>
    <HomeText {...text} x={40} baseline={1109} width={555} size={42} weight="600">{COPY.workout}</HomeText>
    {icon('clock', 42, 1143, 33)}
    <HomeText {...text} x={90} baseline={1168} width={82} size={22}>{COPY.time}</HomeText>
    <View style={[sceneStyle({ x: 169, y: 1144, width: 1, height: 32 }, scale), { backgroundColor: INK.divider }]} />
    {icon('list', 194, 1143, 35, 33)}
    <HomeText {...text} x={243} baseline={1168} width={190} size={22}>{COPY.exercises}</HomeText>
    <GlassButton variant="secondary" label={COPY.routine} scale={scale} fontFamily={fontFamily}
      blurTarget={blurTarget} onPress={onOpenRoutine} style={sceneStyle(BOX.routine, scale)} testID="home-routine" />
    {COPY.discipline.map((line, i) => <HomeText {...text} key={line} x={592} baseline={1226 + i * 24}
      width={152} size={20} color={INK.quiet}>{line}</HomeText>)}
  </>;
}
