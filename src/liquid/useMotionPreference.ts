import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion, useSharedValue } from 'react-native-reanimated';

/** Immediate startup setting plus live native changes. Force-reduced may enable
 * accessibility in the QA lab but may NEVER disable a system preference.
 */
export function useMotionPreference(forceReduced = false) {
  const initial = useReducedMotion();
  const reduceMotion = useSharedValue(initial || forceReduced);
  useEffect(() => {
    let alive = true;
    let version = 0;
    const update = (enabled: boolean) => {
      version++;
      if (alive) reduceMotion.value = enabled || forceReduced;
    };
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', update);
    const queriedAt = version;
    void AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (alive && version === queriedAt) update(enabled);
    }).catch(() => { /* Keep the conservative startup value. */ });
    return () => { alive = false; subscription.remove(); };
  }, [forceReduced, reduceMotion]);
  return reduceMotion;
}
