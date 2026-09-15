# Registrar: superficie local, no un tap rígido

Esta revisión sustituye el motor de la Fase A anterior. Solo Registrar lo adopta.
La barra inferior, Ver rutina, tokens visuales, tamaños y material aprobado no se cambian.

## Arquitectura

Un Pan nativo con `minDistance(0)` comienza al tocar, sin esperar un tap reconocido al soltar.
`contactX`, `contactY`, `velocityX`, `velocityY`, `pressure` y una relajación sub-dp viven
como shared values de Reanimated. No se envían al hilo JS durante cada actualización.

`useDerivedValue` entrega los uniforms a un `RuntimeEffect` de Skia. El campo de altura
es negativo, gaussiano y de soporte compacto. Su gradiente analítico determina a la vez
la normal aparente, el desplazamiento de coordenadas, el specular y la oclusión tenue.
No hay uniform de tiempo, onda, escala global ni translate del botón. El único spring
recupera `pressure`; todos los términos ópticos vuelven conjuntamente a reposo.
La velocidad residual puede desplazar el centro de contacto menos de 0,6 dp al soltar.

La posición no cruza a React por frame. Los callbacks de acción/haptics son eventos;
las trazas del laboratorio se acumulan en UI y se entregan a JS cuando termina cada gesto.
La preparación de textura ocurre fuera del contacto, no forma parte del bucle de drag.

## Material real, contenido nítido y límite del backdrop

En reposo se muestra la vista nativa original. `makeImageFromView` crea en memoria una
textura de ese material al establecer layout y al volver a reposo. No usa una imagen
empacada de la UI, un recorte de la referencia o una animación prerenderizada. Durante
contacto, `ImageShader` remuestrea realmente sus coordenadas con filtro bilineal.

El texto, círculo y signo + están fuera de la captura y del shader. Tampoco se escalan.
Los 2,4 dp exteriores se mantienen como vector nativo recortado, con el material original,
para no alterar su antialiasing al cambiar a la textura. La sustitución de backing es
binaria y complementaria; su opacity NO representa intensidad de presión.

**Límite explícito:** el BlurView nativo permanece debajo de la capa óptica. El shader
refracta el material capturado y los elementos añadidos dentro de esa capa (la cuadrícula
de QA, por ejemplo), pero NO desplaza en vivo el contenido externo situado detrás del
BlurView. La textura óptica queda congelada durante cada contacto. `revision` permite
invalidarla en reposo. No es un refractor universal del backdrop de React Native.

## Parámetros y fuente cinética

Radio 42 dp; profundidad 1,65 dp; desplazamiento de muestra limitado a 3,6 dp.
Entrada de 95 ms con una semilla local inmediata. Spring: masa 0,5, rigidez 1150,
amortiguación 43. Movimiento reducido: profundidad 0,28 dp y transición directa de 55 ms.
Son valores de implementación calibrados, NO mediciones físicas del video.

El video fuente tiene 1528 × 1080, 60 fps y 42,283 s. Se inspeccionaron consecutivamente
los cuadros 1008–1170. Se observa una transición curvada de sombra/reflejo alrededor del
contacto, no una escala uniforme. El plano del dedo corta al toggle en el cuadro 1148
(19,133 s), sin mostrar una recuperación completa. El dedo oculta el máximo de depresión
y la cámara es oblicua. No permite deducir profundidad en dp, latencia táctil, haptics o
los coeficientes exactos del spring. Los arrastres horizontal y circular son pruebas
solicitadas por el brief, no trayectorias medidas en ese plano.

## Laboratorio y reproducción

Añadir a `.env.local`:

```env
EXPO_PUBLIC_LIQUID_LAB=1
```

```bash
npm install
npx expo start --go --clear
```

El laboratorio ofrece tap, hold, drag horizontal/vertical, círculo, salida para cancelar,
conmutador de deformación, cuadrícula de refracción, debug y movimiento reducido.
Quitar la variable y reiniciar devuelve la Home. No se extiende a ningún otro control.

