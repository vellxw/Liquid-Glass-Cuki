# Registrar +: pulsación premium, fija y Black Glass

## Alcance vigente

Esta revisión aplica únicamente al botón grande Registrar +. La referencia de video
aporta la lectura del espesor bajo presión, no su coreografía ni sus cambios de color.
No hay giro, escala, traslación de la cápsula, transición dorada, partículas o barrido.
Texto, signo + y círculo permanecen fijos. El material nativo aprobado y sus colores
no se modificaron; la contribución óptica en reposo es transparente.

Base: `7ddc57fb191044c8f8acdc9d7efc7f3b43270fde`. Se conservan el material, iconos,
navbar, Ver rutina y tokens de layout. HomeScreen añade relación con scroll nativo
e invalidación de recursos; ese archivo NO es idéntico al original, aunque no cambia
sus medidas ni composición visual. Las ramas anteriores y main no se fusionan.

## Funcionamiento

Pan nativo desde DOWN → coordenadas/presión en UI → campo óptico local en Skia.
La presión es simulada (no requiere sensor físico de fuerza). El centro procede del
gesto real. El material nativo queda siempre montado, sin alternar su representación
al tocar. Skia compone únicamente la diferencia del relieve y de las muestras refractadas.

El campo conserva un núcleo y una transición de soporte compacto. Ambas franjas del
bisel interior convergen de forma contenida; el perímetro exterior se mantiene fijo.
La iluminación modula los reflejos existentes sin añadir emisión RGB de nuevos colores.
El texto queda fuera de la superficie refractada y el círculo es un inserto rígido;
la zona que lo rodea sí puede comprimirse. No hay movimiento del contenido.

Parámetros calibrados de implementación, no mediciones físicas del clip:

| Parámetro | Valor |
| --- | ---: |
| Entrada | 96 ms, desde la presión real actual |
| Radio principal / soporte | 40 dp / 60 dp |
| Profundidad aparente | 1,8 dp |
| Muestreo óptico máximo | 2,75 dp |
| Compresión adicional del bisel interior | 1,5 dp antes de falloff/límite |
| Spring de recuperación | masa 0,4; rigidez 1000; amortiguación 40 |
| Velocidad inicial de recuperación | 0; overshoot bloqueado |
| Reducción de movimiento | profundidad 0,24 dp; transición 55 ms |
| Transformación de cápsula/texto/círculo | ninguna |

El spring escalar es críticamente amortiguado. No añade deriva lateral tras arrastrar.
HOLD no contiene un reloj o una animación autónoma. Un tap corto libera desde el nivel
alcanzado sin imponer una duración mínima ni demorar el callback. La acción ocurre
una vez al soltar dentro. Salir cancela; reentrar sin levantar no reactiva el gesto.

`busy` es un estado explícito del control reutilizable, no un debounce arbitrario.
Se conserva activación accesible, invalidación al desmontar/background/disabled,
reduced motion inicial y dinámico, y haptics por eventos. Un tap muy corto agrupa
contacto/commit para no apilar vibraciones. El emulador no valida sensación háptica.

## Correcciones descubiertas mediante pruebas

1. El nuevo protocolo inicia scroll sobre el propio botón en una Home corta. La
   página se desplazaba y cancelaba correctamente, pero un tap inmóvil posterior no
   ejecutaba la acción. El Pan anterior dependía del reconocimiento tras un MOVE.
   Se añadió activación explícita desde DOWN; la prueba ahora inyecta DOWN/UP sin MOVE.
2. La primera pulsación de las primeras iteraciones sufrió un retraso considerable
   en los eventos del emulador pese a que las texturas ya estaban preparadas. Se añadió
   preparación GPU fuera de pantalla con el shader y sus texturas reales antes de
   indicar listo. No reproduce un press visible ni cambia la presión de usuario.
   Esta preparación NO acredita por sí sola latencia física de contacto a pantalla.
