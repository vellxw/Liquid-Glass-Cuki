# CUKI · Liquid physics · Fase A

## Alcance

Prototipo funcional **solo de Registrar + de la Home**. Base: `67142442f650cc45b8abfbcb310850f51329e776`, la revisión del material pulido. `main` y la rama del pulido no se sobrescriben. El motor se publica en una rama derivada; no se avanza a Ver rutina, navbar, morphs, toggles o sliders antes de validar esta primera respuesta.

El material estático `RegisterButtonMaterial.tsx`, sus parámetros, el texto, círculo, icono, geometría, blur y los siete archivos de navegación se conservan. La antigua ruta estática `GlassButton` sigue disponible y conserva el resultado de secondary. Solo el punto de integración `PrimaryRegisterButton` activa la física nueva.

## Lectura del video (fuente del usuario, no diseño de CUKI)

Archivo: `0czeZpySbsiLWRP_.mp4`. ffprobe: 1528 × 1080, 60/1 fps, 2537 frames, duración 42.283333 s, un stream de video y ninguno de audio. Se inspeccionó una hoja general cada 2 s y **163 cuadros consecutivos**, frames 1008–1170 (16.800–19.500 s), de la presión y sus cortes de montaje.

- 0–8 s: cambios de geometría entre cápsula, círculo y superficie con opciones. Sirven para una futura fase de morph, no se implementan ahora.
- Aproximadamente 10–16 s: el objeto se superpone a diferentes fondos y cambia el contenido óptico percibido.
- **Frame 1010 / 16.833 s**: corte al dedo y la pieza elevada. El dedo ya aparece muy próximo a la superficie; no tenemos el timestamp de un evento táctil.
- Aproximadamente 17.0–18.0 s: la zona bajo el dedo se hunde, el perfil interno y la banda especular se redistribuyen y la distancia aparente a la sombra cambia. El encuadre/perspectiva también evolucionan; no se extraen milímetros o dp de ese desplazamiento.
- Aproximadamente 18.0–19.117 s: estado comprimido, sin un rebote evidente. **Frame 1148 / 19.133 s**: corte al toggle. El plano no muestra una recuperación completa.
- 19–29 s: controles con thumb/lente y contenido visible bajo el material. No se confunden con una prueba de la implementación de CUKI.

El video no permite medir input latency, coeficientes exactos de spring, presión física, haptics ni rendimiento en un teléfono. Los valores numéricos del prototipo proceden de la especificación y del modelo elegido; no se presentan como mediciones de la referencia.

## Implementación

`src/liquid/physics.ts`: presets críticos `press` y `settle`, pose rígida, hit-test de cápsula, coordenadas inversas del contacto y perfil óptico deformado. No se añaden presets ficticios para fases que aún no existen.

`LiquidPressable.tsx`: objetivo táctil fijo, `Gesture.Tap` nativo, presión con shared values y worklets. Contacto → presión; HOLD estable sin repetición; release/cancel → spring; callback de negocio únicamente en commit válido. Los callbacks/haptics viajan a RN a nivel de evento, no por frame. Todo el foreground desciende y escala uniformemente: no hay deformación anisotrópica de letras o iconos.

`LiquidPressOptics.tsx`: capas únicamente dentro del SVG del material y por debajo del círculo/icono/label. Oclusión local centrada en el punto de contacto corregido por el movimiento de la superficie; atenuación pequeña del borde superior; perfil interno cerrado que se desplaza hacia dentro mediante un campo gaussiano. El radio del campo no se expande: no es ripple. No se añade glow luminoso.

**Límite óptico:** este es un fallback de rendering vectorial controlado. No captura, refracta ni magnifica píxeles del backdrop nativo. El blur existente sigue siendo blur. No se ha añadido Skia ni un shader que prometa una refracción de contenido que no puede muestrear. Una lente real sobre contenido controlado queda para una etapa óptica posterior, condicionada al perfilado.

`haptics.ts`: contacto Soft y commit Light en iOS; equivalentes de entrada nativa en Android. Sin vibración en HOLD, settle o cancel. Se fusionan eventos separados por menos de 70 ms para evitar dos golpes en taps muy breves; se descartan eventos haptic con más de 90 ms de retraso de despacho. Nunca se espera un haptic para ejecutar la acción. No se interpreta commit como éxito de una operación de servidor.

`useMotionPreference.ts`: valor inicial síncrono, consulta nativa y listener de cambios. La opción de QA solo fuerza reduced motion; no puede anular la preferencia del sistema. En reduced motion: 0.3 dp, escala 0.998, transición directa de 55 ms, sin deformación local del perfil, y haptics conservados cuando el sistema los permite.

## Parámetros del benchmark

| Estado | Traslación | Escala | Dinámica |
|---|---:|---:|---|
| Reposo | 0 dp | 1 | Sin efecto visible |
| Press normal | +2 dp | 0.98 | m=0.55, k=1400, c=2√(mk) |
| Hold | +2 dp | 0.98 | Estado estable, sin loop |
| Release | →0 dp | →1 | m=0.65, k=1050, c=2√(mk) |
| Reduced press | +0.3 dp | 0.998 | Timing de 55 ms |

