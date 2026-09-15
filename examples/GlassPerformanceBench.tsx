import {useCallback,useRef,useState} from 'react';
import {Pressable,StyleSheet,Text,View,useWindowDimensions} from 'react-native';
import {BlurTargetView} from 'expo-blur';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {GlassButton} from '../src/home/GlassButton';
import {LiquidPressable} from '../src/liquid/LiquidPressable';
import {GLASS_PERFORMANCE,GlassPerformanceContext,type GlassPerformanceMode} from '../src/liquid/performance';

/** Separate benchmark screen, no frame-level React instrumentation. All candidates
 * share input, dimensions, artwork, cache and device. Mode changes only between tests. */
export function GlassPerformanceBench({onBack}:{onBack:()=>void}){
  const {width}=useWindowDimensions(),insets=useSafeAreaInsets();
  const target=useRef<View|null>(null);
  const [mode,setMode]=useState<GlassPerformanceMode>('optimized');
  const [ready,setReady]=useState(false),[count,setCount]=useState(0);
  const onReady=useCallback((r:boolean)=>setReady(r),[]);
  const scale=Math.min(1.6,(width-insets.left-insets.right)/375);
  return <View style={styles.screen}>
    <BlurTargetView ref={target} style={StyleSheet.absoluteFill}/>
    <View style={{padding:16,paddingTop:insets.top+16}}>
      <Text style={styles.title}>CUKI · rendimiento A/B</Text>
      <Text style={styles.caption}>Mismo dispositivo · misma geometría · sin grabación durante la medición.</Text>
      <View style={{alignItems:'center',marginVertical:30}}>
        <GlassPerformanceContext.Provider value={GLASS_PERFORMANCE[mode]}>
          <LiquidPressable width={230*scale} height={61*scale} label="Registrar +" testID="perf-register"
            onPress={()=>setCount(c=>c+1)} haptics="off">
            {physics=><GlassButton variant="primary" label="Registrar +" scale={scale} interaction={physics}
              blurTarget={target} onSurfaceReady={onReady}/>}
          </LiquidPressable>
        </GlassPerformanceContext.Provider>
      </View>
      <Text style={styles.caption} testID="perf-ready">{ready?'Motor: listo':'Preparando'}</Text>
      <Text style={styles.caption} testID="perf-mode">Modo: {mode}</Text>
      <Text style={styles.caption} testID="perf-count">Acciones: {count}</Text>
      <View style={styles.options}>
        {(Object.keys(GLASS_PERFORMANCE) as GlassPerformanceMode[]).map(key=><Pressable
          key={key} testID={`perf-select-${key}`} accessibilityLabel={`Modo ${key}`} accessibilityRole="button"
          onPress={()=>setMode(key)} style={[styles.option,mode===key&&styles.selected]}>
          <Text style={styles.text}>{key}</Text>
        </Pressable>)}
      </View>
      <Text style={styles.caption}>no-blur / no-lighting / no-content / identity son diagnósticos, no niveles de calidad.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Volver al laboratorio" testID="perf-back" onPress={onBack} style={styles.option}>
        <Text style={styles.text}>Volver al laboratorio</Text>
      </Pressable>
    </View>
  </View>;
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:'#0B1315'},title:{fontSize:23,color:'#F4F6F8'},
  caption:{fontSize:13,lineHeight:19,color:'#ADB5BF',marginVertical:4},text:{color:'#F4F6F8',fontSize:14},
  options:{flexDirection:'row',flexWrap:'wrap',gap:8,marginVertical:20},option:{padding:12,borderWidth:1,borderColor:'#56636B',borderRadius:10},
  selected:{backgroundColor:'#263D36'}});
