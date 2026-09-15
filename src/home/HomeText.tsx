import { useCallback, useState } from 'react';
import { Platform, Text, type TextProps, type TextStyle } from 'react-native';
import { HOME_REFERENCE, INK, PX } from './tokens';
type Props = {
  children: string; x: number; baseline: number; width: number; size: number;
  scale: number; color?: string; weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign']; fontFamily?: string;
};
type LayoutEvent = Parameters<NonNullable<TextProps['onTextLayout']>>[0];
/** Baselines use real native font metrics; no SVG text in the app. */
export function HomeText({ children, x, baseline, width, size, scale,
  color = INK.text, weight = '400', align = 'left', fontFamily }: Props) {
  const s = PX * scale, fontSize = size * s;
  const [ascent, setAscent] = useState(0.94);
  const measure = useCallback((event: LayoutEvent) => {
    const line = event.nativeEvent.lines[0];
    if (!line || fontSize <= 0) return;
    const ratio = (line.y + line.ascender) / fontSize;
    if (Number.isFinite(ratio) && ratio > 0 && ratio < 2) {
      setAscent(old => Math.abs(old - ratio) > 0.002 ? ratio : old);
    }
  }, [fontSize]);
  return <Text allowFontScaling={false} numberOfLines={1} onTextLayout={measure}
    style={{ position: 'absolute', left: x * s,
      top: (baseline - HOME_REFERENCE.bodyTop) * s - ascent * fontSize,
      width: width * s, fontSize, lineHeight: fontSize * 1.2, fontWeight: weight,
      textAlign: align, color, padding: 0, margin: 0, includeFontPadding: false,
      fontFamily: fontFamily ?? Platform.select({ ios: 'Arial', android: 'sans-serif' }),
    }}>{children}</Text>;
}
