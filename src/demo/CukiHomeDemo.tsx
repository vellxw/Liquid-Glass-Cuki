import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../home';
import type { BottomNavId } from '../bottom-nav';
type Panel = { title: string; body: string };
const DESTINATIONS: Partial<Record<BottomNavId, Panel>> = {
  recetas: { title: 'Recetas', body: 'Destino seleccionado: Recetas.\nEste panel es una demo de interacción; conecta aquí tu pantalla de recetas.' },
  entrenar: { title: 'Entrenar', body: 'Hoy · Upper A\n19:30 · 6 ejercicios\n\nConecta aquí tu pantalla de entrenamiento.' },
  progreso: { title: 'Progreso', body: 'Tu planta\nSemana 18 de 52\n\nConecta aquí tu pantalla de progreso.' },
};
export function CukiHomeDemo() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<BottomNavId>('hoy');
  const [registrations, setRegistrations] = useState(0);
  const [panel, setPanel] = useState<Panel | null>(null);
  const register = () => {
    const next = registrations + 1;
    setRegistrations(next);
    setPanel({ title: 'Registrar', body: `Acción recibida.\nRegistros de demostración: ${next}.\n\nNo se ha guardado información en ningún servidor.` });
  };
  return <View style={styles.root}>
    <HomeScreen activeTab={activeTab}
      onTabChange={tab => { setActiveTab(tab); if (DESTINATIONS[tab]) setPanel(DESTINATIONS[tab]!); }}
      onRegister={register}
      onOpenRoutine={() => setPanel({ title: 'Hoy · Upper A', body: '19:30 · 6 ejercicios\n\nEste botón está conectado. Los detalles de la rutina no forman parte de la referencia.' })}
      onOpenNutrition={() => setPanel({ title: 'Nutrición de hoy', body: '1.620 de 2.000 kcal\nP 108 g · C 184 g · G 49 g\n\nValores de demostración de la referencia.' })}
      onAvatarPress={() => setPanel({ title: 'Franco', body: 'Perfil de demostración.\nEl avatar está preparado para recibir una imagen, sin cambiar su posición.' })}
    />
    <Modal visible={panel !== null} transparent animationType="fade" onRequestClose={() => setPanel(null)}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setPanel(null)} accessibilityLabel="Cerrar panel" accessibilityRole="button" />
        <View accessibilityViewIsModal style={[styles.panel, { paddingBottom: Math.max(24, insets.bottom) }]}>
          <ScrollView><Text style={styles.title}>{panel?.title}</Text><Text style={styles.body}>{panel?.body}</Text></ScrollView>
          <Pressable testID="demo-close" onPress={() => setPanel(null)} accessibilityRole="button" style={styles.close}>
            <Text style={styles.closeText}>Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#091113' },
  overlay: { flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' },
  panel: { backgroundColor: '#142024', borderColor: '#5A7079', borderWidth: 1,
    borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 24, maxHeight: '70%' },
  title: { color: '#F4F6F8', fontSize: 25, fontWeight: '600', marginBottom: 16 },
  body: { color: '#BDC8CD', fontSize: 16, lineHeight: 25, marginBottom: 22 },
  close: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: '#A2E7BD' },
  closeText: { color: '#12221A', fontSize: 16, fontWeight: '600' },
});
