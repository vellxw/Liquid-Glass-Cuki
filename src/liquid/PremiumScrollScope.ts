import { createContext, useContext } from 'react';
import type { NativeGesture } from 'react-native-gesture-handler';
/** Optional parent native-scroll relation. No JS callbacks on every movement. */
export type PremiumScrollScope = {
  gesture: NativeGesture;
  enabled: boolean;
  resourceRevision: unknown;
};
export const PremiumScrollContext = createContext<PremiumScrollScope|null>(null);
export const usePremiumScroll = () => useContext(PremiumScrollContext);