3. Los tests antiguos del círculo seleccionaban un nombre de nodo con mayúsculas
   que no coincidía con el mock. Se corrigió y se exige un número no nulo de círculos;
   los tests de píxeles nativos siguen siendo una comprobación separada.

## Recursos y render

Los recursos se preparan por geometría/revisión, no por cada movimiento del dedo.
El inicio de nuevas capturas y la instalación de recursos se difieren mientras hay contacto. Una generación antigua
no reemplaza una nueva; los reintentos están acotados. Se conserva el control nativo
si la preparación falla. Cambios de assets, viewport o final de scroll invalidan la
revisión. No se publican capturas de la referencia como assets ni se usa WebView.

Una textura nativa potencialmente externa se desacopla una vez y se precalienta el
recorrido óptico en una superficie GPU no visible. No hay readback durante drag.
Los uniforms se alimentan desde shared values; los únicos mensajes a React son
acciones/haptics, preparación de recursos y la instrumentación opcional. Debug y
cuadrícula están apagados por defecto. No hay bucle de cuadros perpetuo del efecto.

Se mantiene la región dinámica localizada y el shader equivalente optimizado de la
base. No se elimina blur, se reduce la resolución o se desactiva iluminación como
calidad normal del producto. Los controles A/B sirven solo para diagnóstico.

**Límite del fondo:** la fuente nativa se copia al preparar una revisión y no se
actualiza continuamente durante una escena externa animada. Para contenido dinámico
controlado debe proporcionarse una fuente óptica actualizada. La preparación requiere
un breve intervalo inicial; no se afirma haber validado el tacto antes de ese estado.

## Scroll

La Home aporta un Gesture.Native estable al control hijo. El gesto puede convivir
con el scroll: desplazamiento vertical dominante >10 dp cancela Registrar; horizontal
sigue manipulando el material. En el laboratorio sin scroll se conserva el movimiento
vertical corto. La prueba corta comprueba desplazamiento real de la página, navbar
inmóvil, ausencia de acción al arrastrar y activación posterior en la nueva posición.

## Validación de esta entrega

Código runtime probado: `d6a2793cf5948c760fac520f33f45fe6ebe44f3c`.

