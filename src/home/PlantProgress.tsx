import { View } from 'react-native';
import { HomeIcon } from './HomeIcon';
import { HomeText } from './HomeText';
import { ProgressBar } from './ProgressBar';
import { COPY, HOME_DATA, INK, PX } from './tokens';
import { sceneStyle } from './layout';
import type { HomeSectionProps } from './types';
export function PlantProgress({ scale, fontFamily }: HomeSectionProps) {
  const s = PX * scale, text = { scale, fontFamily };
  return <>
    <View pointerEvents="none" style={sceneStyle({ x: 410, y: 570, width: 34, height: 34 }, scale)}>
      <HomeIcon name="leaf" width={34*s} color="#7DDB92" />
    </View>
    <HomeText {...text} x={462} baseline={598} width={236} size={22}>{COPY.plant}</HomeText>
    <HomeText {...text} x={412} baseline={642} width={300} size={22} color={INK.muted}>{COPY.week}</HomeText>
    <View style={sceneStyle({ x: 412, y: 669, width: 294, height: 17 }, scale)}>
      <ProgressBar width={294*s} height={17*s} fraction={HOME_DATA.plantFraction} start="#A2F8C5" end="#76D58B" />
    </View>
    {COPY.plantNote.map((line, i) => <HomeText {...text} key={line} x={411} baseline={724+i*26} width={322} size={20} color={INK.muted}>{line}</HomeText>)}
  </>;
}
