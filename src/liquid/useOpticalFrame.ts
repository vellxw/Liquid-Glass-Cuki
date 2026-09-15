import {useEffect} from 'react';
import {useAnimatedReaction,useDerivedValue,useSharedValue} from 'react-native-reanimated';
import type {LiquidPhysics} from './types';

/** Diagnostic candidate: at most one pending UI frame; always reads the newest
 * contact at flush, never replays a queue of old positions. Contact/rest boundaries
 * publish immediately. No React per-frame state, JS bridge or permanent idle loop.
 * Disabled by default until native latency/presentation evidence supports it. */
export function useOpticalFrame(physics:LiquidPhysics,coalesce:boolean){
  const {contactX,contactY,releaseX,releaseY,pressure,reduceMotion}=physics;
  const frame=useSharedValue({x:contactX.value,y:contactY.value,p:0,reduced:reduceMotion.value});
  const queued=useSharedValue(false),alive=useSharedValue(true);
  useEffect(()=>{alive.value=true;return()=>{alive.value=false;};},[alive]);
  useAnimatedReaction(()=>coalesce?{x:contactX.value+releaseX.value,y:contactY.value+releaseY.value,
      p:pressure.value,reduced:reduceMotion.value}:null,(now,previous)=>{
    if(!now)return;
    // Preserve touch-down and exact recovery without waiting for the next callback.
    if(!previous || (now.p===0)!==(previous.p===0))frame.value=now;
    if(!queued.value&&now.p!==0){
      queued.value=true;
      requestAnimationFrame(()=>{
        'worklet';queued.value=false;
        if(alive.value)frame.value={x:contactX.value+releaseX.value,y:contactY.value+releaseY.value,
          p:pressure.value,reduced:reduceMotion.value};
      });
    }
  },[coalesce]);
  return useDerivedValue(()=>coalesce?frame.value:{x:contactX.value+releaseX.value,
    y:contactY.value+releaseY.value,p:pressure.value,reduced:reduceMotion.value},[coalesce]);
}