- [Checks Expo, tipos y exportaciones](https://github.com/vellxw/Liquid-Glass-Cuki/actions/runs/35056259277): success.
- [Prueba nativa Expo Go](https://github.com/vellxw/Liquid-Glass-Cuki/actions/runs/35056259276): success.
- [Compilación y pruebas del APK release](https://github.com/vellxw/Liquid-Glass-Cuki/actions/runs/35056259283): success.

El APK se compiló, instaló y ejecutó sin Expo Go ni Metro. Los dos protocolos nativos
no se mezclan para elegir el resultado más favorable. Las cifras siguientes provienen
de la ejecución release final (artifact `10431542204`). Son 119 checks host/numéricos
más cuatro pruebas del parser; no sustituyen la prueba nativa.

| Prueba del recorte nativo release, RGB 0–255 | MAE |
| --- | ---: |
| Original nativo / REST | 0 |
| HOLD estable, más de un segundo entre capturas | 0 |
| Recuperación / cancelación frente al reposo | 0 |
| Deformación OFF, reposo frente a presión | 0 |
| Borde fijado / región exterior al contacto | 0 |
| Reposo frente a presión normal | 0,78326 |
| Geometría sin iluminación adicional | 0,35694 |
| Presión izquierda frente a derecha | 2,56245 |

Se comprobaron 14 acciones válidas en laboratorio, dos en la Home y una después de
hacer scroll en la Home corta. No se cuentan aquí el benchmark ni los contactos de
resistencia. Cancelar, reentrar o tocar un botón deshabilitado no activó la acción.
La pantalla corta pasó de y=745 a y=607 para el botón; la navbar no se movió.
El tap posterior sin MOVE abrió el panel de la acción en su nueva posición.

SurfaceFlinger midió **20,774 FPS presentados durante el drag grabado** (125 cuadros)
y **27,481 FPS sin grabación** (segmento principal de 157 cuadros). También existe
un segmento de solo tres cuadros a 24,194 FPS: se conserva en los datos, no se oculta.
No se alcanzan 60 FPS en esta ejecución.

El ensayo prolongado realizó 20 bloques de ~30 segundos de contactos (~10 minutos).
Cada bloque contiene registros fragmentados de la misma capa. En el segmento con mayor
cantidad de cuadros de cada bloque, las tasas fueron **26,604–27,327 FPS**; los segmentos
adicionales y sus histogramas se conservan íntegros. Este resumen describe estabilidad
observada, no una tasa de cuadros agregada reconstruida ni una certificación térmica.
PSS: 132284 KiB al comenzar el ensayo, pico 136811, 136313 al terminar y 133701 después
del protocolo. No se certifica ausencia de fugas a partir de este intervalo.
Cinco segundos de reposo no produjeron cuadros nuevos. La medición de HOLD incluye
entrada y salida, por lo que no se interpreta como una tasa del hold inmóvil.

**A/B no concluyente:** se ejecutaron cinco repeticiones intercaladas por candidato,
pero baseline y optimizado devolvieron registros fragmentados en las cinco. El parser
predefinido los rechazó para la comparación estadística. No se cambió el filtro después
de ver los datos y no se declara un porcentaje de mejora ni una victoria de una variante.
Las capturas A/B mantienen REST exacto y una diferencia de HOLD de 0,00352/255 entre
baseline y optimizado. El baseline de este ensayo usa la misma pulsación premium nueva,
no la animación anterior. La traza Perfetto se conserva aparte.

**Primer contacto: problema de latencia pendiente.** En el APK release, el primer
DOWN/UP se inyectó con 92 ms de separación, pero los timestamps UI de contacto y commit
quedaron separados 741 ms. En la prueba independiente de Expo Go fueron 91 y 382 ms.
Estos son eventos de procesamiento, no una medida física de contacto a fotón. Indican
una demora inicial que la preparación GPU no eliminó en el entorno probado; la causa
no está aislada. No se afirma que el objetivo de respuesta <=50 ms esté cumplido.
La duración configurada de 96 ms no debe presentarse como latencia real observada.

Las métricas de imagen no son porcentajes de perfección ni aprobación perceptual.
Los píxeles de texto comprobados son sus núcleos opacos; el antialiasing puede mezclar
con el material inferior sin que se deformen las letras. El círculo y el borde se
comprueban además mediante máscaras y el código original de dibujo.

Las exportaciones JavaScript de iOS no equivalen a ejecutar la app en iOS. El APK de
benchmark es x86_64 con firma de prueba y corre en emulador API35/SwiftShader, no en un
teléfono. No certifica 60/120 FPS en teléfono, energía/temperatura de hardware, haptics físicos,
lectores de pantalla reales ni touch-to-photon ≤50 ms. La aprobación de esos puntos
permanece pendiente, sin presentar los checks funcionales como sustitutos.

## Ejecutar

```bash
npm install
npx expo start --go --clear
```

Sin flags se abre la Home. Para el laboratorio, escribir en `.env.local`:

```env
EXPO_PUBLIC_LIQUID_LAB=1
```

Reiniciar Metro. Desde el laboratorio se accede a la Home y al banco A/B.

```bash
npm run typecheck
npm run check
npm run check:register
npm run check:liquid
node qa/liquid/pipeline-check.cjs
node qa/liquid/overlay-check.cjs
node qa/performance/check.cjs
node qa/premium/check.cjs
python -m unittest discover -s qa/performance -p 'test_*.py' -v
npm run export:android
npm run export:ios
```

Documentos anteriores se conservan como historial; no describen la pulsación vigente.
