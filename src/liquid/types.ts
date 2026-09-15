import type { SharedValue } from 'react-native-reanimated';
export type LiquidHaptics = 'off' | 'commit' | 'contact-and-commit';
export type LiquidPhase = 'contact' | 'commit' | 'cancel' | 'settled';
export type LiquidEvent = { phase: LiquidPhase; interactionId: number; timestamp: number };
export type LiquidPhysics = {
  /** The ONLY recovering coordinate. Geometry and optics derive from this scalar. */
  pressure: SharedValue<number>;
  contactX: SharedValue<number>;
  contactY: SharedValue<number>;
  velocityX: SharedValue<number>;
  velocityY: SharedValue<number>;
  releaseX: SharedValue<number>;
  releaseY: SharedValue<number>;
  active: SharedValue<boolean>;
  reduceMotion: SharedValue<boolean>;
  width: number;
  height: number;
  intensity: number;
};
