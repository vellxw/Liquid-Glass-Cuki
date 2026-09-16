import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { GLASS, PX } from './tokens';
import { useGlassButtonArtwork, type GlassArtworkProps } from './GlassButtonArtwork';

export type GlassButtonProps = GlassArtworkProps & {
  onPress?: () => void; disabled?: boolean; busy?: boolean;
  style?: StyleProp<ViewStyle>; testID?: string;
};
/** Ordinary button semantics; both variants retain their original passive artwork. */
export function GlassButton({ variant, label, scale, onPress, disabled = false,
  fontFamily, blurTarget, style, testID, busy = false }: GlassButtonProps) {
  const primary = variant === 'primary', w = primary ? 460 : 297, h = primary ? 122 : 79;
  const s = PX * scale, radius = h * s / 2;
  const artwork = useGlassButtonArtwork({ variant, label, scale, fontFamily, blurTarget });
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy} onPress={onPress}
    style={({ pressed }) => [{ width: w*s, height: h*s, borderRadius: radius }, style,
      { opacity: disabled || busy ? 0.45 : pressed ? GLASS.pressedOpacity : 1 }]}>{artwork}</Pressable>;
}
