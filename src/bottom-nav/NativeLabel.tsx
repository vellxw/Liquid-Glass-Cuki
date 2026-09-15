import { memo, useCallback, useState } from 'react';
import { Platform, StyleSheet, Text, type TextProps } from 'react-native';
import { COLORS, DESIGN } from './tokens';

type TextLayoutEvent = Parameters<NonNullable<TextProps['onTextLayout']>>[0];

type Props = {
  text: string;
  center: number;
  scale: number;
  selected: boolean;
  fontFamily?: string;
};

/** Align the baseline from native font metrics instead of assuming iOS/Android padding. */
export const NativeLabel = memo(function NativeLabel({ text, center, scale, selected, fontFamily }: Props) {
  const fontSize = (text === 'Hoy' ? 58 : DESIGN.label.fontSize) * scale;
  const baseline = (DESIGN.label.baseline - DESIGN.hitTop) * scale;
  const [ascentRatio, setAscentRatio] = useState(0.94);
  const onTextLayout = useCallback((event: TextLayoutEvent) => {
    const line = event.nativeEvent.lines[0];
    if (!line || fontSize <= 0) return;
    const ratio = (line.y + line.ascender) / fontSize;
    if (Number.isFinite(ratio) && ratio > 0 && ratio < 2) {
      setAscentRatio(old => Math.abs(old - ratio) > 0.002 ? ratio : old);
    }
  }, [fontSize]);

  return (
    <Text
      accessible={false}
      allowFontScaling={false}
      numberOfLines={1}
      onTextLayout={onTextLayout}
      style={[
        styles.label,
        {
          left: center - 160 * scale,
          top: baseline - ascentRatio * fontSize,
          width: 320 * scale,
          fontSize,
          lineHeight: DESIGN.label.lineHeight * scale,
          letterSpacing: DESIGN.label.letterSpacing * scale,
          fontFamily: fontFamily ?? Platform.select({ ios: 'Arial', android: 'sans-serif' }),
          color: selected ? COLORS.activeText : COLORS.inactiveText,
        },
      ]}
    >
      {text}
    </Text>
  );
});

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
    padding: 0,
    margin: 0,
    textAlign: 'center',
    fontWeight: '400',
    includeFontPadding: false,
    writingDirection: 'ltr',
  },
});
