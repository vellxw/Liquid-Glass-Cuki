import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { View } from 'react-native';
import { Skia, makeImageFromView, FilterMode, MipmapMode, type SkImage } from '@shopify/react-native-skia';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { LiquidPhysics } from './types';

type Box={x:number;y:number;width:number;height:number};
type Cache={material:SkImage;backdrop:SkImage|null};
export function canInstallCache(active:boolean,pressure:number):boolean {
  'worklet';return !active&&pressure===0;
}
function measure(ref:RefObject<View|null>):Promise<Box|null>{
  return new Promise(resolve=>{
    const timer=setTimeout(()=>resolve(null),350);
    if(!ref.current){clearTimeout(timer);resolve(null);return;}
    ref.current.measureInWindow((x,y,width,height)=>{
      clearTimeout(timer);resolve(width>0&&height>0?{x,y,width,height}:null);
    });
  });
}
/** Optional captured underlay: its own native scene, never the button/foreground.
 * This copy is fixed for an interaction. Prefer a supplied SkImage for live scenes.
 * Coordinates are measured once at layout, never streamed through RN while dragging.
 */
async function captureBackdrop(host:RefObject<View|null>,target:RefObject<View|null>|undefined,
  pixelWidth:number,pixelHeight:number):Promise<SkImage|null>{
  if(!target?.current)return null;
  const [a,b]=await Promise.all([measure(host),measure(target)]);
  if(!a||!b)return null;
  const image=await makeImageFromView(target);
  if(!image)return null;
  const sx=image.width()/b.width,sy=image.height()/b.height;
  const surface=Skia.Surface.Make(pixelWidth,pixelHeight);
  if(!surface)return null;
  const canvas=surface.getCanvas();canvas.clear(Skia.Color('#091113'));
  canvas.drawImageRectOptions(image,
    Skia.XYWHRect((a.x-b.x)*sx,(a.y-b.y)*sy,a.width*sx,a.height*sy),
    Skia.XYWHRect(0,0,pixelWidth,pixelHeight),FilterMode.Linear,MipmapMode.None);
  surface.flush();return surface.makeImageSnapshot();
}
/** One cache per mounted geometry, NOT one cache per press. Native source is used
 * only for initial preparation/fallback. Once ready, REST and interaction always
 * use the same Skia layer. Never install a late resource during an active gesture.
 */
export function useNativeMaterialCache(physics:LiquidPhysics,target?:RefObject<View|null>){
  const source=useRef<View>(null),host=useRef<View>(null);
  const [cache,setCache]=useState<Cache|null>(null);
  const alive=useRef(true),started=useRef(false),pending=useRef<Cache|null>(null);
  const pendingOnUI=useSharedValue(false);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const install=useCallback(()=>{
    if(!alive.current||!pending.current||!canInstallCache(physics.active.value,physics.pressure.value))return;
    setCache(pending.current);pending.current=null;pendingOnUI.value=false;
  },[physics.active,physics.pressure,pendingOnUI]);
  // Only resource availability crosses to RN. It remains false throughout all later gestures.
  useAnimatedReaction(()=>pendingOnUI.value&&canInstallCache(physics.active.value,physics.pressure.value),
    (ready,previous)=>{if(ready&&!previous)scheduleOnRN(install);},[install]);
  const prepare=useCallback(()=>{
    if(started.current)return;started.current=true;
    timer.current=setTimeout(()=>{
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        if(!alive.current||!source.current)return;
        makeImageFromView(source).then(async material=>{
          if(!material)throw new Error('Native material snapshot returned no image');
          let backdrop:SkImage|null=null;
          try{backdrop=await captureBackdrop(host,target,material.width(),material.height());}
          catch(error){console.warn('[volume-backdrop]',String(error));}
          if(!alive.current)return;
          pending.current={material,backdrop};pendingOnUI.value=true;install();
          console.log('[volume-cache]',JSON.stringify({width:material.width(),height:material.height(),backdrop:!!backdrop}));
        }).catch(error=>{console.warn('[volume-material-cache]',String(error));});
      }));
    },160);
  },[target,pendingOnUI,install]);
  useEffect(()=>{alive.current=true;return()=>{
    alive.current=false;pending.current=null;if(timer.current)clearTimeout(timer.current);
  };},[]);
  return {source,host,cache,prepare};
}
