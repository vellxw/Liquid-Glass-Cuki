# CUKI · Liquid Glass

Proyecto nativo **React Native + Expo SDK 57 + TypeScript**. La entrada es la Home/Hoy completa, con espacios neutros para fotografías y la barra inferior original.

## Ejecutar

Node **22.13.0 o posterior**, npm y Expo Go compatible con SDK 57.

```bash
npm install
npx expo start --go --clear
```

Escanea el QR nuevo. El ordenador y el teléfono deben poder comunicarse por la red local.
Si Expo detecta desajustes de dependencias, ejecuta `npx expo install --fix` y reinicia Metro.

## Comprobar

```bash
npm run check
npm run check:register
npm run check:liquid
npm run typecheck
npx expo-doctor@latest
npm run export:android
npm run export:ios
```

`check` ejecuta **40 comprobaciones estructurales con mocks**; `check:register` añade 11 del material y `check:liquid` añade 32 de la física. Son **83 comprobaciones host/numéricas** en total. No es una prueba en un emulador. Los comandos `export:*` comprueban el bundle JavaScript; tampoco compilan una aplicación nativa. Para compilar, con los SDK locales correspondientes, usa `npm run android` o `npm run ios`.

El workflow de GitHub comprueba dependencias, tipos, estructura y exportaciones JavaScript en cada publicación. Consulta su ejecución; incluir el workflow no significa que ya haya pasado.

## Contenido

```text
App.tsx                         GestureHandlerRootView, safe areas y demo de Home
src/home/HomeScreen.tsx          Pantalla y dock fijo con safe areas
src/home/HomeContent.tsx         Composición del contenido
src/home/HomeHeader.tsx          Saludo y avatar neutro
src/home/NutritionSection.tsx    Título, calorías y macros
src/home/CaloriesRing.tsx        Anillo vectorial
src/home/PlantProgress.tsx       Textos y barra de la planta
src/home/GlassButton.tsx         Material de los botones Home
src/home/NextWorkoutCard.tsx     Entrenamiento y Ver rutina
src/home/PhotoSlot.tsx           Cuatro espacios intercambiables
src/home/tokens.ts               Medidas, colores y textos
src/demo/CukiHomeDemo.tsx        Interacciones y panel de feedback
src/bottom-nav/                  Barra original, sin modificaciones
src/liquid/                     Motor de press reutilizable (solo Registrar activo)
examples/RegisterPhysicsLab.tsx  Laboratorio nativo opt-in de la Fase A
examples/NavOnlyDemo.tsx         Demo anterior conservada
qa/                             Pruebas y revisión vectorial
```

## Interacción

Hoy es el destino inicial. Los cinco destinos son presionables. Registrar responde tanto desde el botón principal como desde la barra y cuenta pulsaciones durante la sesión. Perfil, nutrición y Ver rutina abren paneles de demostración. No hay backend ni almacenamiento persistente.

### Liquid physics · Fase A

Solo el botón grande Registrar incorpora el nuevo press físico: descenso, escala uniforme, oclusión local y spring de recuperación. Ver rutina y la navbar no adoptan todavía el motor. No se rediseña el estado de reposo. La óptica es un fallback vectorial controlado; **no refracta el backdrop real**.

Para abrir el banco de pruebas, añade `EXPO_PUBLIC_LIQUID_LAB=1` a `.env.local` y reinicia Metro. Elimínalo para volver a la Home. Parámetros, reduced motion, haptics, límites y protocolo de grabación: [docs/LIQUID-PHASE-A.md](docs/LIQUID-PHASE-A.md).

## Integración sin la demo

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/home';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <HomeScreen
          onRegister={() => console.log('Registrar')}
          onOpenRoutine={() => console.log('Ver rutina')}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

`HomeScreen` admite `activeTab`, `onTabChange`, `onRegister`, `onOpenRoutine`, `onOpenNutrition`, `onAvatarPress`, `fontFamily`, `showAssetGuides` y `assets`.

Los slots de `assets` son `backgroundImage`, `heroPlantImage`, `workoutImage` y `avatarImage`, todos de tipo `ImageSourcePropType`. Sin fuentes se muestran superficies neutras; añadir fuentes no cambia las cajas. No se incluyen fotografías, la captura de referencia ni fuentes tipográficas.

## Geometría y estado de validación

La Home utiliza un viewport de referencia de **750 × 1538 píxeles**, equivalente a **375 × 769 puntos**. Se mantiene un solo factor de escala; las pantallas cortas permiten scroll sin reducir la barra. En tablet se limita el ancho del contenido a 600 puntos.

Los siete archivos de `src/bottom-nav` conservan exactamente sus hashes del paquete anterior de SDK 57. La entrega previa sólo había adjuntado `HomeScreen.tsx` y `App.tsx`; esta entrega completa sus módulos faltantes. No se atribuyen a esta reconstrucción las métricas visuales históricas de otra versión.

**Historial de la entrega base:** en el entorno de preparación pasaron las 40 comprobaciones estructurales. La instalación de npm estuvo bloqueada por DNS (`EAI_AGAIN`), así que **no se verificaron localmente la comprobación completa de tipos, los bundles, la compilación nativa ni la ejecución en Expo Go**. No se afirma una coincidencia pixel-perfect en dispositivo. Consulta `docs/VALIDACION.md` y los resultados del workflow.
