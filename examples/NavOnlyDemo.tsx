import { useRef, useState } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { SafeAreaProvider, initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNavGlass, ReferenceFrame, type BottomNavId } from '../src/bottom-nav';

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <DemoScreen />
    </SafeAreaProvider>
  );
}

function DemoScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const targetRef = useRef<View | null>(null);
  const [activeTab, setActiveTab] = useState<BottomNavId>('hoy');
  const [registerCount, setRegisterCount] = useState(0);
  const [referenceMode, setReferenceMode] = useState(false);
  const labels: Record<BottomNavId, string> = {
    hoy: 'Hoy', recetas: 'Recetas', registrar: 'Registrar', entrenar: 'Entrenar', progreso: 'Progreso',
  };
  const navProps = {
    activeTab,
    onChange: setActiveTab,
    onRegisterPress: () => setRegisterCount(count => count + 1),
    blurTarget: targetRef,
  };
  const availableWidth = Math.max(1, width - insets.left - insets.right);
  const navWidth = Math.min(600, availableWidth * (1912 / 2048));

  return (
    <View style={styles.screen}>
      <StatusBar hidden={referenceMode} barStyle="light-content" />
      {/* Keep screen content in the blur target, and the nav AFTER it, as a sibling. */}
      <BlurTargetView ref={targetRef} style={StyleSheet.absoluteFill}>
        <View style={styles.background} />
        {!referenceMode && (
          <View style={[styles.copy, { paddingTop: insets.top + 48 }]}>
            <Text style={styles.eyebrow}>DEMO NATIVA</Text>
            <Text accessibilityLiveRegion="polite" style={styles.title}>{labels[activeTab]}</Text>
            <Text style={styles.help}>Toca los cinco destinos. Registrar también actualiza el contador.</Text>
            <Text style={styles.counter}>Registros: {registerCount}</Text>
            <Pressable onPress={() => setReferenceMode(true)} style={styles.previewButton} accessibilityRole="button">
              <Text style={styles.previewText}>Ver encuadre de referencia</Text>
            </Pressable>
          </View>
        )}
      </BlurTargetView>
      {referenceMode ? (
        <View style={styles.reference}>
          <ReferenceFrame width={width} {...navProps} />
          <Pressable
            style={styles.back}
            accessibilityRole="button"
            accessibilityLabel="Volver a la demo"
            onPress={() => setReferenceMode(false)}
          >
            <Text style={styles.backText}>Volver a la demo</Text>
          </Pressable>
        </View>
      ) : (
        <View pointerEvents="box-none" style={[
          styles.dock,
          { left: insets.left, right: insets.right, bottom: Math.max(12, insets.bottom) },
        ]}>
          <BottomNavGlass width={navWidth} {...navProps} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  background: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000' },
  copy: { paddingHorizontal: 28, maxWidth: 520 },
  eyebrow: { color: '#667078', fontSize: 11, letterSpacing: 2 },
  title: { color: '#F5F7F8', fontSize: 36, fontWeight: '400', marginTop: 14 },
  help: { color: '#919CA5', fontSize: 15, lineHeight: 23, marginTop: 16 },
  counter: { color: '#A3B4B3', fontSize: 14, marginTop: 18 },
  previewButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: 24 },
  previewText: { color: '#D6E5E8', fontSize: 14 },
  dock: { position: 'absolute', alignItems: 'center' },
  reference: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  back: { position: 'absolute', top: 52, right: 22, padding: 12, minHeight: 44 },
  backText: { color: '#78858B', fontSize: 12 },
});
