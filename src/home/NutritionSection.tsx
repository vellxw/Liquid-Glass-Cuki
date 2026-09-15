import { Pressable, View } from 'react-native';
import { CaloriesRing } from './CaloriesRing';
import { HomeIcon } from './HomeIcon';
import { HomeText } from './HomeText';
import { MacroRow } from './MacroRow';
import { COPY, PX } from './tokens';
import { sceneStyle } from './layout';
import type { HomeSectionProps } from './types';
export function NutritionSection({ scale, fontFamily, onOpenNutrition }: HomeSectionProps & { onOpenNutrition?: () => void }) {
  const s = PX * scale;
  return <>
    <View pointerEvents="none" style={sceneStyle({ x: 42, y: 358, width: 32, height: 38 }, scale)}>
      <HomeIcon name="cutlery" width={32*s} height={38*s} />
    </View>
    <HomeText x={99} baseline={388} width={210} size={22} scale={scale} fontFamily={fontFamily}>{COPY.nutrition}</HomeText>
    <View pointerEvents="none" style={sceneStyle({ x: 284, y: 368, width: 24, height: 24 }, scale)}>
      <HomeIcon name="chevron" width={24*s} />
    </View>
    <Pressable testID="home-nutrition" accessibilityRole="button" accessibilityLabel={COPY.nutrition}
      onPress={onOpenNutrition} style={sceneStyle({ x: 32, y: 336, width: 292, height: 72 }, scale)} />
    <CaloriesRing scale={scale} fontFamily={fontFamily} />
    <MacroRow scale={scale} fontFamily={fontFamily} />
  </>;
}
