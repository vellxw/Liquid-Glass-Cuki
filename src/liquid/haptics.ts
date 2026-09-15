import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PRESS } from './physics';
import type { LiquidHaptics } from './types';

/** RN-thread only. Native haptics are asynchronous and their hardware latency is not
 * measurable here. Stale events are dropped, not replayed after a blocked JS thread.
 */
export function createHapticGate() {
  let last = -Infinity;
  return (phase: 'contact' | 'commit', eventTime: number, mode: LiquidHaptics) => {
    if (mode === 'off' || (phase === 'contact' && mode === 'commit')) return;
    const now = Date.now();
    if (now-eventTime > PRESS.staleHapticMs || now-last < PRESS.hapticSeparationMs) return;
    last = now;
    try {
      const promise = Platform.OS === 'android'
        ? Haptics.performAndroidHapticsAsync(phase === 'contact' ? Haptics.AndroidHaptics.Segment_Frequent_Tick : Haptics.AndroidHaptics.Virtual_Key)
        : Platform.OS === 'ios'
          ? Haptics.impactAsync(phase === 'contact' ? Haptics.ImpactFeedbackStyle.Soft : Haptics.ImpactFeedbackStyle.Light)
          : Promise.resolve();
      void promise.catch(() => { /* Missing/disabled hardware must never block the action. */ });
    } catch { /* Unsupported platform/native module: keep the input functional. */ }
  };
}
