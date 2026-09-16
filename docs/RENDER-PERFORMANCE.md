# Registrar: optimización medida del resultado aprobado

## Estado de la entrega

Solo Registrar +. Se conserva la base `8b4fe9fa859d6b0133560652ebc94e4b1733444a`
que mantiene el reposo nativo exacto y el círculo + como inserto rígido.
El código de ejecución medido es `8abe3b3c4b55d4ce56565c4ff7b311afca885005`.
La documentación de cierre no introduce otra variante del renderer.

La optimización implementada mejora el rendimiento medido sin cambiar radio,
profundidad, presión, iluminación, spring, texto, layout o barra inferior.
**No alcanza 60 FPS en el emulador probado; no se certifica rendimiento en un teléfono.**

## Cambios conservados y candidatos descartados

- `performance.tsx` limita el dibujo dinámico al soporte completo de 1,5R. La
  región se redondea hacia afuera a píxeles físicos; no se reduce la deformación.
- `optimizedShader.ts` deriva el programa del shader aprobado. Adelanta el
  descarte de píxeles alejados del contacto y reutiliza una muestra idéntica del
  fondo. No aproxima la física, cambia la paleta ni reduce la resolución de la UI.
- En reposo, un solo píxel transparente prepara el recorrido del shader; no se
  programa un bucle permanente ni se intercambia el material nativo al presionar.
- Las coordenadas continúan directamente desde Gesture Handler y shared values.
  El candidato que las agrupaba mediante un callback adicional por cuadro fue
  más lento que la variante elegida y NO está activo por defecto.
- Las cachés forzadas de composición siguen siendo una variante de diagnóstico,
  no una optimización asumida. El modo seleccionado no las activa.
- Blur, iluminación y acompañamiento nítido del contenido se conservan. Las
  variantes sin esos efectos sirven solo para localizar costes, nunca como
  niveles de calidad seleccionados automáticamente para aparentar más FPS.

`GlassPerformanceContext` selecciona por defecto `optimized`. El banco A/B
permite comparar `baseline`, `optimized`, `frame-coalesced`, `shader-only` y
variantes de diagnóstico. No cambia de modo durante una interacción.

## Medición fiable y reproducible

