import { memo } from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { COLORS, type BottomNavId } from './tokens';

export type GlassIconProps = {
  name: BottomNavId;
  width: number;
  height: number;
  color?: string;
};

// Original vectors. No icon font, external artwork or bitmap is used.
export const HOME_PATH = [
  'M 47.9 2.7 Q 52 -0.6 56.1 2.7',
  'L 100.1 41.2 Q 102 42.9 102 45.5',
  'V 97.3 Q 102 102 97.3 102 H 71.5',
  'Q 67 102 67 97.5 V 77',
  'Q 67 67 57 67 H 47 Q 37 67 37 77',
  'V 97.5 Q 37 102 32.5 102 H 6.6',
  'Q 2 102 2 97.4 V 45.5 Q 2 43 4 41.2 Z',
].join(' ');

export const CHEF_PATH = [
  'M 24.5 62',
  'C 13 61.4 5.5 53.3 5.5 42.5',
  'C 5.5 29.4 15.5 18.6 28 20.2',
  'L 32.7 21.3',
  'C 36.1 10.4 44.6 5.4 54.5 5.4',
  'C 65.9 5.4 74 11.7 77.1 22',
  'C 91.7 16.4 104.4 27.1 104.4 41.2',
  'C 104.4 53.3 97.7 60.8 86.2 62',
  'V 99.4 H 24.5 Z',
  'M 25 81.5 H 42.1',
].join(' ');

export const DUMBBELL_PATH = [
  'M 20 7 H 37 V 87 H 20 V 66 H 7 V 28 H 20 Z',
  'M 84 7 H 101 V 28 H 114 V 66 H 101 V 87 H 84 Z',
  'M 49 46 H 71',
].join(' ');

export const GlassIcon = memo(function GlassIcon({
  name, width, height, color = COLORS.inactiveIcon,
}: GlassIconProps) {
  const viewBox = name === 'hoy' ? '0 0 104 104'
    : name === 'recetas' ? '0 0 110 106'
    : name === 'registrar' ? '0 0 80 80'
    : name === 'entrenar' ? '0 0 122 94' : '0 0 79 92';

  return (
    <Svg width={width} height={height} viewBox={viewBox} accessible={false}>
      {name === 'hoy' ? (
        <G>
          <Path d={HOME_PATH} fill={color} stroke={color} strokeWidth={3} opacity={0.07} />
          <Path d={HOME_PATH} fill={color} />
        </G>
      ) : (
        <G fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
          {name === 'recetas' && <Path d={CHEF_PATH} strokeWidth={7.4} />}
          {name === 'entrenar' && <Path d={DUMBBELL_PATH} strokeWidth={7.4} />}
          {name === 'registrar' && <Path d="M 8 40 H 72 M 40 8 V 72" strokeWidth={7.5} />}
          {name === 'progreso' && (
            <Path d="M 6 50 V 86 M 39 7 V 86 M 72 25 V 86" strokeWidth={7.5} />
          )}
        </G>
      )}
    </Svg>
  );
});
