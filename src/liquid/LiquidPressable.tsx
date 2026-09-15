import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { AppState, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedReaction, useAnimatedStyle,
  useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { createHapticGate } from './haptics';
import { insideCapsule, PRESS, rigidPose, SPRINGS } from './physics';
import { useMotionPreference } from './useMotionPreference';
import type { LiquidEvent, LiquidHaptics, LiquidPhysics } from './types';

export type LiquidPressableProps = {
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  intensity?: number;
  haptics?: LiquidHaptics;
  forceReducedMotion?: boolean;
  /** Event-level QA hook: NEVER called for every animation frame. */
  onPhase?: (event: LiquidEvent) => void;
  children: (physics: LiquidPhysics) => ReactNode;
};

/** Fixed native hit area; only the child surface moves. A single Tap recognizer owns
 * commit/cancel. No JS timers, opacity feedback, JS-per-frame setState or nested press.
 */
export function LiquidPressable({ width, height, style, label, onPress, disabled = false,
  testID, intensity = 1, haptics = 'contact-and-commit', forceReducedMotion = false,
  onPhase, children }: LiquidPressableProps) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('LiquidPressable requires finite positive width and height.');
  }
  const pressure = useSharedValue(0);
  const contactX = useSharedValue(width / 2);
  const contactY = useSharedValue(height / 2);
  const active = useSharedValue(false);
  const interactionId = useSharedValue(0);
  const accepted = useSharedValue(!disabled);
  const reduceMotion = useMotionPreference(forceReducedMotion);
  const latest = useRef({ onPress, disabled, haptics, onPhase });
  latest.current = { onPress, disabled, haptics, onPhase };
  const alive = useRef(true);
  const invalidatedAt = useRef(-Infinity);
  const lastCommit = useRef(0);
  const fireHaptic = useMemo(createHapticGate, []);

  const dispatch = useCallback((event: LiquidEvent) => {
    const props = latest.current;
    if (!alive.current) return;
    if (event.phase === 'commit') {
      if (props.disabled || !props.onPress || event.timestamp <= invalidatedAt.current ||
          event.interactionId <= lastCommit.current || (AppState.currentState && AppState.currentState !== 'active')) return;
      lastCommit.current = event.interactionId;
      // The action dispatch is the commit, NOT proof of successful async business work.
      props.onPress();
      fireHaptic('commit', event.timestamp, props.haptics);
    } else if (event.phase === 'contact' && !props.disabled && props.onPress && event.timestamp > invalidatedAt.current) {
      fireHaptic('contact', event.timestamp, props.haptics);
    }
    props.onPhase?.(event);
  }, [fireHaptic]);

  useEffect(() => {
    alive.current = true;
    const reset = () => {
      invalidatedAt.current = Date.now();
      accepted.value = false;
      active.value = false;
      cancelAnimation(pressure);
      pressure.value = 0;
    };
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') reset();
      else accepted.value = !latest.current.disabled;
    });
    return () => { alive.current = false; reset(); subscription.remove(); };
  }, [accepted, active, pressure]);

  useEffect(() => {
    accepted.value = !disabled && (!AppState.currentState || AppState.currentState === 'active');
    if (disabled) {
      invalidatedAt.current = Date.now();
      active.value = false;
      cancelAnimation(pressure);
      pressure.value = 0;
    }
  }, [disabled, accepted, active, pressure]);

  // A system preference change during HOLD must not leave a spring running.
  useAnimatedReaction(() => reduceMotion.value, (next, previous) => {
    if (previous !== null && next !== previous) {
      cancelAnimation(pressure);
      pressure.value = active.value ? 1 : 0;
    }
  });

  const gesture = useMemo(() => Gesture.Tap()
    .enabled(!disabled)
    .maxDuration(PRESS.maxHoldMs)
    .maxDistance(PRESS.movementTolerance)
    .shouldCancelWhenOutside(true)
    .onBegin(event => {
      'worklet';
      if (!accepted.value || event.numberOfPointers !== 1 || !insideCapsule(event.x, event.y, width, height)) return;
      interactionId.value += 1;
      contactX.value = event.x;
      contactY.value = event.y;
      active.value = true;
      cancelAnimation(pressure);
      pressure.value = reduceMotion.value
        ? withTiming(1, { duration: PRESS.reducedDuration, reduceMotion: ReduceMotion.Never })
        : withSpring(1, { ...SPRINGS.press, reduceMotion: ReduceMotion.Never });
      scheduleOnRN(dispatch, { phase: 'contact', interactionId: interactionId.value, timestamp: Date.now() });
    })
    .onTouchesDown((event, manager) => {
      'worklet';
      const touch = event.allTouches[0];
      if (event.numberOfTouches !== 1 || !touch || !accepted.value || !insideCapsule(touch.x, touch.y, width, height)) manager.fail();
    })
    .onTouchesMove((event, manager) => {
      'worklet';
      const touch = event.allTouches[0];
      if (!accepted.value || event.numberOfTouches !== 1 || !touch || !insideCapsule(touch.x, touch.y, width, height)) {
        manager.fail();
        return;
      }
      if (active.value) {
        contactX.value = touch.x;
        contactY.value = touch.y;
      }
    })
    .onEnd((event, success) => {
      'worklet';
      if (success && active.value && accepted.value && insideCapsule(event.x, event.y, width, height)) {
        scheduleOnRN(dispatch, { phase: 'commit', interactionId: interactionId.value, timestamp: Date.now() });
      }
    })
    .onFinalize((_event, success) => {
      'worklet';
      if (!active.value) return;
      active.value = false;
      const id = interactionId.value;
      if (!success) scheduleOnRN(dispatch, { phase: 'cancel', interactionId: id, timestamp: Date.now() });
      cancelAnimation(pressure);
      const complete = (finished?: boolean) => {
        'worklet';
        if (finished && id === interactionId.value && !active.value) {
          pressure.value = 0; // exact rest, not an asymptotic residual
          scheduleOnRN(dispatch, { phase: 'settled', interactionId: id, timestamp: Date.now() });
        }
      };
      pressure.value = reduceMotion.value
        ? withTiming(0, { duration: PRESS.reducedDuration, reduceMotion: ReduceMotion.Never }, complete)
        : withSpring(0, { ...SPRINGS.settle, reduceMotion: ReduceMotion.Never }, complete);
    }), [disabled, width, height, accepted, interactionId, contactX, contactY, active, pressure, reduceMotion, dispatch]);

  const transform = useAnimatedStyle(() => {
    const pose = rigidPose(pressure.value, reduceMotion.value, intensity);
    return { transform: [{ translateY: pose.y }, { scale: pose.scale }] };
  });
  const physics = useMemo<LiquidPhysics>(() => ({ pressure, contactX, contactY, reduceMotion, width, height, intensity }),
    [pressure, contactX, contactY, reduceMotion, width, height, intensity]);

  // Screen readers have no contact point. Activate once, with commit feedback only;
  // do not synthesize a touch ripple/pulse or a delayed business action.
  const accessibleActivate = () => {
    const props = latest.current;
    if (!alive.current || props.disabled || !props.onPress || (AppState.currentState && AppState.currentState !== 'active')) return;
    props.onPress();
    fireHaptic('commit', Date.now(), props.haptics);
  };
  return <GestureDetector gesture={gesture}>
    <View collapsable={false} accessible accessibilityRole="button" accessibilityLabel={label}
      accessibilityState={{ disabled }} testID={testID}
      onAccessibilityTap={Platform.OS === 'ios' ? accessibleActivate : undefined}
      accessibilityActions={Platform.OS === 'android' ? [{ name: 'activate', label }] : undefined}
      onAccessibilityAction={Platform.OS === 'android' ? event => { if (event.nativeEvent.actionName === 'activate') accessibleActivate(); } : undefined}
      style={[{ width, height, borderRadius: height/2 }, style, { opacity: disabled ? PRESS.disabledOpacity : 1 }]}>
      <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={[StyleSheet.absoluteFill, transform]}>
        {children(physics)}
      </Animated.View>
    </View>
  </GestureDetector>;
}
