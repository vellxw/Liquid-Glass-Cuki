# Corrección de incompatibilidad con Expo Go: SDK 55 → SDK 57

El paquete anterior declaraba Expo SDK 55. El mensaje del dispositivo indica que el Expo Go instalado admite SDK 57. Esta revisión actualiza el manifiesto de dependencias; no cambia los iconos, las medidas ni los efectos de la barra.

## Abrir esta revisión desde una carpeta nueva

Detén el Metro anterior con Ctrl+C. Extrae el ZIP en una carpeta diferente, entra en `bottom-nav-glass` y comprueba `node --version`: usa Node 22.13.0 o posterior. Si tienes nvm, ejecuta `nvm install` y `nvm use` dentro del proyecto.

```sh
npm install
npx expo install --fix
npx expo-doctor@latest
npm run typecheck
npm run check
npx expo start --go --clear
```

Ejecuta cada comando cuando haya terminado correctamente el anterior. Abre el nuevo QR con Expo Go para SDK 57. No reutilices el Metro de la carpeta anterior.

## Actualizar la carpeta anterior sin sustituir tus fuentes

Guarda una copia de tus archivos antes de migrar. Expo recomienda actualizar un SDK cada vez. Con Metro detenido y Node actualizado, ejecuta desde la carpeta que contiene `package.json`:

```sh
npx expo install "expo@^56.0.0" --fix
npx expo-doctor@latest
npm run typecheck
npm run check

npx expo install "expo@^57.0.17" --fix
npx expo-doctor@latest
npm run typecheck
npm run check

npx expo start --go --clear
```

No pruebes la etapa intermedia (SDK 56) con tu Expo Go para SDK 57. Revisa cualquier error de instalación, tipos o Expo Doctor antes de continuar. No uses `--force` o `--legacy-peer-deps` para ocultar conflictos.

El `app.json` original no declara `sdkVersion`, por lo que no hay que modificar ese campo. La migración requiere actualizar los paquetes; cambiar solamente un número en `app.json` no la realiza.

Esta demo no incluye directorios nativos `android/` o `ios/`. Si los generaste para compilar y tienen cambios propios, consérvalos: las instrucciones anteriores están destinadas al uso con Expo Go, no a migrar manualmente esos proyectos nativos.

## Versiones de partida del manifiesto

| Paquete | Versión |
| --- | --- |
| expo | ~57.0.17 |
| react | 19.2.3 |
| react-native | 0.86.3 |
| expo-blur | ~57.0.3 |
| react-native-svg | 15.15.4 |
| react-native-safe-area-context | ~5.7.0 |
| @react-native-masked-view/masked-view | 0.3.2 |
| typescript | ~6.0.3 |

`npx expo install --fix` puede ajustar estas versiones a la revisión de Expo 57 instalada. Conserva el `package-lock.json` que genere tu instalación para reproducirla.

## Verificación y límites de esta entrega

Se revisaron las versiones en la documentación oficial de Expo y se volvió a ejecutar la comprobación estructural con hosts simulados. No se pudieron instalar las dependencias desde el entorno de entrega (fallo de resolución DNS del registro). No se entrega un archivo de bloqueo generado ni se afirma haber ejecutado Expo Go, una compilación nativa o la comprobación completa de tipos con las nuevas dependencias.

## Fuentes oficiales consultadas

- Actualización: https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/
- Expo SDK 57 y React Native: https://expo.dev/changelog/sdk-57
- React y Node: https://docs.expo.dev/versions/v57.0.0/
- Blur: https://docs.expo.dev/versions/v57.0.0/sdk/blur-view/
- SVG: https://docs.expo.dev/versions/v57.0.0/sdk/svg/
- Área segura: https://docs.expo.dev/versions/v57.0.0/sdk/safe-area-context/
- Máscara: https://docs.expo.dev/versions/v57.0.0/sdk/masked-view/
- TypeScript: https://expo.dev/changelog/sdk-56
