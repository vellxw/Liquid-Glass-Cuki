import type { RefObject } from 'react';
import type { ImageSourcePropType, View } from 'react-native';
export type HomeAssets = {
  backgroundImage?: ImageSourcePropType;
  heroPlantImage?: ImageSourcePropType;
  workoutImage?: ImageSourcePropType;
  avatarImage?: ImageSourcePropType;
};
export type HomeSectionProps = {
  scale: number;
  fontFamily?: string;
  blurTarget?: RefObject<View | null>;
};