El modelo crítico sin velocidad inicial alcanza aproximadamente 60% del recorrido a 40 ms y 87% a 70 ms. **No son mediciones touch-to-photon ni garantías de 60 fps.** El callback de settle fija presión exactamente a cero. Las interrupciones no dejan callbacks antiguos que anulen un contacto nuevo.

## Probar la Home

```bash
npm install
npx expo install --check
npm run typecheck
npm run check
npm run check:register
npm run check:liquid
npx expo start --go --clear
```

Las dependencias nuevas son Reanimated 4.5.1, Worklets 0.10.1, Gesture Handler ~2.32.0 y Expo Haptics ~57.0.3. El resto permanece fijado a la configuración SDK 57 existente. Expo configura el plugin de Worklets/Reanimated mediante babel-preset-expo; no se añade un plugin duplicado.

## Laboratorio nativo

Añade temporalmente esta línea a `.env.local` (archivo ignorado por git) y reinicia Metro:

```env
EXPO_PUBLIC_LIQUID_LAB=1
```

Abre Expo Go. La pantalla de laboratorio usa exactamente el mismo `GlassButton` y `LiquidPressable`, pero cuenta acciones sin abrir un modal que oculte la recuperación. Permite deshabilitar, forzar reduced motion, silenciar haptics y desactivar la óptica local conservando la física.

Para volver a la Home, elimina la línea y reinicia Metro. No hay una pantalla de laboratorio visible en la navegación normal.

### Secuencia de aceptación en dispositivo

1. Mantener el dedo 1–2 s en centro, izquierda y derecha. El punto óptico debe seguir el contacto, sin onda expansiva ni oscilación autónoma.
2. Soltar: un commit, retorno corto y exacto. Repetir taps muy rápidos y recontactar durante settle.
3. Arrastrar >12 dp o salir de la cápsula: cancelar sin acción. Probar también inicio de scroll, dos dedos, interrupción por background y deshabilitación durante el contacto.
4. Repetir con óptica desactivada: la presión debe seguir leyéndose físicamente.
5. Probar reduced motion del sistema y VoiceOver/TalkBack. Verificar una única acción y ausencia de doble foco del artwork pasivo.
6. Grabar REST → DOWN → HOLD → RELEASE → SETTLED y comparar cuadros consecutivos al frame rate real de la grabación. No inventar una grabación de alta tasa a partir de frames interpolados.

### Medición

El laboratorio recoge intervalos de `useFrameCallback` únicamente como QA. Reporta muestras, media, p95, máximo y conteo >20 ms. Es una medida de callbacks UI, no de presentación real, GPU, overdraw, JS thread ni input-to-photon. El buffer está limitado a 1800 muestras. En la Home normal no se monta este probe.

Perfilar además una build release con herramientas nativas (Android Studio/Perfetto o Instruments) y comparar óptica on/off. Prioridad: latencia y estabilidad antes que refinamientos ópticos. Si hay pérdidas de frames, mantener la pose rígida y desactivar primero la capa óptica opcional; no ocultar el problema aumentando los tiempos del spring.

## Evidencia y validación

- Los checks host originales siguen cubriendo layout y callbacks de la ruta estática. Se conserva la fixture anterior, con excepciones explícitas para las integraciones autorizadas, y se añade otra línea base para proteger los demás archivos.
- `qa/liquid/check.cjs` comprueba números, estados y callbacks con mocks claramente identificados. No emula realmente Fabric, Hermes o el arbitraje de gestos nativos.
- El workflow `Expo checks` ejecuta instalación, compatibilidad, tipos, checks y exports Android/iOS.
- `Liquid Phase A native Android` intenta ejecutar el laboratorio en Expo Go sobre Android API 35, inyectar un hold, grabar capturas/video, verificar recuperación, cancelación, disabled y reduced motion. Sus artifacts y su resultado son la fuente de verdad; un workflow creado no equivale a un workflow superado.
- Las imágenes vectoriales locales, cuando se entregan, son diagnósticos del código, no screenshots nativos.
- Los frames del video del usuario no se integran en la app ni se publican en el repositorio.

No se declara esta fase aprobada por el usuario ni se implementan B–D de forma automática. Incluso con smoke nativo satisfactorio, el tacto del haptic, el rendimiento release en teléfonos e iOS requieren su comprobación correspondiente.

## Referencias técnicas consultadas

- https://docs.expo.dev/versions/v57.0.0/sdk/reanimated/
- https://docs.expo.dev/versions/v57.0.0/sdk/gesture-handler/
- https://docs.expo.dev/versions/v57.0.0/sdk/haptics/
- https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/
- https://docs.swmansion.com/react-native-reanimated/docs/core/useAnimatedProps/
- https://docs.swmansion.com/react-native-worklets/docs/threading/scheduleOnRN/
- https://docs.swmansion.com/react-native-reanimated/docs/device/useReducedMotion/
- https://docs.expo.dev/workflow/android-studio-emulator/

Estas fuentes sustentan las APIs utilizadas, no la física supuestamente medida del video.
