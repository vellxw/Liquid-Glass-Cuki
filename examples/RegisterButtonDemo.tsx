import { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RegisterActionButton } from '../src/buttons/RegisterActionButton';
import { GlassButton } from '../src/home/GlassButton';
import { CukiHomeDemo } from '../src/demo/CukiHomeDemo';

/** A button demo, not a physics laboratory. No control of pressure/drag/optics. */
export function RegisterButtonDemo() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const target = useRef<View | null>(null);
  const [count, setCount] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [home, setHome] = useState(false);
  const [original, setOriginal] = useState(false);
  const scale = Math.min(1.6, (width - insets.left - insets.right) / 375);
  if (home) return <CukiHomeDemo />;
  return <View style={styles.screen}>
    <BlurTargetView ref={target} style={StyleSheet.absoluteFill} pointerEvents="none" />
    <ScrollView testID="button-demo-scroll" contentContainerStyle={{paddingTop: insets.top + 24, paddingHorizontal: 24, paddingBottom: insets.bottom + 24}}>
      <Text style={styles.title}>Registrar</Text>
      <Text style={styles.note}>
        {Platform.OS === 'ios' ? 'Diseño Black Glass original. Botón nativo sin simulación de presión.' : 'Botón de acción con vidrio estático. Sin motor de presión.'}
      </Text>
      <View style={styles.button}>
        {original ? <GlassButton variant="primary" label="Registrar +" scale={scale}
          blurTarget={target} testID="original-register" onPress={() => setCount(value => value + 1)} /> :
          <RegisterActionButton scale={scale} blurTarget={target} testID="demo-register"
            disabled={disabled} busy={busy} onPress={() => setCount(value => value + 1)} />}

      </View>
      <Text testID="demo-count" style={styles.count}>Acciones: {count}</Text>
      <View style={styles.row}><Text style={styles.text}>Deshabilitado</Text>
        <Switch testID="demo-disabled" accessibilityLabel="Deshabilitado" value={disabled} onValueChange={setDisabled} /></View>
      <View style={styles.row}><Text style={styles.text}>Ocupado</Text>
        <Switch testID="demo-busy" accessibilityLabel="Ocupado" value={busy} onValueChange={setBusy} /></View>
      <Pressable testID="demo-open-home" accessibilityRole="button" accessibilityLabel="Ver Home"
        onPress={() => setHome(true)} style={styles.link}><Text style={styles.text}>Ver Home</Text></Pressable>
      <View style={styles.row}><Text style={styles.text}>Comparar diseño original</Text>
        <Switch testID="demo-original" accessibilityLabel="Comparar diseño original" value={original} onValueChange={setOriginal} /></View>
      <Text style={styles.note}>Tocar ejecuta una acción. Mantener no repite. Arrastrar no manipula el vidrio. El scroll conserva su comportamiento normal.</Text>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#0B1315'},
  title: {color: '#F5F7F8', fontSize: 28, fontWeight: '600'},
  text: {color: '#F5F7F8', fontSize: 16},
  note: {color: '#ADB5BF', fontSize: 15, lineHeight: 23, marginVertical: 20},
  button: {alignItems: 'center', marginVertical: 32},
  count: {color: '#F5F7F8', fontSize: 20, marginBottom: 20},
  row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8},
  link: {alignSelf: 'flex-start', padding: 14, marginVertical: 16},
});
