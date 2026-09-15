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
y reinicia Metro. Sin esa variable se abre la Home. El laboratorio incluye un
acceso a la Home real para comprobar la integración y los callbacks.

## Revisión actual: volumen local, solo Registrar

[VOLUME-PRESS.md](docs/VOLUME-PRESS.md) describe la revisión vigente. Una presión
local modifica el relieve aparente, la normal, la refracción y la reflexión del
vidrio. El campo tiene un núcleo y una transición suave que siguen el dedo.
El contorno exterior permanece fijo: ya no existe escala/descenso global del botón.
Solo el contenido nítido acompaña localmente hasta 0,9 dp, sin deformarse.

El material se prepara una vez desde el vector nativo de esta instancia. Tras esa
preparación, REST, CONTACT, HOLD y RELEASE pasan por el mismo shader/Canvas de Skia.
No se intercambian representaciones al presionar ni se recaptura el material en
cada gesto. La fuente es el componente aprobado, no una imagen de la referencia.
El fallback conserva el vector y la acción si no se puede preparar el renderer.

Hay dos pruebas de ablación independientes: apagar toda la deformación no deja
un tap rígido residual; apagar luz y acompañamiento del contenido deja únicamente
la deformación/refracción de las coordenadas. Debug y cuadrícula están apagados
por defecto. El laboratorio tiene el mismo tamaño lógico de botón que la Home.

**Límite del fondo:** se puede proporcionar una capa óptica controlada; la Home
intenta copiar el fondo nativo una vez en layout y aplica su diferencia refractada.
No es un backdrop externo en vivo durante cambios de fotos, animaciones o scroll.
El blur nativo y la identidad visual de reposo se conservan.

La navbar, Ver rutina, tokens visuales y layout no se rediseñan. La validación
nativa Android se ejecuta en Expo Go con JavaScript de producción y GPU software;
no se presenta como prueba en teléfono ni como APK/IPA release. La aceptación
perceptual final, iOS, haptics físicos y 60 FPS en hardware siguen pendientes.

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

Hay 97 checks host/numéricos (40 base + 11 material + 35 contacto + 11 pipeline).
No sustituyen una ejecución nativa. Las exportaciones comprueban JavaScript;
no producen APK/IPA. Con los SDK locales, usa `npm run android` o `npm run ios`.

## Integración y assets

`src/home/HomeScreen.tsx` es la pantalla; `src/home/` contiene sus módulos.
`src/liquid/` separa input, campo de volumen, renderer y preparación de recursos.
`examples/RegisterPhysicsLab.tsx` es el laboratorio; `examples/NavOnlyDemo.tsx`
conserva la demo de navegación independiente.

`HomeScreen` admite `activeTab`, `onTabChange`, `onRegister`, `onOpenRoutine`,
`onOpenNutrition`, `onAvatarPress`, `fontFamily`, `showAssetGuides` y `assets`.
Los slots son `backgroundImage`, `heroPlantImage`, `workoutImage` y `avatarImage`,
de tipo `ImageSourcePropType`. No se incluyen fotografías ni archivos de fuentes.
La app necesita `GestureHandlerRootView` y `SafeAreaProvider`, presentes en `App.tsx`.
La demo ofrece acciones locales, no backend ni persistencia.

`CONTACT-PIPELINE.md`, `LOCAL-SURFACE.md`, `LIQUID-PHASE-A.md` y otros registros
se conservan como historial, no como descripción del motor vigente.
