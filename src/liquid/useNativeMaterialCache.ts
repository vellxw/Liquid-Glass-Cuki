import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { View, findNodeHandle, UIManager } from 'react-native';
import { Skia, makeImageFromView, FilterMode, MipmapMode, type SkImage } from '@shopify/react-native-skia';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { LiquidPhysics } from './types';

type Box={x:number;y:number;width:number;height:number};
type Cache={material:SkImage;backdrop:SkImage|null};
export function canInstallCache(active:boolean,pressure:number):boolean {
  'worklet'; return !active && pressure===0;
}
function measure(ref:RefObject<View|null>):Promise<Box|null>{
  return new Promise(resolve=>{
    const timer=setTimeout(()=>resolve(null),350);
    const done=(x:number,y:number,width:number,height:number)=>{
      clearTimeout(timer);resolve(width>0&&height>0?{x,y,width,height}:null);
    };
    if(!ref.current){clearTimeout(timer);resolve(null);return;}
    if(typeof ref.current.measureInWindow==='function')ref.current.measureInWindow(done);
    else {
      const tag=findNodeHandle(ref.current);
      if(tag==null){clearTimeout(timer);resolve(null);return;}
      UIManager.measureInWindow(tag,done);
    }
  });
}
async function captureBackdrop(host:RefObject<View|null>,target:RefObject<View|null>|undefined,
  pw:number,ph:number):Promise<SkImage|null>{
  if(!target?.current)return null;
  const [a,b]=await Promise.all([measure(host),measure(target)]);
  if(!a||!b)return null;
  const image=await makeImageFromView(target);
  if(!image)return null;
  const surface=Skia.Surface.Make(pw,ph);
  if(!surface)return null;
  const canvas=surface.getCanvas();canvas.clear(Skia.Color('#091113'));
  canvas.drawImageRectOptions(image,
    Skia.XYWHRect((a.x-b.x)*image.width()/b.width,(a.y-b.y)*image.height()/b.height,
      a.width*image.width()/b.width,a.height*image.height()/b.height),
    Skia.XYWHRect(0,0,pw,ph),FilterMode.Linear,MipmapMode.None);
  surface.flush();return surface.makeImageSnapshot();
}
/** Native artwork ALWAYS remains mounted. Cache changes only on geometry/revision,
 * not on each press. Old resources remain valid while a new revision is prepared.
 * Stale async results never replace a newer revision; installation waits for REST.
 * No arbitrary live RN backdrop: callers invalidate after scene changes/scroll end.
 */
export function useNativeMaterialCache(physics:LiquidPhysics,target?:RefObject<View|null>,revision?:unknown){
  const source=useRef<View>(null),host=useRef<View>(null);
  const [cache,setCache]=useState<Cache|null>(null);
  const alive=useRef(true),generation=useRef(0),capturing=useRef(false);
  const wanted=useRef(false),pending=useRef<Cache|null>(null);
  const pendingOnUI=useSharedValue(false);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const raf=useRef(0),attempts=useRef(0);
  const pump=useRef<()=>void>(()=>{});
  const install=useCallback(()=>{
    if(!alive.current||!pending.current||!canInstallCache(physics.active.value,physics.pressure.value))return;
    setCache(pending.current);pending.current=null;pendingOnUI.value=false;
  },[physics.active,physics.pressure,pendingOnUI]);
  useAnimatedReaction(()=>pendingOnUI.value&&canInstallCache(physics.active.value,physics.pressure.value),
    (ready,previous)=>{if(ready&&!previous)scheduleOnRN(install);},[install]);
  pump.current=()=>{
    if(!alive.current||capturing.current||!wanted.current||!source.current)return;
    wanted.current=false;capturing.current=true;
    const version=generation.current;
    void (async()=>{
      try {
        const material=await makeImageFromView(source);
        if(!material)throw new Error('Empty native material snapshot');
        let backdrop:SkImage|null=null;
        try{backdrop=await captureBackdrop(host,target,material.width(),material.height());}
        catch(error){console.warn('[premium-backdrop]',String(error));}
        if(!alive.current||version!==generation.current)return;
        pending.current={material,backdrop};pendingOnUI.value=true;install();
        console.log('[premium-cache]',JSON.stringify({revision:version,width:material.width(),height:material.height(),backdrop:!!backdrop}));
      }catch(error){
        console.warn('[premium-material-cache]',String(error));
        // Bounded retry, never a per-frame retry loop. Retain native control on failure.
        if(alive.current&&version===generation.current&&attempts.current++<1){
          wanted.current=true;timer.current=setTimeout(()=>pump.current(),240);
        }
      }finally{
        capturing.current=false;
        if(alive.current&&version!==generation.current)raf.current=requestAnimationFrame(()=>pump.current());
      }
    })();
  };
  const prepare=useCallback(()=>{
    generation.current++;attempts.current=0;wanted.current=true;
    pending.current=null;pendingOnUI.value=false;
    if(timer.current)clearTimeout(timer.current);
    cancelAnimationFrame(raf.current);
    timer.current=setTimeout(()=>{
      raf.current=requestAnimationFrame(()=>{raf.current=requestAnimationFrame(()=>pump.current());});
    },160);
  },[pendingOnUI]);
  useEffect(()=>{alive.current=true;return()=>{
    alive.current=false;generation.current++;pending.current=null;
    if(timer.current)clearTimeout(timer.current);cancelAnimationFrame(raf.current);
  };},[]);
  useEffect(()=>{prepare();},[revision,prepare]);
  return {source,host,cache,prepare};
}
