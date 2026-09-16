import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { CukiHomeDemo } from './src/demo/CukiHomeDemo';
import { RegisterButtonDemo } from './examples/RegisterButtonDemo';

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      {process.env.EXPO_PUBLIC_BUTTON_DEMO === '1' ? <RegisterButtonDemo /> : <CukiHomeDemo />}
    </SafeAreaProvider>
  );
}
