import { VOLUME_SKSL } from './volumeShader';

/** Preserve the approved field/math. Reorder exact independent rejections and share
 * an identical substrate lookup. Compile once, not during a contact. Baseline stays
 * available for on-device A/B, not as a second implementation to drift over time. */
export function optimizeVolumeShader(source:string):string {
  const test=`  float2 d=p-touch;\n  float q=dot(d,d)/(radius*radius);\n  if(q>=2.25) return half4(0.0);`;
  if(!source.includes(test)) throw new Error('Approved shader changed; revalidate optimization');
  return source.replace(test,'')
    .replace('  float rr=size.y*.5;',test+'\n  float rr=size.y*.5;')
    .replace('substrate.eval(sampleAt).rgb-substrate.eval(p).rgb','substrate.eval(sampleAt).rgb-background.rgb');
}
export const OPTIMIZED_VOLUME_SKSL=optimizeVolumeShader(VOLUME_SKSL);
/** Diagnostic only: same uniforms/input cadence, transparent output. Not a product fallback. */
export const IDENTITY_VOLUME_SKSL=VOLUME_SKSL.replace('  if(pressure==0.0) return half4(0.0);','  return half4(0.0);');
