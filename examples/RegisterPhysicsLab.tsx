import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurTargetView } from 'expo-blur';
import Animated, { useAnimatedProps, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { GlassButton } from '../src/home/GlassButton';
import { LiquidPressable } from '../src/liquid/LiquidPressable';
import { CukiHomeDemo } from '../src/demo/CukiHomeDemo';
import { LOCAL_GLASS } from '../src/liquid/physics';
import type { LiquidEvent, LiquidPhysics } from '../src/liquid/types';
type Frame={t:number;x:number;y:number;p:number;vx:number;vy:number;dt:number};
type Report={samples:number;meanMs:number;p95Ms:number;maxMs:number;uiCallbackHz:number;trace:Frame[]};
const DebugInput=Animated.createAnimatedComponent(TextInput);
/** UI telemetry is buffered locally and crosses to RN ONLY when the interaction settles.
 * UI callback frequency is not the hardware presentation FPS. See SurfaceFlinger artifacts. */
function Probe({physics,onReport,debug}:{physics:LiquidPhysics;onReport:(r:Report)=>void;debug:boolean}){
  const frames=useSharedValue<Frame[]>([]),running=useSharedValue(false);
  const probe=useFrameCallback(f=>{
    if(physics.active.value || physics.pressure.value!==0){
      if(!running.value){frames.value=[];running.value=true;}
      if(frames.value.length<2400)frames.modify(a=>{
        'worklet';a.push({t:f.timestamp,x:physics.contactX.value,y:physics.contactY.value,p:physics.pressure.value,
          vx:physics.velocityX.value,vy:physics.velocityY.value,dt:f.timeSincePreviousFrame??0});return a;
      });
    }else if(running.value){
      running.value=false;
      const trace=[...frames.value],times=trace.slice(1).map(x=>x.dt).filter(x=>x>0).sort((a,b)=>a-b);
      if(times.length){const meanMs=times.reduce((a,b)=>a+b,0)/times.length;
        scheduleOnRN(onReport,{samples:times.length,meanMs,p95Ms:times[Math.min(times.length-1,Math.floor(times.length*.95))],
          maxMs:times[times.length-1],uiCallbackHz:1000/meanMs,trace});}
    }
  },false);
  useEffect(()=>{probe.setActive(true);return ()=>probe.setActive(false);},[probe]);
  const debugProps=useAnimatedProps(()=>({
    defaultValue: '',
    text:`x ${physics.contactX.value.toFixed(1)}  y ${physics.contactY.value.toFixed(1)}  R ${LOCAL_GLASS.radius}\np ${physics.pressure.value.toFixed(3)}  v ${physics.velocityX.value.toFixed(0)}, ${physics.velocityY.value.toFixed(0)} dp/s`,
  }));
  return debug ? <DebugInput editable={false} multiline animatedProps={debugProps} defaultValue=""
    pointerEvents="none" style={styles.debug}/> : null;
}
export function RegisterPhysicsLab(){
  const {width}=useWindowDimensions(),insets=useSafeAreaInsets();
  const target=useRef<View|null>(null);
  const [commits,setCommits]=useState(0),[ready,setReady]=useState(false);
  const [mechanical,setMechanical]=useState(true);
  const [showHome,setShowHome]=useState(false);
  const [legacy,setLegacy]=useState(false),[lighting,setLighting]=useState(true);
  const [enabled,setEnabled]=useState(true),[grid,setGrid]=useState(false),[debug,setDebug]=useState(false);
  const [reduced,setReduced]=useState(false),[disabled,setDisabled]=useState(false);
  const [event,setEvent]=useState('REST'),[report,setReport]=useState<Report|null>(null);
  const scale=Math.min(1.6,(width-insets.left-insets.right)/375);
  const onPhase=useCallback((e:LiquidEvent)=>{setEvent(e.phase);console.log('[local-phase]',JSON.stringify(e));},[]);
  const onReport=useCallback((r:Report)=>{setReport(r);console.log('[local-trace]',JSON.stringify(r));},[]);
  const onReady=useCallback((value:boolean)=>setReady(value),[]);
  if(showHome)return <CukiHomeDemo/>;
  return <View style={styles.screen}>
    <BlurTargetView ref={target} style={StyleSheet.absoluteFill}/>
    <ScrollView contentContainerStyle={{paddingTop:insets.top+24,paddingHorizontal:16,paddingBottom:insets.bottom+80}}>
      <Text style={styles.title}>Registrar · vidrio local</Text>
      <Text style={styles.note}>Presiona y arrastra. El vidrio cede localmente; la silueta no se escala. El estado de reposo usa la misma ruta de render.</Text>
      <View style={styles.bench}>
        {legacy ? <GlassButton key="original-native" variant="primary" label="Registrar +" scale={scale} blurTarget={target}/> : <LiquidPressable key="volume-native" width={230*scale} height={61*scale} label="Registrar +" testID="lab-register"
          disabled={disabled} forceReducedMotion={reduced} onPress={()=>setCommits(v=>v+1)} onPhase={onPhase}>
          {physics=><>
            <GlassButton variant="primary" label="Registrar +" scale={scale} blurTarget={target} interaction={physics}
              lighting={lighting} opticsEnabled={enabled} mechanicalSupport={mechanical} debug={debug} proofGrid={grid} onSurfaceReady={onReady}/>
            {debug && <Probe physics={physics} onReport={onReport} debug={debug}/>}
          </>}
        </LiquidPressable>}
      </View>
      <View style={styles.row}><Text style={styles.text} testID="lab-commits">Acciones: {commits}</Text>
        <Pressable style={{padding:10}} accessibilityRole="button" accessibilityLabel="Ver Home real" testID="lab-open-home" onPress={()=>setShowHome(true)}><Text style={styles.text}>Ver Home</Text></Pressable></View>
      <Text style={styles.small} testID="lab-ready">{ready ? 'Motor: listo' : 'Preparando material vectorial'}</Text>
      <Text style={styles.small} testID="lab-phase">Estado: {event}</Text>
      <Text style={styles.note}>Tap · Hold 1 s · Drag horizontal · Círculo · Drag vertical · Arrastrar afuera para cancelar</Text>
      <View style={styles.row}><Text style={styles.text}>Deformación local</Text><Switch value={enabled} onValueChange={setEnabled} accessibilityLabel="Deformación local"/></View>
      <View style={styles.row}><Text style={styles.text}>Cuadrícula de refracción</Text><Switch value={grid} onValueChange={setGrid} accessibilityLabel="Cuadrícula de refracción"/></View>
      <View style={styles.row}><Text style={styles.text}>Contenido nítido · 0,9 dp</Text><Switch value={mechanical} onValueChange={setMechanical} accessibilityLabel="Acompañamiento del contenido"/></View>
      <View style={styles.row}><Text style={styles.text}>Iluminación de contacto</Text><Switch value={lighting} onValueChange={setLighting} accessibilityLabel="Iluminación de contacto"/></View>
      <View style={styles.row}><Text style={styles.text}>Referencia estática original</Text><Switch value={legacy} onValueChange={setLegacy} accessibilityLabel="Referencia estática"/></View>
      <View style={styles.row}><Text style={styles.text}>Debug de contacto</Text><Switch value={debug} onValueChange={setDebug} accessibilityLabel="Debug de contacto"/></View>
      <View style={styles.row}><Text style={styles.text}>Movimiento reducido</Text><Switch value={reduced} onValueChange={setReduced} accessibilityLabel="Forzar movimiento reducido"/></View>
      <View style={styles.row}><Text style={styles.text}>Deshabilitado</Text><Switch value={disabled} onValueChange={setDisabled} accessibilityLabel="Deshabilitar Registrar"/></View>
      <Text style={styles.note}>Sin deformación local no queda un tap de escala o desplazamiento. La cuadrícula es una capa por debajo del vidrio; nunca se usa en la Home.</Text>
      {debug && <Text style={styles.small}>Callback UI: {report ? `${report.uiCallbackHz.toFixed(1)} Hz · p95 ${report.p95Ms.toFixed(1)} ms` : 'sin medición'}. No equivale a FPS presentados. Activar debug añade coste de instrumentación.</Text>}
    </ScrollView>
  </View>;
}
const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:'#0B1315'},title:{color:'#F4F6F8',fontSize:24,fontWeight:'600'},
  text:{color:'#F4F6F8',fontSize:15},small:{color:'#ADB5BF',fontSize:12,lineHeight:18},
  note:{color:'#ADB5BF',fontSize:14,lineHeight:21,marginVertical:12},
  row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginVertical:2},
  bench:{alignItems:'center',marginVertical:26},debug:{position:'absolute',top:-35,left:0,color:'#A9F0D0',fontSize:10,width:300,height:33,padding:0},
});
