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
npm run typecheck
npx expo-doctor@latest
npm run export:android
npm run export:ios
```

`check` ejecuta **40 comprobaciones estructurales con mocks**. No es una prueba en un emulador. Los comandos `export:*` comprueban el bundle JavaScript; tampoco compilan una aplicación nativa. Para compilar, con los SDK locales correspondientes, usa `npm run android` o `npm run ios`.

El workflow de GitHub comprueba dependencias, tipos, estructura y exportaciones JavaScript en cada publicación. Consulta su ejecución; incluir el workflow no significa que ya haya pasado.

## Contenido

```text
App.tsx                         SafeAreaProvider y demo de Home
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
examples/NavOnlyDemo.tsx         Demo anterior conservada
qa/                             Pruebas y revisión vectorial
```

## Interacción

Hoy es el destino inicial. Los cinco destinos son presionables. Registrar responde tanto desde el botón principal como desde la barra y cuenta pulsaciones durante la sesión. Perfil, nutrición y Ver rutina abren paneles de demostración. No hay backend ni almacenamiento persistente.

## Integración sin la demo

```tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/home';

export default function App() {
  return (
    <SafeAreaProvider>
      <HomeScreen
        onRegister={() => console.log('Registrar')}
        onOpenRoutine={() => console.log('Ver rutina')}
      />
    </SafeAreaProvider>
  );
}
```

`HomeScreen` admite `activeTab`, `onTabChange`, `onRegister`, `onOpenRoutine`, `onOpenNutrition`, `onAvatarPress`, `fontFamily`, `showAssetGuides` y `assets`.

Los slots de `assets` son `backgroundImage`, `heroPlantImage`, `workoutImage` y `avatarImage`, todos de tipo `ImageSourcePropType`. Sin fuentes se muestran superficies neutras; añadir fuentes no cambia las cajas. No se incluyen fotografías, la captura de referencia ni fuentes tipográficas.

## Geometría y estado de validación

La Home utiliza un viewport de referencia de **750 × 1538 píxeles**, equivalente a **375 × 769 puntos**. Se mantiene un solo factor de escala; las pantallas cortas permiten scroll sin reducir la barra. En tablet se limita el ancho del contenido a 600 puntos.

Los siete archivos de `src/bottom-nav` conservan exactamente sus hashes del paquete anterior de SDK 57. La entrega previa sólo había adjuntado `HomeScreen.tsx` y `App.tsx`; esta entrega completa sus módulos faltantes. No se atribuyen a esta reconstrucción las métricas visuales históricas de otra versión.

En el entorno de preparación pasaron las 40 comprobaciones estructurales. La instalación de npm estuvo bloqueada por DNS (`EAI_AGAIN`), así que **no se verificaron localmente la comprobación completa de tipos, los bundles, la compilación nativa ni la ejecución en Expo Go**. No se afirma una coincidencia pixel-perfect en dispositivo. Consulta `docs/VALIDACION.md` y los resultados del workflow.
