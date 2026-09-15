# CUKI · Liquid Glass

Proyecto nativo React Native + Expo SDK 57 + TypeScript. La entrada normal es
la Home/Hoy completa, sin fotografías, con la barra inferior original.

## Ejecutar

Usa Node 22.13.0 o posterior y Expo Go compatible con SDK 57.

```bash
npm install
npx expo start --go --clear
```

Para el laboratorio de Registrar añade `EXPO_PUBLIC_LIQUID_LAB=1` a `.env.local`
y reinicia Metro. Sin esa variable se abre la Home.

## Revisión actual: solo Registrar

[CONTACT-PIPELINE.md](docs/CONTACT-PIPELINE.md) describe la revisión vigente.
La presión local sigue al dedo mediante Pan, Reanimated y Skia. Los uniforms
se consolidan una vez por frame UI; el shader trabaja en el área de contacto.
No se usan capturas de la referencia ni animaciones prerenderizadas.

El último brief adjunto vuelve a proponer +2 dp y escala 0,98. Se implementan
como apoyo mecánico **opcional**, separado del campo local. La Home combina
ambos; el laboratorio comienza con la depresión sola y permite activar el
apoyo. Las coordenadas ópticas se corrigen con la inversa de la pose.

Texto y círculo no se refractan. El resting state, los tokens visuales, Ver
rutina y los siete archivos de la barra inferior se conservan. Desactivar la
deformación en el laboratorio elimina también el apoyo mecánico.

**Límite:** se refracta la textura del material capturado en memoria, no el
backdrop externo de React Native en vivo. El BlurView permanece separado.
Las cifras de rendimiento y validación pertenecen a ejecuciones concretas;
consulta la evidencia y los IDs enlazados en el PR. No se declara la Fase A
aprobada ni se extiende a otros controles automáticamente.

## Comprobar

```bash
npm run check
npm run check:register
npm run check:liquid
node qa/liquid/pipeline-check.cjs
npm run typecheck
npx expo install --check
npm run export:android
npm run export:ios
```

Hay 98 checks host/numéricos (40 base + 11 material + 35 contacto + 12 pipeline).
No sustituyen una ejecución nativa. Las exportaciones comprueban JavaScript;
no producen APK/IPA. Con los SDK locales, usa `npm run android` o `npm run ios`.

## Integración y assets

`src/home/HomeScreen.tsx` es la pantalla; `src/home/` contiene sus módulos.
`src/liquid/` separa input, campo óptico y apoyo mecánico.
`examples/RegisterPhysicsLab.tsx` es el laboratorio; `examples/NavOnlyDemo.tsx`
conserva la demo de navegación independiente.

`HomeScreen` admite `activeTab`, `onTabChange`, `onRegister`, `onOpenRoutine`,
`onOpenNutrition`, `onAvatarPress`, `fontFamily`, `showAssetGuides` y `assets`.
Los slots de assets son `backgroundImage`, `heroPlantImage`, `workoutImage`
y `avatarImage`, de tipo `ImageSourcePropType`. Sin fuentes se conservan
superficies neutras. No se incluyen fotografías ni fuentes tipográficas.

La app necesita `GestureHandlerRootView` y `SafeAreaProvider`, ya presentes
en `App.tsx`. La demo ofrece acciones locales, no backend ni persistencia.

La documentación `LOCAL-SURFACE.md`, `LIQUID-PHASE-A.md` y los registros anteriores
se mantienen como historial; sus métricas no describen automáticamente esta revisión.
