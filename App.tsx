import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { CukiHomeDemo } from './src/demo/CukiHomeDemo';
import { RegisterPhysicsLab } from './examples/RegisterPhysicsLab';

/** Same Home by default. The native bench is explicit, never a replacement screenshot. */
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        {process.env.EXPO_PUBLIC_LIQUID_LAB === '1' ? <RegisterPhysicsLab /> : <CukiHomeDemo />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
