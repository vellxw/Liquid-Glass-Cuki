import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { AppState, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { cancelAnimation, ReduceMotion, useAnimatedReaction, Easing,
  useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { createHapticGate } from './haptics';
import { insideCapsule, yieldsToScroll, LOCAL_GLASS, PRESS, SPRINGS } from './physics';
import { usePremiumScroll } from './PremiumScrollScope';
import { useMotionPreference } from './useMotionPreference';
import type { LiquidEvent, LiquidHaptics, LiquidPhysics } from './types';

export type LiquidPressableProps = {
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  /** Pending business operation; blocks input without imposing a fake debounce. */
  busy?: boolean;
  testID?: string;
  intensity?: number;
  haptics?: LiquidHaptics;
  forceReducedMotion?: boolean;
  /** Event-level QA hook: NEVER called for every animation frame. */
  onPhase?: (event: LiquidEvent) => void;
  children: (physics: LiquidPhysics) => ReactNode;
};

/** Fixed native hit area AND fixed artwork. A zero-distance native Pan begins on
 * touch-down, stays active through drag and holds without a timeout. Only the
 * local signed-height field recovers. There is no rigid scale/translation.
 */
export function LiquidPressable({ width, height, style, label, onPress, disabled = false,
  testID, busy = false, intensity = 1, haptics = 'contact-and-commit', forceReducedMotion = false,
  onPhase, children }: LiquidPressableProps) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('LiquidPressable requires finite positive width and height.');
  }
  const scroll=usePremiumScroll();
  const blocked=disabled || busy;
  const scrollEnabled=scroll?.enabled ?? false;
  const pressure = useSharedValue(0);
  const contactX = useSharedValue(width / 2);
  const contactY = useSharedValue(height / 2);
  const active = useSharedValue(false);
  const velocityX = useSharedValue(0), velocityY = useSharedValue(0);
  const releaseX = useSharedValue(0), releaseY = useSharedValue(0);
  const interactionId = useSharedValue(0);
  const startX=useSharedValue(0),startY=useSharedValue(0);
  const accepted = useSharedValue(!blocked);
  const reduceMotion = useMotionPreference(forceReducedMotion);
  const latest = useRef({ onPress, disabled:blocked, haptics, onPhase });
  latest.current = { onPress, disabled:blocked, haptics, onPhase };
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
    accepted.value = !blocked && (!AppState.currentState || AppState.currentState === 'active');
    if (blocked) {
      invalidatedAt.current = Date.now();
      active.value = false;
      cancelAnimation(pressure);
      pressure.value = 0;
    }
  }, [blocked, accepted, active, pressure]);

  // A system preference change during HOLD must not leave a spring running.
  useAnimatedReaction(() => reduceMotion.value, (next, previous) => {
    if (previous !== null && next !== previous) {
      cancelAnimation(pressure);
      pressure.value = active.value ? 1 : 0;
    }
  });

  const gesture = useMemo(() => {
    const release = (success: boolean) => {
      'worklet';
      if (!active.value) return;
      active.value=false;
      const id=interactionId.value;
      if (!success) scheduleOnRN(dispatch,{phase:'cancel',interactionId:id,timestamp:Date.now()});
      // Cancel every pending coordinate tween from legacy versions. No lateral kick.
      cancelAnimation(releaseX);cancelAnimation(releaseY);
      releaseX.value=0;releaseY.value=0;
      velocityX.value=0;velocityY.value=0;
      cancelAnimation(pressure);
      const complete=(finished?:boolean)=>{
        'worklet';
        if(finished && id===interactionId.value && !active.value){
          pressure.value=0;releaseX.value=0;releaseY.value=0;
          scheduleOnRN(dispatch,{phase:'settled',interactionId:id,timestamp:Date.now()});
        }
      };
      pressure.value=reduceMotion.value
        ? withTiming(0,{duration:PRESS.reducedDuration,reduceMotion:ReduceMotion.Never},complete)
        : withSpring(0,{...SPRINGS.settle,reduceMotion:ReduceMotion.Never},complete);
    };
    const pan=Gesture.Pan().enabled(!blocked).minDistance(0).maxPointers(1).manualActivation(true)
      .shouldCancelWhenOutside(false)
      .onBegin(event=>{
        'worklet';
        if(!accepted.value || event.numberOfPointers!==1 || !insideCapsule(event.x,event.y,width,height))return;
        interactionId.value+=1;contactX.value=event.x;contactY.value=event.y;
        releaseX.value=0;releaseY.value=0;velocityX.value=0;velocityY.value=0;startX.value=event.x;startY.value=event.y;active.value=true;
        cancelAnimation(pressure);
        // Start from the ACTUAL current state. No 25% step or minimum tap-duration.
        pressure.value=Math.max(0,Math.min(1,pressure.value));
        pressure.value=withTiming(1,{duration:reduceMotion.value ? PRESS.reducedDuration : LOCAL_GLASS.contactDuration,
          easing:Easing.out(Easing.cubic),reduceMotion:ReduceMotion.Never});
        scheduleOnRN(dispatch,{phase:'contact',interactionId:interactionId.value,timestamp:Date.now()});
      })
      .onTouchesDown((event,manager)=>{
        'worklet'; const t=event.allTouches[0];
        if(event.numberOfTouches!==1 || !accepted.value || !t || !insideCapsule(t.x,t.y,width,height)){
          release(false);manager.fail();return;
        }
        // DOWN must activate even when Android delivers no MOVE before UP.
        // Otherwise a perfectly still tap ends the Pan in FAILED, not END.
        manager.activate();
      })
      .onTouchesMove((event,manager)=>{
        'worklet'; const t=event.allTouches[0];
        if(event.numberOfTouches!==1 || !accepted.value || !t || !insideCapsule(t.x,t.y,width,height) || yieldsToScroll(t.x-startX.value,t.y-startY.value,scrollEnabled)){
          release(false);manager.fail();return;
        }
        // onUpdate is the single coordinate writer; this handler only owns cancellation.
      })
      .onUpdate(event=>{
        'worklet';
        if(!active.value || !accepted.value)return;
        if(!insideCapsule(event.x,event.y,width,height) || yieldsToScroll(event.x-startX.value,event.y-startY.value,scrollEnabled)){release(false);return;}
        contactX.value=event.x;contactY.value=event.y;
        const vmax=LOCAL_GLASS.maxVelocity;
        velocityX.value=Math.max(-vmax,Math.min(vmax,event.velocityX));
        velocityY.value=Math.max(-vmax,Math.min(vmax,event.velocityY));
        // Velocity is diagnostic only: it cannot make this anchored button drift.
      })
      .onEnd((event,success)=>{
        'worklet';
        if(success && active.value && accepted.value && insideCapsule(event.x,event.y,width,height)){
          scheduleOnRN(dispatch,{phase:'commit',interactionId:interactionId.value,timestamp:Date.now()});
        }
      })
      .onFinalize((_event,success)=>{ 'worklet';release(success); });
    // Simultaneous native recognition leaves the parent's vertical scrolling intact.
    if(scroll?.enabled)pan.simultaneousWithExternalGesture(scroll.gesture);
    return pan;
  },[blocked,width,height,accepted,interactionId,contactX,contactY,active,pressure,reduceMotion,dispatch,
    velocityX,velocityY,releaseX,releaseY,startX,startY,scroll,scrollEnabled]);

  const physics = useMemo<LiquidPhysics>(() => ({ pressure, contactX, contactY, velocityX, velocityY,
    releaseX, releaseY, active, reduceMotion, width, height, intensity }),
    [pressure,contactX,contactY,velocityX,velocityY,releaseX,releaseY,active,reduceMotion,width,height,intensity]);

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
      accessibilityState={{ disabled:blocked, busy }} testID={testID}
      onAccessibilityTap={Platform.OS === 'ios' ? accessibleActivate : undefined}
      accessibilityActions={Platform.OS === 'android' ? [{ name: 'activate', label }] : undefined}
      onAccessibilityAction={Platform.OS === 'android' ? event => { if (event.nativeEvent.actionName === 'activate') accessibleActivate(); } : undefined}
      style={[{ width, height, borderRadius: height/2 }, style, { opacity: disabled ? PRESS.disabledOpacity : 1 }]}>
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}>
        {children(physics)}
      </View>
    </View>
  </GestureDetector>;
}
