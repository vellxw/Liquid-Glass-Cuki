# Registrar: revisión del flujo de contacto

Continúa sobre `74c14c7` y conserva el motor de depresión local. No extiende las
interacciones a Ver rutina, navbar, sliders, toggles o morphs. El estado de
reposo, tokens visuales e iconografía aprobados no se rediseñan.

## Qué cambia

- Se eliminan animaciones de velocidad reiniciadas en cada evento de Pan y
  escrituras duplicadas de coordenadas. El gesto sigue siendo continuo.
- Los uniforms ópticos se consolidan una vez por frame UI. Un hold idéntico no
  produce una nueva entrega de uniforms. La velocidad óptica caduca a los 80 ms
  sin movimiento; no genera una oscilación autónoma.
- El shader de depresión queda limitado al rectángulo de influencia. El resto
  del material usa un dibujo de imagen ordinario. No se eliminan refracción,
  normales, oclusión ni specular para mejorar el coste.
- Las potencias enteras del specular usan multiplicaciones equivalentes.
- La textura se invalida por layout/revisión/reanudación, no después de cada
  pulsación. Una captura que termina durante contacto se difiere hasta reposo.
- El arte del botón está memoizado. Las trazas costosas del laboratorio solo
  se montan al activar Debug; no participan en las medidas normales.
- Si no se puede compilar el efecto, permanece la vista nativa del control.
  Ese fallback NO se presenta como una deformación óptica equivalente.

## Apoyo mecánico opcional

El último brief adjunto vuelve a solicitar +2 dp y escala 0,98. Se implementan
como `MechanicalSupport`, separado de `LiquidPressable` y derivado de la misma
presión que la óptica. No hay otro timer ni otro spring independiente. El área
de input permanece fija. El shader convierte la coordenada táctil mediante la
inversa de esa pose para mantener el contacto debajo del dedo.

`GlassButton` acepta `mechanicalSupport`. El botón de la Home lo activa; el
laboratorio arranca con ese apoyo desactivado, permitiendo comparar ambos modos.
Desactivar la deformación completa elimina también el apoyo. La prueba de
localidad se realiza SIN el apoyo para no confundir escala global con depresión.

## Ejecutar

Node y dependencias: sin cambios respecto a la entrega SDK 57 anterior.

```bash
npm install
npx expo start --go --clear
```

Para el laboratorio: `EXPO_PUBLIC_LIQUID_LAB=1` en `.env.local` y reiniciar Metro.
Opciones: deformación, cuadrícula de refracción, apoyo mecánico, debug,
movimiento reducido y deshabilitación. Debug y cuadrícula OFF por defecto.

```bash
npm run check
npm run check:register
npm run check:liquid
node qa/liquid/pipeline-check.cjs
npm run typecheck
npm run export:android
npm run export:ios
```

Hay 98 checks host/numéricos: 40 base, 11 material, 35 interacción y 12 del
flujo optimizado. No sustituyen ejecución nativa ni prueban 60 fps.

## Límites que no se ocultan

La textura procede del material de la instancia real, no de la referencia ni
de un PNG empaquetado. Se refracta esa textura; el BlurView del backdrop externo
sigue separado. No es refracción en vivo de cualquier vista React Native.

La prueba nativa usa Expo Go/API35, SwiftShader, 720×1600 y densidad 280 dpi.
Conserva un contacto cancelado previo para calentar la tubería; no mide cold
start ni acredita la latencia física de 40–70 ms. SurfaceFlinger proporciona
FPS presentados; la frecuencia del callback UI no es ese dato.

El video no muestra un release completo medible. Profundidad, radio y spring
son calibración del prototipo, no mediciones físicas de la referencia. Haptics
físicos, iOS, lectores de pantalla y rendimiento release en teléfono requieren
validación adicional. El PR permanece de revisión; no se aprueba la fase ni se
avanza a fases B–D automáticamente. Los resultados concretos de esta ejecución
se adjuntan al PR y al paquete de evidencia con sus IDs de workflow.
