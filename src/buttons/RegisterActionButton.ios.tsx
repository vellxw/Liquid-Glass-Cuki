import { Platform } from 'react-native';
import { Host, Button, HStack, Image, Text, ProgressView } from '@expo/ui/swift-ui';
import {
  accessibilityIdentifier, accessibilityLabel, accessibilityValue,
  buttonBorderShape, buttonStyle, controlSize, disabled as disabledModifier,
  font, foregroundStyle, frame, lineLimit, minimumScaleFactor,
} from '@expo/ui/swift-ui/modifiers';
import { getButtonSize, type RegisterActionButtonProps } from './types';

/** An actual SwiftUI Button. Apple owns its input, highlighted state, material,
 * recovery and accessibility. No nested Pressable or custom pressure simulation.
 * iOS 26+: system glass button style. Earlier iOS: system bordered button.
 */
export function RegisterActionButton({
  scale, label = 'Registrar +', onPress, disabled = false, busy = false,
  style, testID = 'register-action', fontFamily,
}: RegisterActionButtonProps) {
  const { width, height } = getButtonSize(scale);
  const blocked = disabled || busy || !onPress;
  const hasSystemGlass = Number.parseInt(String(Platform.Version), 10) >= 26;
  return (
    <Host style={[{ width, height }, style]} colorScheme="dark" ignoreSafeArea="all">
      <Button
        onPress={() => { if (!blocked) onPress?.(); }}
        modifiers={[
          buttonStyle(hasSystemGlass ? 'glass' : 'bordered'),
          buttonBorderShape('capsule'),
          controlSize('large'),
          disabledModifier(blocked),
          accessibilityIdentifier(testID),
          accessibilityLabel(label),
          accessibilityValue(busy ? 'Ocupado' : ''),
        ]}
      >
        <HStack spacing={14 * scale} modifiers={[
          frame({ width: Math.max(1, width - 36), height: Math.max(24, height - 24) }),
          foregroundStyle('#F5F7F8'),
        ]}>
          {busy ? <ProgressView /> : <Image systemName="plus.circle" size={30 * scale} />}
          <Text modifiers={[
            font({ size: 17 * scale, weight: 'semibold', ...(fontFamily ? { family: fontFamily } : {}) }),
            lineLimit(1), minimumScaleFactor(0.8),
          ]}>{label}</Text>
        </HStack>
      </Button>
    </Host>
  );
}
