import { View } from 'react-native';
import { BottomNavGlass, type BottomNavGlassProps } from './BottomNavGlass';
import { DESIGN, REFERENCE } from './tokens';

export type ReferenceFrameProps = Omit<BottomNavGlassProps, 'width' | 'style'> & {
  width: number;
};

/** The original 2048 × 684 composition, reconstructed entirely with native UI. */
export function ReferenceFrame({ width, ...props }: ReferenceFrameProps) {
  const scale = width / REFERENCE.width;
  return (
    <View style={{ width, height: REFERENCE.height * scale, backgroundColor: '#000000' }}>
      <BottomNavGlass
        {...props}
        width={DESIGN.width * scale}
        style={{ position: 'absolute', left: REFERENCE.barX * scale, top: REFERENCE.barY * scale }}
      />
    </View>
  );
}
