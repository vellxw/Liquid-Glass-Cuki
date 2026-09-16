import { VOLUME_SKSL } from './volumeShader';
/** Same geometric mapping. Only reuse an identical source sample. */
export function optimizeVolumeShader(source:string):string {
  const sample='substrate.eval(sampleAt).rgb-substrate.eval(p).rgb';
  if(!source.includes(sample))throw new Error('Face shader changed: revalidate sample reuse');
  return source.replace(sample,'substrate.eval(sampleAt).rgb-background.rgb');
}
export const OPTIMIZED_VOLUME_SKSL=optimizeVolumeShader(VOLUME_SKSL);
/** Diagnostic only, never the product fallback. */
export const IDENTITY_VOLUME_SKSL=VOLUME_SKSL.replace('  if(pressure==0.0) return half4(0.0);','  return half4(0.0);');