La cuadrícula y el debug están desactivados por defecto y no se usan en la Home.
Desactivar la deformación elimina TODA la respuesta visual: no queda una escala o descenso.
Los datos opcionales de frecuencia del callback UI no son FPS de presentación.

## Pruebas ejecutables

```bash
npm run typecheck
npm run check
npm run check:register
npm run check:liquid
npm run export:android
npm run export:ios
```

Son 40 checks base + 11 del material + 35 del contacto/campo óptico: **86 checks host**.
No se presentan como ejecución nativa. Las exportaciones tampoco son compilaciones APK/IPA.

El workflow `Local Glass native drag Android` usa Expo Go, Android API35 y un único flujo
MotionEvent con el mismo pointer/downTime a lo largo del drag. `InjectPath.java` es una
herramienta de QA ejecutada mediante app_process/ADB, no se incorpora a la app.
Registra tap, hold, horizontal, círculo, vertical, cancelación, cuadrícula y ablación.
El protocolo hace un contacto CANCELADO previo para calentar la tubería nativa; no mide
cold-start. También repite taps después de los arrastres. La grabación es screenrecord
real, sin interpolación, y se conserva junto a CSV de entrada, trazas UI y capturas.

## Medición nativa de referencia

Código runtime: `f200d0f8f8b629478603c2817f4df3fc34918272`.
[Checks Expo](https://github.com/vellxw/Liquid-Glass-Cuki/actions/runs/34984990518)
y [prueba nativa](https://github.com/vellxw/Liquid-Glass-Cuki/actions/runs/34984990538)
terminaron correctamente. Las repeticiones posteriores del protocolo conservan sus
propias métricas; estos valores identifican esta ejecución concreta, no todas las máquinas.

Entorno: emulador API35, SwiftShader (GPU software), 2 vCPU; 720 × 1600 píxeles, densidad
280 dpi. El viewport lógico se mantiene aproximadamente igual al ensayo previo 1080p.
No comparar el coste entre resoluciones como si el hardware o la carga fueran idénticos.

| Prueba sobre recorte nativo | MAE RGB, escala 0–255 |
| --- | ---: |
| Reposo frente a presión | 1,132 |
| Hold frente a otro cuadro más de 1 s después | 0 |
| Reposo frente a recuperación | 0 |
| Presión izquierda frente a derecha | 3,328 |
| Deformación desactivada: reposo frente a hold | 0 |
| Perímetro fijado durante presión | 0,111 |
| Zona exterior al soporte del contacto | 0,269 |

El centroide del cambio visual pasa de x=0,166 a x=0,828 del ancho del botón, frente a
posiciones de entrada 0,16 y 0,84. Es evidencia espacial de seguimiento, no una medición
de latencia. Los valores son diferencias de imágenes, no porcentajes de perfección.

SurfaceFlinger, capa ExperienceActivity de Expo Go, informó **13,780 FPS presentados**
durante el drag grabado y **17,939 FPS** al repetirlo sin screenrecord. No se confunden
con el refresco configurado de 60 Hz ni con las frecuencias de callbacks UI.
**No se ha cumplido el objetivo de 60 fps ni se declara la fase aprobada.**

La revisión anterior que capturaba también el blur alteraba el tono exterior al contacto;
se separó el BlurView. El remuestreo del rim aún variaba su antialiasing; se fijó ese borde
como vector nativo. Los tests añadidos de localidad conservan máscaras y umbrales, no
se redujeron para ocultar los defectos. El shader pasó de cinco evaluaciones de altura
a un gradiente analítico y una muestra bilineal; aún requiere perfilado en hardware.

## Pendientes / aceptación

El drag local, HOLD estable, cancelación y ablación están demostrados en Android nativo.
Quedan rendimiento sostenido en un teléfono/release, haptics físicos y su sincronía,
iOS, lectores de pantalla reales y revisión perceptual final frente al video.
La respuesta óptica aún no incluye el backdrop externo en vivo. Los ensayos precalentados
no acreditan latencia táctil de arranque en frío. La rama/PR permanece de revisión;
no se fusiona automáticamente ni se activa esta interacción en navbar, Ver rutina,
sliders o toggles.
