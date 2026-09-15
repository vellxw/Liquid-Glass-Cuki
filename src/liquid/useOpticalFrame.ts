import {useEffect} from 'react';
import {useAnimatedReaction,useSharedValue,type SharedValue} from 'react-native-reanimated';
import type {LiquidPhysics} from './types';

export type OpticalFrame={x:number;y:number;p:number;reduced:boolean};
/** Rejected performance candidate, mounted ONLY by the diagnostic mode. Normal
 * rendering reads the gesture values directly, without this mapper/queue/packing. */
export function OpticalFrameCoordinator({physics,frame}:{physics:LiquidPhysics;frame:SharedValue<OpticalFrame>}){
  const {contactX,contactY,releaseX,releaseY,pressure,reduceMotion}=physics;
  const queued=useSharedValue(false),alive=useSharedValue(true);
  useEffect(()=>{alive.value=true;return()=>{alive.value=false;};},[alive]);
  useAnimatedReaction(()=>({x:contactX.value+releaseX.value,y:contactY.value+releaseY.value,
      p:pressure.value,reduced:reduceMotion.value}),(now,previous)=>{
    if(!previous || (now.p===0)!==(previous.p===0))frame.value=now;
    if(!queued.value&&now.p!==0){
      queued.value=true;
      requestAnimationFrame(()=>{
        'worklet';queued.value=false;
        if(alive.value)frame.value={x:contactX.value+releaseX.value,y:contactY.value+releaseY.value,
          p:pressure.value,reduced:reduceMotion.value};
      });
    }
  });
  return null;
}
