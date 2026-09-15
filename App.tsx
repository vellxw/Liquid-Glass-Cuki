import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { CukiHomeDemo } from './src/demo/CukiHomeDemo';

/** Expo Go SDK 57 entry point. The previous nav-only demo remains in examples/. */
export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <CukiHomeDemo />
    </SafeAreaProvider>
  );
}
