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
y reinicia Metro. Desde el laboratorio puedes abrir la Home real y el banco A/B.
Sin esa variable se abre la Home. Debug y cuadrícula están apagados por defecto.

## Revisión actual: rendimiento medido, solo Registrar

[RENDER-PERFORMANCE.md](docs/RENDER-PERFORMANCE.md) documenta la implementación,
los candidatos medidos, la prueba prolongada y sus límites.

La presión local sigue al dedo mediante Pan, Reanimated y Skia. Se conserva el
material SVG nativo y Skia compone solo la diferencia óptica local. El inserto +
es rígido y no se refracta. No hay escala ni descenso global de la cápsula;
únicamente el texto puede acompañar hasta 0,9 dp sin deformarse.

La variante optimizada limita el dibujo al soporte completo del contacto y evita
cálculos/muestreos redundantes. No cambia resolución, radio, profundidad, luz ni
spring. Usa las coordenadas directamente: el agrupamiento adicional por cuadro
quedó como candidato de diagnóstico, no como modo de producción.

La comparación nativa intercalada dio una mediana de 36,713 FPS para baseline y
41,659 FPS para optimized (+13,472 %) en el mismo emulador. **No acredita 60 FPS
ni rendimiento de un teléfono físico.** La prueba utilizó un APK release x86_64
independiente, sin Expo Go ni Metro. Los videos de entrega provienen de ese APK.

El resultado aprobado, layout, Ver rutina, física y los siete archivos de navbar
permanecen protegidos. No se fusiona automáticamente ni se extiende a otros controles.
La refracción del fondo nativo usa una copia de layout, no un backdrop externo en vivo.

## Comprobar

```bash
npm run check
npm run check:register
npm run check:liquid
node qa/liquid/pipeline-check.cjs
node qa/liquid/overlay-check.cjs
node qa/performance/check.cjs
python -m unittest discover -s qa/performance -p 'test_*.py' -v
npm run typecheck
npx expo install --check
npm run export:android
npm run export:ios
```

Son 106 comprobaciones host/numéricas y 4 pruebas del parser; no sustituyen
las pruebas nativas. Las exportaciones comprueban JavaScript, no generan APK/IPA.
El workflow `performance-release.yml` sí compila un APK de prueba y ejecuta A/B,
Perfetto, tres minutos de contactos repetidos y los videos nativos. Los parámetros
y el entorno exactos están documentados; no se presentan como pruebas en hardware.

## Integración y assets

`src/home/HomeScreen.tsx` es la pantalla; `src/home/` contiene sus módulos.
`src/liquid/` separa input, campo óptico, recursos y configuración de rendimiento.
`examples/RegisterPhysicsLab.tsx` es el laboratorio; `GlassPerformanceBench.tsx`
es el banco A/B. `examples/NavOnlyDemo.tsx` conserva la demo de navegación.

`HomeScreen` admite `activeTab`, `onTabChange`, `onRegister`, `onOpenRoutine`,
`onOpenNutrition`, `onAvatarPress`, `fontFamily`, `showAssetGuides` y `assets`.
Los slots son `backgroundImage`, `heroPlantImage`, `workoutImage` y `avatarImage`,
de tipo `ImageSourcePropType`. No se incluyen fotografías ni archivos de fuentes.
`GestureHandlerRootView` y `SafeAreaProvider` ya están en `App.tsx`.
La demo ofrece acciones locales; no tiene backend ni persistencia.

Los documentos `CONTACT-PIPELINE.md`, `LOCAL-SURFACE.md`, `LIQUID-PHASE-A.md` y
los anteriores se mantienen como historial, no como descripción del modo vigente.
