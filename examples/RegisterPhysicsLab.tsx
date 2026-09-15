import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurTargetView } from 'expo-blur';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { GlassButton } from '../src/home/GlassButton';
import { LiquidPressable } from '../src/liquid/LiquidPressable';
import type { LiquidEvent, LiquidPhysics } from '../src/liquid/types';

type Report = { samples: number; meanMs: number; p95Ms: number; maxMs: number; intervalsOver20Ms: number };

/** QA ONLY: measures UI callback intervals, NOT JS/GPU cost or touch-to-photon latency. */
function FrameProbe({ physics, onReport }: { physics: LiquidPhysics; onReport: (r: Report) => void }) {
  const { pressure } = physics;
  const intervals = useSharedValue<number[]>([]);
  const running = useSharedValue(false);
  const probe = useFrameCallback(frame => {
    if (pressure.value > 0) {
      if (!running.value) { intervals.value = []; running.value = true; }
      else if (frame.timeSincePreviousFrame !== null && intervals.value.length < 1800) {
        intervals.modify(values => { 'worklet'; values.push(frame.timeSincePreviousFrame!); return values; });
      }
    } else if (running.value) {
      running.value = false;
      const values = [...intervals.value].sort((a,b) => a-b);
      if (values.length) scheduleOnRN(onReport, { samples: values.length,
        meanMs: values.reduce((a,b) => a+b,0)/values.length,
        p95Ms: values[Math.min(values.length-1,Math.floor(values.length*0.95))],
        maxMs: values[values.length-1], intervalsOver20Ms: values.filter(x=>x>20).length });
    }
  }, false);
  useEffect(() => { probe.setActive(true); return () => probe.setActive(false); }, [probe]);
  return null;
}

/** Native test surface, opt-in via EXPO_PUBLIC_LIQUID_LAB=1. No change to normal Home. */
export function RegisterPhysicsLab() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const target = useRef<View | null>(null);
  const [commits, setCommits] = useState(0);
  const [events, setEvents] = useState<LiquidEvent[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [reduced, setReduced] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [haptics, setHaptics] = useState(true);
  const [optics, setOptics] = useState(true);
  const scale = Math.min(1.6, (width-insets.left-insets.right-32)/230);
  const onPhase = useCallback((event: LiquidEvent) => setEvents(old => [...old.slice(-5), event]), []);
  const onReport = useCallback((value: Report) => { setReport(value); console.log('[liquid-ui-intervals]', JSON.stringify(value)); }, []);
  return <View style={styles.screen}>
    <BlurTargetView ref={target} style={StyleSheet.absoluteFill} />
    <ScrollView contentContainerStyle={{ paddingTop: insets.top+24, paddingBottom: insets.bottom+220, paddingHorizontal: 16 }}>
      <Text style={styles.title}>Registrar · Fase A</Text>
      <Text style={styles.note}>Mantén pulsado, desplaza ligeramente el dedo y suelta. Arrastra hacia fuera para cancelar. La acción no abre un modal en este laboratorio.</Text>
      <View style={styles.bench}>
        <LiquidPressable width={230*scale} height={61*scale} label="Registrar +" testID="lab-register"
          disabled={disabled} forceReducedMotion={reduced} haptics={haptics ? 'contact-and-commit' : 'off'}
          onPress={() => setCommits(value=>value+1)} onPhase={onPhase}>
          {physics => <>
            <GlassButton variant="primary" label="Registrar +" scale={scale} blurTarget={target}
              interaction={physics} opticsEnabled={optics} />
            <FrameProbe physics={physics} onReport={onReport} />
          </>}
        </LiquidPressable>
      </View>
      <Text style={styles.text} testID="lab-commits">Acciones: {commits}</Text>
      <View style={styles.row}><Text style={styles.text}>Forzar movimiento reducido</Text><Switch value={reduced} onValueChange={setReduced} accessibilityLabel="Forzar movimiento reducido" /></View>
      <View style={styles.row}><Text style={styles.text}>Deshabilitado</Text><Switch value={disabled} onValueChange={setDisabled} accessibilityLabel="Deshabilitar Registrar" /></View>
      <View style={styles.row}><Text style={styles.text}>Haptics</Text><Switch value={haptics} onValueChange={setHaptics} accessibilityLabel="Haptics del laboratorio" /></View>
      <View style={styles.row}><Text style={styles.text}>Óptica local</Text><Switch value={optics} onValueChange={setOptics} accessibilityLabel="Óptica local del laboratorio" /></View>
      <Button title="Limpiar medición" onPress={() => { setEvents([]); setReport(null); setCommits(0); }} />
      <Text style={styles.note}>Con óptica desactivada el descenso y la compresión deben seguir siendo claros. El ajuste de movimiento reducido del sistema siempre prevalece.</Text>
      <Text style={styles.text}>Eventos (no por frame)</Text>
      <Text style={styles.mono}>{events.map(e=>`${e.interactionId} ${e.phase} ${e.timestamp}`).join('\n') || 'Sin contacto'}</Text>
      <Text style={styles.text}>Intervalos del callback UI</Text>
      <Text style={styles.mono}>{report ? JSON.stringify(report,null,2) : 'Se mostrarán al soltar y asentarse.'}</Text>
      <Text style={styles.note}>Estos intervalos no certifican 60 fps de presentación, latencia táctil ni coste GPU. Perfila también una build release con las herramientas de la plataforma. El scroll tiene espacio extra para probar cancelación.</Text>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B1315' },
  title: { color: '#F4F6F8', fontSize: 24, fontWeight: '600' },
  text: { color: '#F4F6F8', fontSize: 15 },
  note: { color: '#ADB5BF', fontSize: 14, lineHeight: 21, marginVertical: 16 },
  mono: { color: '#ADB5BF', fontSize: 12, lineHeight: 18, marginVertical: 12 },
  bench: { alignItems: 'center', marginVertical: 30 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10 },
});
