import { GlassButton } from './GlassButton';
import { sceneStyle } from './layout';
import { BOX, COPY } from './tokens';
import type { HomeSectionProps } from './types';
export function PrimaryRegisterButton({ scale, fontFamily, blurTarget, onRegister }: HomeSectionProps & { onRegister?: () => void }) {
  return <GlassButton variant="primary" label={COPY.register} scale={scale} fontFamily={fontFamily}
    blurTarget={blurTarget} onPress={onRegister} style={sceneStyle(BOX.register, scale)} testID="home-register" />;
}
