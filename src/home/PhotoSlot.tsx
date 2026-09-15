import { useId } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { HomeAssets } from './types';
export function PhotoSlot({ name, source, width, height, style, showGuide = false }: {
  name: keyof HomeAssets; source?: ImageSourcePropType; width: number; height: number;
  style?: StyleProp<ViewStyle>; showGuide?: boolean;
}) {
  const id = `slot${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return <View testID={`asset-${name}`} pointerEvents="none"
    style={[{ width, height, overflow: 'hidden' }, style, showGuide && { borderWidth: 1, borderColor: '#425454' }]}>
    {source ? <Image source={source} resizeMode="cover" style={StyleSheet.absoluteFill} /> :
      <Svg width={width} height={height} viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs><RadialGradient id={id} cx="48%" cy="38%" rx="65%" ry="65%">
          <Stop offset="0" stopColor={name === 'avatarImage' ? '#35464E' : '#1A272B'} stopOpacity={name === 'avatarImage' ? 1 : 0.24} />
          <Stop offset="1" stopColor="#0A1214" stopOpacity={name === 'avatarImage' ? 1 : 0} />
        </RadialGradient></Defs><Rect width="100" height="100" fill={`url(#${id})`} />
      </Svg>}
  </View>;
}
