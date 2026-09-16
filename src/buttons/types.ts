import type { RefObject } from 'react';
import type { StyleProp, View, ViewStyle } from 'react-native';

export type RegisterActionButtonProps = {
  scale: number;
  label?: string;
  onPress?: () => void;
  disabled?: boolean;
  busy?: boolean;
  fontFamily?: string;
  blurTarget?: RefObject<View | null>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function getButtonSize(scale: number) {
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error('RegisterActionButton requires a finite positive scale');
  }
  return { width: 230 * scale, height: 61 * scale };
}
