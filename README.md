# CUKI · Black Glass original, botón normal

Proyecto React Native + Expo SDK 57 + TypeScript. Registrar recupera el diseño
Black Glass aprobado: el material vectorial, reflejos, círculo +, tipografía,
proporciones y posiciones originales. La Home y la navbar no se rediseñan.

## Interacción

En iOS sigue siendo un `Button` real de SwiftUI mediante `@expo/ui`. Ahora utiliza
`buttonStyle('plain')` y aloja el dibujo nativo original en `RNHostView`: el estilo
`glass` del sistema ya no reemplaza la apariencia de CUKI. Plain conserva el label
sin decoración propia en reposo y deja la interacción al control de Apple.

En Android sigue siendo un Pressable ordinario con el mismo dibujo. Los estados
normal, deshabilitado/ocupado y la acción de Registrar están separados del material.
No hay deformación local, shaders, captura de texturas, gestos Pan ni springs propios.
No se han reintroducido Skia, Reanimated, Worklets, Gesture Handler o Expo Haptics.

La estética es el Black Glass original de CUKI, **no la superficie Liquid Glass
propietaria del sistema operativo**. Se conserva la semántica nativa sin imponer
el diseño visual del botón estándar de Apple. Texto e icono no son imágenes.

## Ejecutar

Node 22.13.0 o posterior y Expo Go compatible con SDK 57.

```bash
npm install
npx expo start --go --clear
```

Sin variables adicionales se abre la Home. Demo de botón opcional: poner
`EXPO_PUBLIC_BUTTON_DEMO=1` en `.env.local` y reiniciar Metro. Incluye una comparación
con el dibujo original en la misma caja, además de contador, disabled y busy.
La variable antigua `EXPO_PUBLIC_LIQUID_LAB` no activa ningún motor de presión.

## Comprobar

```bash
npm run typecheck
npm run check
npm run check:register
npm run check:button
npx expo install --check
npm run export:android
npm run export:ios
```

64 comprobaciones del host: 17 de navbar, 23 de Home, 11 de material y 13 del botón.
El dibujo se compara contra un fixture del componente anterior, en cuatro escalas
y en ambas variantes. Son tests de fuente; no certifican una captura nativa.
El protocolo XCTest verifica un botón nativo y guarda una comparación original/restaurado.
`python qa/button/compare-ios.py <carpeta-de-screenshots-exportados>` compara los PNGs
sin deformación, reescalado ni máscaras interiores.

Las exportaciones JavaScript no equivalen a compilar un APK/IPA. Las pruebas de
simulador tampoco certifican FPS o latencia táctil en un teléfono real.

Documento vigente: `docs/RESTORED-APPEARANCE.md`. `docs/NATIVE-BUTTON.md` conserva
el informe histórico de la entrega con apariencia de sistema, sustituida ahora.
