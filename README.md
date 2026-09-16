# CUKI · Registrar Premium

React Native + Expo SDK 57 + TypeScript. La entrada normal sigue siendo la Home.
Esta revisión aplica una pulsación **fija, contenida y Black Glass**, únicamente al
botón grande Registrar +: no hay escala/traslación/rotación global, giro de color a
dorado, partículas ni barridos. Texto, círculo y signo + permanecen inmóviles.

## Abrir el proyecto

Node **22.13.0 o posterior** y Expo Go compatible con SDK 57.

```bash
npm install
npx expo start --go --clear
```

Para el laboratorio, crea `.env.local` con:

```env
EXPO_PUBLIC_LIQUID_LAB=1
```

Reinicia Metro. El laboratorio incluye acceso a la Home real y al banco A/B.
Sin esa variable se abre directamente la Home. Debug y cuadrícula están apagados.

## Qué cambia

La superficie se comprime localmente bajo el contacto; los biseles interiores
convergen de forma sutil y los reflejos existentes se redistribuyen sin nueva emisión
de color. La presión permanece estable mientras se mantiene el dedo y se recupera
con un único spring crítico, sin deriva lateral residual. Un tap quieto se activa
desde DOWN, sin depender de que llegue un MOVE. No se retrasa el callback para acabar
una animación ni se impone una duración mínima al contacto.

El scroll de la Home puede comenzar sobre Registrar: un desplazamiento vertical
predominante cancela la acción y deja desplazarse a la página. Una cancelación no
se reactiva simplemente por volver a entrar. El control reutilizable ofrece `busy`,
`disabled`, accesibilidad y reduced motion. Los haptics se emiten por eventos, no por
fotogramas. La navbar, Ver rutina, iconos y material estático permanecen intactos.

La ruta óptica usa Gesture Handler → shared values UI → Skia. El material nativo
siempre queda montado; Skia añade solamente una diferencia óptica localizada.
Los recursos se preparan fuera del contacto y se invalidan por revisión, no por
cada movimiento. El fondo nativo es una copia al preparar la revisión, **no una
refracción en vivo de cualquier escena externa animada**.

## Validación y límites

[PREMIUM-PRESS.md](docs/PREMIUM-PRESS.md) documenta el comportamiento actual, las
correcciones encontradas en pruebas, resultados nativos y límites de validación.
Los otros documentos quedan como historial de los modelos anteriores.

119 verificaciones host/numéricas y cuatro tests del parser, además de
TypeScript y exportaciones Android/iOS. La evidencia nativa distingue Expo Go de
APK release independiente; ambos se ejecutan en un emulador Android con GPU por
software. No se certifican haptics físicos, latencia ≤50 ms, 60/120 FPS en teléfono,
lectores de pantalla reales o ejecución iOS. Los tiempos nominales de animación
no son medidas de latencia de presentación. La ejecución release registró 27,48 FPS
en el drag sin grabación y demora inicial de procesamiento; esos objetivos aún no
se consideran cumplidos. El A/B final no permite afirmar una mejora estadística
porque sus registros de la capa están fragmentados.

```bash
npm run typecheck
npm run check
npm run check:register
npm run check:liquid
node qa/liquid/pipeline-check.cjs
node qa/liquid/overlay-check.cjs
node qa/performance/check.cjs
node qa/premium/check.cjs
python -m unittest discover -s qa/performance -p 'test_*.py' -v
npx expo install --check
npm run export:android
npm run export:ios
```

Las exportaciones JavaScript no producen APK/IPA. El workflow de benchmark compila
un APK x86_64 con firma de prueba para el emulador, no una release de tienda.
Con los SDK nativos locales se puede usar `npm run android` / `npm run ios`.

## Organización

`src/liquid/premiumPress.tokens.ts` centraliza los parámetros de la pulsación.
`LiquidPressable.tsx` controla el contacto y la acción; `volumeField.ts` y
`volumeShader.ts` definen la compresión. `VolumeSurface.tsx` compone el resultado.
`useNativeMaterialCache.ts` y `prepareOpticalPipeline.ts` preparan los recursos.
`PremiumScrollScope.ts` coordina el scroll nativo sin enviar posiciones por frame a JS.

`src/home/` conserva los módulos de la Home. `src/bottom-nav/` es la barra original.
Los cuatro slots de `HomeScreen.assets` siguen siendo `backgroundImage`,
`heroPlantImage`, `workoutImage` y `avatarImage`. No se incluyen fotografías,
fuentes tipográficas, capturas de la referencia o videos como recursos de la UI.
La demo usa acciones locales, no backend ni persistencia.
