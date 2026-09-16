import { View } from 'react-native';
import { Host, Button, HStack, RNHostView } from '@expo/ui/swift-ui';
import {
  accessibilityIdentifier, accessibilityLabel, accessibilityValue,
  buttonStyle, contentShape, disabled as disabledModifier, frame, opacity, shapes,
} from '@expo/ui/swift-ui/modifiers';
import { useGlassButtonArtwork } from '../home/GlassButtonArtwork';
import { getButtonSize, type RegisterActionButtonProps } from './types';

/** Real SwiftUI Button, original CUKI appearance. Plain is deliberate: the system
 * glass style REPLACES our skin. Apple retains the button interaction, while the
 * label contains the exact native SVG/blur/Text used by the approved component.
 * No nested Pressable, screenshots, custom physics or per-frame JS updates. */
export function RegisterActionButton({
  scale, label = 'Registrar +', onPress, disabled = false, busy = false,
  style, testID = 'register-action', fontFamily, blurTarget,
}: RegisterActionButtonProps) {
  const { width, height } = getButtonSize(scale);
  const blocked = disabled || busy || !onPress;
  const artwork = useGlassButtonArtwork({ variant: 'primary', label, scale, fontFamily, blurTarget });
  return (
    <Host style={[{ width, height }, style]} colorScheme="dark" ignoreSafeArea="all">
      <Button
        onPress={() => { if (!blocked) onPress?.(); }}
        modifiers={[
          buttonStyle('plain'),
          disabledModifier(blocked),
          opacity(blocked ? 0.45 : 1),
          accessibilityIdentifier(testID),
          accessibilityLabel(label),
          accessibilityValue(busy ? 'Ocupado' : ''),
        ]}
      >
        <HStack spacing={0} modifiers={[frame({ width, height }), contentShape(shapes.capsule())]}>
          <RNHostView matchContents>
            <View pointerEvents="none" accessible={false} accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants" style={{ width, height }}>
              {artwork}
            </View>
          </RNHostView>
        </HStack>
      </Button>
    </Host>
  );
}