Ejecución final: [release APK performance, run 35036512456](https://github.com/vellxw/Liquid-Glass-Cuki/actions/runs/35036512456).
Se generó el proyecto Android y se compiló `assembleRelease` para x86_64. El APK
se instaló y ejecutó sin Metro ni Expo Go. Tiene firma de prueba y es un
benchmark local: no es una release publicada ni un APK destinado a un teléfono ARM.

Entorno: emulador Android API 35, SwiftShader, 2 vCPU, 720 × 1600, 280 dpi.
El tamaño lógico del botón es el de la Home. No se lo agranda para medir.
Se conservaron el SHA del código, hash del APK y package-lock realmente instalado.

El banco ejecuta cinco repeticiones intercaladas de cada candidato dentro del
mismo proceso, con la misma trayectoria MotionEvent. No graba pantalla durante
las mediciones A/B. Cada programa tiene una preparación separada; estos tiempos
no acreditan latencia de arranque en frío. El video funcional sí contiene su
primera pulsación, después de que la app informa que el material está listo.

Se mide presentación de la capa de la app con SurfaceFlinger. Los percentiles
present2present se estiman a partir de buckets del histograma, no son tiempos
exactos de GPU ni latencia táctil. Una capa fragmentada no se sustituye por su
segmento más rápido. Una lectura sin datos no se interpreta como 60 FPS.

### Comparación A/B de la ejecución final

| Candidato | Repeticiones | Mediana FPS | Rango observado | Mediana de p95 por repetición |
| --- | ---: | ---: | --- | ---: |
| Baseline, calidad completa | 5 | 36,713 | 35,112–38,702 | 54 ms |
| Optimizado: región + shader equivalente | 5 | 41,659 | 40,521–41,970 | 44 ms |
| Agrupamiento adicional por cuadro | 5 | 37,895 | 35,540–38,581 | 48 ms |
| Solo optimización del shader | 5 | 37,229 | 35,570–39,387 | 48 ms |

La mejora entre medianas de baseline y optimizado es **13,472 %**. Es una
comparación intercalada en este emulador, no una garantía universal ni una
comparación con los FPS de otra máquina o una ejecución antigua en Expo Go.

Los diagnósticos de una única repetición dieron: sin blur 42,782 FPS, sin luz
42,254, sin movimiento del contenido 41,470 e identidad transparente 43,906.
No se presentan como resultados estadísticos equivalentes a los candidatos
repetidos. La identidad transparente no es el producto entregado.

En el video funcional, otra trayectoria medida informó 26,325 FPS mientras se
grababa y 36,788 sin grabación. No se confunden esas pasadas con la mediana A/B.

## Perfilado y límites de inferencia

La traza Perfetto se obtuvo aparte de las pasadas A/B y del video. El informe
retiene 484 registros globales FrameTimeline y desglosa los asociados a la app.
Hay registros de `Buffer Stuffing`, `App Deadline Missed`, `Prediction Error` y
algunos retrasos del compositor. No se interpreta un único indicador como
causa exclusiva de todos los cuadros tardíos.

En esa traza, el tiempo de CPU de RenderThread fue 2929,674 ms; el del hilo
principal, 2338,042 ms; y el de `mqt_v_js`, 10,675 ms. Son acumulados en hilos,
no tiempo por cuadro; pueden solaparse y no se suman como una latencia total.
La sección de dibujo de la superficie 720 × 1600 promedió 18,509 ms. La traza
apunta a trabajo de render/composición y esperas, no a un stream de posiciones
pasando a JavaScript. **No incluye timestamps de GPU física ni touch-to-photon.**

Referencia de interpretación: [Perfetto FrameTimeline](https://perfetto.dev/docs/data-sources/frametimeline).
El modo retenido de Skia ya es el empleado; no se presenta migrar a GPU como
una optimización nueva. [Documentación de rendering modes](https://shopify.github.io/react-native-skia/docs/canvas/rendering-modes/).

## Validación visual y funcional

En los PNG nativos de la misma instancia, baseline frente a optimizado:

- Reposo: MAE RGB **0**.
- Hold estable: MAE RGB **0,0059945/255**; no se afirma identidad absoluta en hold.
- SVG original frente al reposo de la entrega: MAE **0**.
- Dos capturas separadas durante hold, release, cancelación y deformación OFF:
  MAE **0** en sus comparaciones respectivas.
- Rim y región evaluada fuera del contacto: MAE **0**.
- Geometría sin iluminación ni movimiento del texto: MAE **0,6900324/255**.

Los controles del protocolo son tap rápido, hold, drag horizontal/circular/vertical,
release, cancelación, refracción, ablación, repetición, movimiento reducido y
deshabilitado. Se comprobaron 13 activaciones válidas en el laboratorio y 2 en la
Home real. Los cuadros y eventos se conservan; los resultados numéricos no
sustituyen la aceptación perceptual del usuario.

Los hashes protegen material, física, haptics, Home, Ver rutina y navbar. Pasaron
106 comprobaciones host/numéricas y 4 pruebas del parser. También pasaron la
comprobación completa de tipos, compatibilidad Expo, exportaciones Android/iOS,
la compilación APK release y el protocolo nativo. Exportar iOS no es ejecutarlo.

## Validación prolongada

Seis bloques de 30 segundos de contactos repetidos (30 contactos largos en total),
con registro de memoria, presentación y sensores entre bloques. FPS por bloque:
38,884; 39,332; 39,547; 39,391; 39,089; 38,236. No se observa una caída acumulativa
marcada en ese intervalo; no equivale a una prueba de horas o meses de uso.

PSS: 130658 KiB al comenzar la prueba prolongada, pico de 141492 KiB, 141266 KiB
al terminar y 134918 KiB al final del protocolo. La memoria no fue plana; hubo
crecimiento inicial y estabilización parcial. No se certifica ausencia de fugas
por tres minutos. En cinco segundos de reposo se registraron cero cuadros nuevos.
El ensayo de hold registra también entrada y salida, por lo que no se presenta
su recuento total como trabajo exclusivo del hold estacionario.

El emulador devuelve un sensor denominado `test temperature sensor` a 30,8 °C.
No sirve para certificar eficiencia térmica, consumo real ni throttling de un teléfono.

## Vídeo de entrega

Dos tomas nativas del APK: Home, luego laboratorio. El montaje conserva los
1074 fotogramas (154 + 920) y sus intervalos dentro de cada toma, sin interpolar,
acelerar ni recortar temporalmente. Solo se agregan títulos externos, una vista
completa al 50 % y un recorte ampliado 2×. Duración del montaje: 157,365 s.
El contador impreso pertenece a cada toma; el reproductor muestra el total.
La captura original concatenada se entrega aparte.

## Ejecutar y repetir

```bash
npm install
npx expo start --go --clear
```

Para el laboratorio: `EXPO_PUBLIC_LIQUID_LAB=1` en `.env.local` y reiniciar Metro.
Desde allí se puede abrir el banco A/B y la Home. El modo normal sigue siendo Home.
El workflow `.github/workflows/performance-release.yml` compila y ejecuta el APK
con Java, Android SDK y emulador configurados. `qa/performance/release-ci.sh` no
es un comando para instalar sin cambios en un teléfono: espera ese entorno de QA.

## Lo que todavía no se ha demostrado

No se alcanzaron 60 FPS ni <1 % de cuadros tardíos en este entorno. Faltan matriz
de teléfonos reales, 90/120 Hz, medición física de input-to-photon, energía y
sincronización de haptics, rendimiento térmico prolongado y ejecución nativa iOS.
El fondo refractado es una copia de layout, no un backdrop externo en vivo.
La PR permanece en borrador y no extiende la interacción a otros controles.
No se declara máximo rendimiento universal ni aprobación completa de la Fase A.
