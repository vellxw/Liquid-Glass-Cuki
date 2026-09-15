import type { SharedValue } from 'react-native-reanimated';

export type LiquidHaptics = 'off' | 'commit' | 'contact-and-commit';
export type LiquidPhase = 'contact' | 'commit' | 'cancel' | 'settled';
export type LiquidEvent = { phase: LiquidPhase; interactionId: number; timestamp: number };

export type LiquidPhysics = {
  /** Authoritative UI-thread pressure, in [0,1]. */
  pressure: SharedValue<number>;
  contactX: SharedValue<number>;
  contactY: SharedValue<number>;
  reduceMotion: SharedValue<boolean>;
  width: number;
  height: number;
  intensity: number;
};
