import { GlassButton } from '../home/GlassButton';
import { getButtonSize, type RegisterActionButtonProps } from './types';

/** Android/default: ordinary React Native button semantics over static glass.
 * No pan recognizer, local pressure, timeline, texture cache or custom spring.
 * iOS resolves RegisterActionButton.ios.tsx instead of loading this fallback.
 */
export function RegisterActionButton({
  scale, label = 'Registrar +', onPress, disabled = false, busy = false, ...rest
}: RegisterActionButtonProps) {
  getButtonSize(scale);
  const blocked = disabled || busy || !onPress;
  return <GlassButton {...rest} variant="primary" label={label} scale={scale}
    disabled={blocked} busy={busy}
    onPress={() => { if (!blocked) onPress?.(); }} />;
}
