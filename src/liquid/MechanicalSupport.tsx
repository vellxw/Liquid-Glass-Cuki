import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { MECHANICAL_PRESS } from './physics';
import type { LiquidPhysics } from './types';
/** Opt-in whole-piece compliance from the attached brief. Input hit area stays fixed.
 * No independent timer/spring: this pose derives from the SAME local pressure scalar. */
export function MechanicalSupport({physics,enabled,children}:{physics:LiquidPhysics;enabled:boolean;children:ReactNode}) {
  const pose=useAnimatedStyle(()=>{
    const p=enabled?Math.max(0,Math.min(1,physics.pressure.value)):0;
    const reduced=physics.reduceMotion.value;
    return {transform:[{translateY:p*(reduced?MECHANICAL_PRESS.reducedTravel:MECHANICAL_PRESS.travel)},
      {scale:1+p*((reduced?MECHANICAL_PRESS.reducedScale:MECHANICAL_PRESS.scale)-1)}]};
  },[enabled]);
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,pose]}>{children}</Animated.View>;
}
