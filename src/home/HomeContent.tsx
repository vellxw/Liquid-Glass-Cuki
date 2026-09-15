import { View } from 'react-native';
import { HomeHeader } from './HomeHeader';
import { NutritionSection } from './NutritionSection';
import { PlantProgress } from './PlantProgress';
import { PrimaryRegisterButton } from './PrimaryRegisterButton';
import { NextWorkoutCard } from './NextWorkoutCard';
import { sceneStyle } from './layout';
import { INK } from './tokens';
import type { HomeAssets, HomeSectionProps } from './types';
export type HomeContentProps = HomeSectionProps & {
  width: number; height: number; assets?: HomeAssets;
  onRegister?: () => void; onOpenRoutine?: () => void;
  onOpenNutrition?: () => void; onAvatarPress?: () => void;
};
export function HomeContent({ width, height, assets, onRegister, onOpenRoutine,
  onOpenNutrition, onAvatarPress, ...shared }: HomeContentProps) {
  return <View style={{ width, height, position: 'relative' }} testID="home-content">
    <HomeHeader {...shared} assets={assets} onAvatarPress={onAvatarPress} />
    <NutritionSection {...shared} onOpenNutrition={onOpenNutrition} />
    <PlantProgress {...shared} />
    <PrimaryRegisterButton {...shared} onRegister={onRegister} />
    <View pointerEvents="none" style={[sceneStyle({ x: 41, y: 979, width: 666, height: 1 }, shared.scale),
      { backgroundColor: INK.divider, opacity: 0.55 }]} />
    <NextWorkoutCard {...shared} onOpenRoutine={onOpenRoutine} />
  </View>;
}
