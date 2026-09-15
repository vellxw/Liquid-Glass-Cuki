import { GlassButton } from './GlassButton';
import { sceneStyle } from './layout';
import { BOX, COPY, PX } from './tokens';
import { LiquidPressable } from '../liquid/LiquidPressable';
import type { HomeSectionProps } from './types';

/** Phase A only: the shared secondary button and the entire navbar remain static. */
export function PrimaryRegisterButton({ scale, fontFamily, blurTarget, onRegister }: HomeSectionProps & { onRegister?: () => void }) {
  return <LiquidPressable width={460*PX*scale} height={122*PX*scale} label={COPY.register}
    onPress={onRegister} style={sceneStyle(BOX.register, scale)} testID="home-register">
    {physics => <GlassButton variant="primary" label={COPY.register} scale={scale} fontFamily={fontFamily}
      blurTarget={blurTarget} interaction={physics} contentFollow />}
  </LiquidPressable>;
}
