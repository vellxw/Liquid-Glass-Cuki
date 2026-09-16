# CUKI · Registrar: cara presionable

React Native + Expo SDK 57 + TypeScript. La Home y la navbar conservan su diseño.
Esta revisión cambia únicamente el press del botón grande **Registrar +**: el marco
permanece fijo y la cara interior se comprime de forma visible, sin color dorado,
barridos, partículas, rotaciones o escala global.

## Abrir

Node 22.13.0 o posterior; Expo Go compatible con SDK 57.

```bash
npm install
npx expo start --go --clear
```

Para abrir el laboratorio, crea `.env.local` con:

```env
EXPO_PUBLIC_LIQUID_LAB=1
```

Reinicia Metro. Sin esa variable se abre la Home normal. Desde el laboratorio se
puede abrir la Home real y el banco A/B. Debug y cuadrícula están apagados inicialmente.

## Qué hace el press

Ambos biseles interiores convergen alrededor del contacto. Su recorrido visible es
una restricción geométrica, no una intensidad que después desaparece al multiplicar
máscaras. La entrada nominal dura 100 ms; mantener el dedo conserva la presión y
soltar recupera el reposo mediante un spring crítico. No se retrasa el callback para
completar una animación ni se requiere movimiento para activar un tap.

El texto, círculo y signo + se asientan solidariamente, como elementos nativos rígidos.
El recorrido nominal es 0,85 dp, alineado al píxel físico: en la prueba de 280 dpi se
resuelve como un píxel (0,57 dp). Las letras no se refractan, estiran ni escalan. La
cara y las coordenadas del dedo no se cuantizan.

El frame exterior, la apariencia de reposo, Ver rutina y la navbar permanecen intactos.
La luz modula los reflejos existentes; la geometría sigue respondiendo con la luz
adicional, los haptics y el acompañamiento del contenido desactivados.

El material nativo sigue montado. Skia compone una diferencia óptica local y transparente
en reposo. Los recursos se preparan por geometría/revisión y la preparación GPU se
realiza en el runtime UI, no dentro de cada drag. El fondo es una copia por revisión;
no se presenta como refracción en vivo de cualquier vista externa animada.

## Validación y límites

Documento vigente: [FACE-COMPRESSION.md](docs/FACE-COMPRESSION.md), con las mediciones,
ejecuciones y límites. Los documentos anteriores conservan el historial.

La revisión nativa midió **3,43 dp de recorrido combinado de los biseles interiores**,
con marco fijo, reposo y recuperación idénticos en las comparaciones de píxeles. No
se interpreta ese resultado como un estudio perceptual o certificación de tactilidad.
Las pruebas distinguen Expo Go del APK release; ninguna equivale a un teléfono físico.

No se certifican 60/120 FPS en hardware, haptics físicos, latencia de contacto a pantalla,
lectores de pantalla reales ni ejecución iOS. Los tiempos de los tokens no se presentan
como latencias medidas. Consulta el documento para los resultados completos, no solo
el promedio de fotogramas de una grabación.

## Comprobaciones

```bash
npm run typecheck
npm run check
npm run check:register
npm run check:liquid
node qa/liquid/pipeline-check.cjs
node qa/liquid/overlay-check.cjs
node qa/performance/check.cjs
node qa/premium/check.cjs
node qa/face/check.cjs
python -m unittest discover -s qa/performance -p 'test_*.py' -v
npx expo install --check
npm run export:android
npm run export:ios
```

126 comprobaciones estructurales y numéricas del host y cuatro tests del parser. Los tests
de fuente no sustituyen la ejecución nativa. Las exportaciones JavaScript no crean
APK/IPA. El workflow release compila un APK x86_64 con firma de prueba para emulador;
no es una distribución de tienda. Con SDK locales: `npm run android` / `npm run ios`.

## Código

`src/liquid/faceCompression.ts` define la cara y su mapa inverso de compresión.
`premiumPress.tokens.ts` centraliza el comportamiento. `LiquidPressable.tsx` gestiona
contacto, cancelación/reentrada, busy, accesibilidad y arbitraje con scroll. `VolumeSurface`
y los shaders realizan el dibujo localizado. `LocalRegisterArtwork` conserva el SVG
original y mueve el grupo vectorial del círculo junto al Text nativo.

`qa/face/validate.py` mide el desplazamiento real de los biseles y la rigidez del contenido
sobre PNGs nativos. El banco A/B, los scripts de MotionEvent, Perfetto y grabación siguen
separados de los assets de la app. No se incorpora ninguna imagen de referencia, fuente
tipográfica ni video como parte del componente.
