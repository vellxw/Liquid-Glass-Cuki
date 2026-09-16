# CUKI · Registrar, un botón

React Native + Expo SDK 57 + TypeScript. Registrar ya no tiene un motor de presión.

## Ejecutar

Node >=22.13.0. Expo Go compatible con SDK 57.

```bash
npm install
npx expo start --go --clear
```

Desde un development build anterior, recompila: las dependencias nativas cambiaron.
No se necesitan Skia, Reanimated, Worklets, Gesture Handler ni Expo Haptics.

## Comportamiento

- **iOS 26+:** `Button` real de SwiftUI, a través de `@expo/ui`, con `buttonStyle('glass')` y forma de cápsula. Apple controla el material y la respuesta al contacto. No se añade una segunda simulación encima.
- **iOS anterior:** el mismo botón nativo con estilo `bordered`.
- **Android:** `Pressable` normal de React Native sobre el Black Glass vectorial estático ya existente. Tiene estado pulsado, acción al soltar y cancelación nativa al hacer scroll. No es el material propietario de Apple.

Tocar ejecuta la acción una vez. Mantener no la repite. Arrastrar no deforma el vidrio.
Disabled y busy bloquean la acción y se exponen a accesibilidad. No hay delays de acción,
compresión local, lentes, shaders propios, cachés de screenshots ni animaciones por frame.

**El aspecto del botón en iOS es ahora el del sistema, no una réplica del SVG anterior.**
La Home, su distribución, Ver rutina y los siete archivos de la navbar se conservan.
El botón Registrar de la navegación inferior no se modifica.

## Código

- `src/buttons/RegisterActionButton.ios.tsx`: control SwiftUI de Apple.
- `src/buttons/RegisterActionButton.tsx`: alternativa React Native estática.
- `src/home/PrimaryRegisterButton.tsx`: integración en la Home.
- `src/home/GlassButton.tsx`: vidrio estático compartido; ningún motor de interacción.

Los antiguos motores, laboratorios de presión y benchmarks de shaders se eliminaron
del árbol actual. Permanecen recuperables en el historial de Git; no se cargan al abrir CUKI.

## Demo opcional

Crea `.env.local` con `EXPO_PUBLIC_BUTTON_DEMO=1` y reinicia Metro. La demo tiene un contador,
estados deshabilitado/ocupado y acceso a la Home. Sin la variable, la entrada sigue siendo la Home.
La variable antigua `EXPO_PUBLIC_LIQUID_LAB` ya no activa nada.

## Comprobaciones

```bash
npm run typecheck
npm run check
npm run check:register
npm run check:button
npx expo install --check
npm run export:android
npm run export:ios
```

Los tests del host no simulan UIKit/SwiftUI ni certifican FPS. Los workflows nativos
conservan capturas y grabaciones sin sintetizar movimiento. No se promete una tasa de
FPS sin medirla en el dispositivo correspondiente.

## Fuentes de la integración

- Expo SDK 57 / SwiftUI Button: https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/button/
- Apple GlassButtonStyle: https://developer.apple.com/documentation/swiftui/glassbuttonstyle

Los estilos glass requieren iOS 26+ y una compilación con Xcode 26+. El selector por
versión usa bordered en iOS anterior. El sistema conserva sus preferencias de accesibilidad.
