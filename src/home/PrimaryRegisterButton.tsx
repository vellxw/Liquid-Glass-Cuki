import { RegisterActionButton } from '../buttons/RegisterActionButton';
import { sceneStyle } from './layout';
import { BOX, COPY } from './tokens';
import type { HomeSectionProps } from './types';

export function PrimaryRegisterButton({ scale, fontFamily, blurTarget, onRegister }:
  HomeSectionProps & { onRegister?: () => void }) {
  return <RegisterActionButton scale={scale} label={COPY.register}
    fontFamily={fontFamily} blurTarget={blurTarget} onPress={onRegister}
    style={sceneStyle(BOX.register, scale)} testID="home-register" />;
}
