import { Pressable, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useId } from 'react';
import { BOX, COPY, INK, PX } from './tokens';
import { sceneStyle } from './layout';
import { HomeText } from './HomeText';
import { PhotoSlot } from './PhotoSlot';
import type { HomeAssets, HomeSectionProps } from './types';
export function HomeHeader({ scale, fontFamily, assets, onAvatarPress }: HomeSectionProps & {
  assets?: HomeAssets; onAvatarPress?: () => void;
}) {
  const s = PX * scale, id = `avatar${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const text = { scale, fontFamily };
  return <>
    <HomeText {...text} x={40} baseline={164} width={540} size={48}>{COPY.greeting}</HomeText>
    <HomeText {...text} x={40} baseline={222} width={540} size={60} weight="600" color={INK.name}>{COPY.name}</HomeText>
    {COPY.motto.map((line, i) => <HomeText {...text} key={line} x={41} baseline={273 + i * 28} width={560} size={24} color={INK.muted}>{line}</HomeText>)}
    <Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil" testID="home-avatar" onPress={onAvatarPress}
      style={({ pressed }) => [sceneStyle(BOX.avatar, scale), { opacity: pressed ? 0.75 : 1 }]}
      hitSlop={4}>
      <View style={{ borderRadius: 42 * s, overflow: 'hidden' }}>
        <PhotoSlot name="avatarImage" source={assets?.avatarImage} width={84 * s} height={84 * s} />
      </View>
      <Svg pointerEvents="none" width={84 * s} height={84 * s} viewBox="0 0 84 84" style={{ position: 'absolute' }}>
        <Defs><LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop stopColor="#F2FFFF" /><Stop offset="1" stopColor="#5E737D" />
        </LinearGradient></Defs><Circle cx="42" cy="42" r="41" fill="none" stroke={`url(#${id})`} strokeWidth="1.7" />
      </Svg>
    </Pressable>
  </>;
}
