# Registrar: cara presionable con marco fijo

Esta revisión implementa el último contrato perceptivo. Solo cambia el press del
botón grande Registrar +; no rediseña la Home ni la navegación. Base de trabajo:
`3ebcd45b6c2894c8659aa23006a65610f7e39681`.

## Diferencia respecto al efecto anterior

El valor de profundidad del shader anterior no describía el recorrido visible:
las máscaras lo atenuaban justo sobre el bisel. La nueva compresión impone las
posiciones de la cara y construye una transformación inversa continua entre ellas.

El marco conserva su silueta. A la altura horizontal del contacto, el bisel superior
interior baja aproximadamente 2,5 dp y el inferior sube 1,5 dp. Estos son objetivos
geométricos calibrados, no mediciones físicas de un video. La captura final mide el
recorrido visible por separado; no se presenta el token como una prueba visual.

La transición tiene soporte horizontal compacto, de radio principal 40 dp y extremo
60 dp. La coordenada Y modula de forma contenida la relación superior/inferior.
Una interpolación cúbica de Hermite monótona mantiene fijo el marco y evita pliegues
o inversiones de filas. Se comprueban distintos tamaños y posiciones del dedo.

La sombra solo aparece en el espacio interior expuesto por la compresión. La luz
modula los colores existentes: no hay oro, partículas, barridos o una mancha circular.
El efecto sigue desplazando las muestras con la iluminación de contacto apagada.

## Contenido nativo, no letras refractadas

Texto, círculo y + se asientan solidariamente. El recorrido nominal es de 0,85 dp,
alineado a píxeles físicos para mantener su nitidez. A 280 dpi se resuelve como un
píxel (aprox. 0,57 dp); otras densidades redondean al píxel más próximo. No se
cuantizan las coordenadas del dedo ni el movimiento de la cara, solo el diminuto
acompañamiento del contenido.

La primera iteración trasladaba el círculo por muestreo de su textura. La revisión
nativa detectó pérdida de definición en el borde. Se sustituyó por una traslación
afin en un grupo SVG nativo, dentro del mismo pase del material original. El texto
sigue siendo Text nativo. No hay scale, rotación, estiramiento ni dos círculos.

El shader excluye el inserto y el margen de muestreo; no se usa esa protección para
inmovilizar los biseles superior e inferior. La rama REST produce transparencia
exacta en la composición óptica. El dibujo nativo original permanece debajo.

## Entrada y recursos

Gesture Handler entrega el contacto continuo a shared values de UI; no se envían
posiciones por frame a React. Un tap sin MOVE se activa en DOWN y hace commit solo
al terminar correctamente. Salir y reentrar no reactiva una interacción cancelada.
El scroll de Home, busy, disabled y la preferencia de movimiento reducido mantienen
sus contratos anteriores. No se retrasa el callback para terminar una animación.

La entrada nominal dura 100 ms y parte de la presión real alcanzada. La recuperación
es un único spring crítico, sin velocidad heredada ni deriva lateral. HOLD es estable.
El acompañamiento del contenido también se anula al desactivar toda la deformación.

Se preparan recursos por geometría/revisión, no por cada pulsación. La preparación
GPU se programa en UI y se espera antes de instalar la nueva caché; una revisión
antigua o un recurso que llegue durante contacto nunca sustituye al actual.
La preparación no demuestra por sí misma latencia táctil: se conservan los logs
nativos del primer contacto y las grabaciones para distinguirlo.

El fondo es una copia por revisión/layout; no es una refracción universal de vistas
externas animadas en vivo. No se usan imágenes de referencia, PNG del botón ni video
como contenido del componente. Las imágenes de QA no forman parte de sus assets.

## Ejecutar

```bash
npm install
npx expo start --go --clear
```

El proyecto conserva Expo SDK 57 y Node >=22.13.0. Para el laboratorio, crear
`.env.local` con `EXPO_PUBLIC_LIQUID_LAB=1` y reiniciar Metro. Sin esa variable se abre
la Home real. El laboratorio permite apagar el acompañamiento, los haptics, la luz
y toda la deformación de forma independiente. Cuadrícula y debug están apagados
por defecto. La barra inferior y Ver rutina no usan esta interacción.

## Validación reproducible

```bash
npm run typecheck
npm run check
npm run check:register
npm run check:liquid
node qa/liquid/pipeline-check.cjs
node qa/liquid/overlay-check.cjs
node qa/performance/check.cjs
node qa/premium/check.cjs
node qa/face/check.cjs
python -m unittest discover -s qa/performance -p 'test_*.py' -v
npm run export:android
npm run export:ios
```

Son 126 comprobaciones host/numéricas y 4 del parser. No sustituyen una ejecución
nativa. El protocolo Android usa un flujo real de MotionEvent, registra los videos
y compara screenshots nativos. `qa/face/validate.py` mide el máximo de cada franja
interior en una región fijada antes de ejecutar. También comprueba el tamaño y la
posición del texto y círculo: el recorrido ya no se confunde con un cambio de brillo.

Los gates de original/REST, hold estable, recuperación, cancelación, efecto apagado y
marco permanecen estrictos. La máscara del material distante excluye las cajas del
contenido que ahora se asienta por contrato; su rigidez se evalúa por separado.
La primera iteración falló precisamente esa comprobación del círculo y se corrigió
la implementación, no el umbral.

## Resultados finales y trazabilidad

Runtime verificado: `92e89298568649000185b2c654d1314975609182`.
La entrega posterior de documentación no modifica el runtime y no se presenta como
una ejecución nueva. La rama es `feat/registrar-face-compression`, PR #7; no se ha
fusionado en main ni se ha extendido el efecto a los otros controles.

Ejecuciones terminadas correctamente:
- [Checks Expo](https://github.com/vellxw/Liquid-Glass-Cuki/actions/runs/35098888759):
  instalación, compatibilidad, TypeScript, 126 checks host/numéricos, cuatro pruebas
  del parser y exportaciones JavaScript Android/iOS.
- [Expo Go nativo](https://github.com/vellxw/Liquid-Glass-Cuki/actions/runs/35098888952):
  interacción, geometría real, Home y scroll corto; evidencia independiente.
- [APK release independiente](https://github.com/vellxw/Liquid-Glass-Cuki/actions/runs/35098889518):
  compilación x86_64, instalación y protocolo sin Expo Go ni Metro, con firma de
  prueba, Android API35/SwiftShader, dos núcleos virtuales, 720×1600, 280 dpi.
  También se prueba 720×1200 para scroll. No es un teléfono ni un APK ARM de tienda.

Artifact release: `10448917391`, SHA256
`679ecebe5177f19c822898e19f1d344469207f61ec2735adf609e4cbcec23f1f`.
El source.zip contiene 108 archivos; se comparó byte a byte con el runtime local.
El APK compilado tiene SHA256
`69a32626ef2907fab84d5cebae08446c7ede4c192d5f5a5a0f9dfb341de6a457`.

### Geometría que realmente aparece en pantalla

Los siguientes datos son del APK release, no de la previsualización matemática.
El recorte del botón mide 442×117 píxeles. La ventana de medición es el 4 % central
del ancho, con el marco exterior excluido. Se conserva el perfil RGB de cada fila
para que el máximo de cada franja y el resultado sean reproducibles.

| Medición | Resultado |
| --- | ---: |
| Franja interior superior | fila 7 → 11: **2,29 dp** hacia dentro |
| Franja interior inferior | fila 107 → 105: **1,14 dp** hacia dentro |
| Recorrido combinado | **3,43 dp** |
| Círculo nativo | 58×59 px antes/después; desplazamiento vertical 1 px, horizontal 0 |
| Texto nativo | 154×30 px antes/después; centro brillante baja aproximadamente 1 px |

El recuento de píxeles brillantes del círculo no cambia. El del texto varía en uno
por antialiasing/fondo; no se confunde ese dato con deformación de las letras.
La versión de Expo Go obtuvo el mismo recorrido combinado. El conjunto de pruebas
no equivale a un estudio perceptual humano ni garantiza por sí solo la tactilidad.

### Comparación de capturas RGB, escala 0–255

| Comparación | MAE |
| --- | ---: |
| Original nativo / reposo | **0** |
| Hold / otra captura >1 s después | **0** |
| Reposo / recuperación y cancelación | **0** |
| Toda deformación desactivada, reposo / hold | **0** |
| Marco fijado, 3158 píxeles | **0** |
| Material lejano evaluado, 13261 píxeles | **0** |
| Reposo / presión normal | 4,16074 |
| Geometría sin luz adicional, haptics ni asentamiento del contenido | 1,38090 |

El último resultado confirma que no se depende únicamente de la luz o del movimiento
del texto; tampoco transforma el MAE en un porcentaje de perfección. La percepción
final debe evaluarse mirando la versión a tamaño real, no solamente estos números.

Se verificaron 14 activaciones válidas en laboratorio, dos en Home y otra después
de scroll. Cancelación, reentrada y disabled no ejecutan la acción. Se mantuvieron
los contratos de busy/accesibilidad mediante tests del host; no se presentan como
pruebas nativas de lectores de pantalla. Los archivos protegidos de navbar, Ver
rutina, material, HomeScreen, iconos, tokens y gesto se conservaron byte a byte.

### Rendimiento: objetivo aún pendiente

SurfaceFlinger / capa MainActivity del APK release informó:
- Arrastre grabando: **18,571 FPS**, 131 cuadros.
- Arrastre sin grabar: **33,415 FPS** en el segmento principal de 191 cuadros;
  existe otro segmento de tres cuadros a 27,778 FPS, también conservado.

El promedio de cuadros del MP4 variable NO representa estos FPS. No se selecciona
la cifra más alta de una ejecución distinta para describir esta entrega.

Se completaron veinte bloques de aproximadamente 30 segundos, unos diez minutos.
En el segmento principal de cada bloque se observaron 32,589–35,687 FPS. Cada bloque
contiene además un segmento pequeño: se conservan ambos y no se inventa una tasa
agregada. PSS: 131741 KiB al inicio de endurance, pico 146169, final 145624 y 139088
al terminar el protocolo. Hubo crecimiento inicial y recuperación parcial; no se
certifica ausencia de fugas ni estabilidad térmica de hardware.

Se ejecutaron cinco pasadas intercaladas por candidato del A/B, pero todas las de
baseline y optimizado quedaron fragmentadas en los registros de capas. El parser
predefinido las excluyó y la comparación de rendimiento es **inconclusa**. No se
relaja el filtro para anunciar una mejora. La comparación visual A/B sí conserva
REST con MAE 0 y HOLD optimizado con MAE 0,005105/255 frente a baseline del mismo modelo.

### Primer contacto y preparación

En la grabación release, el DOWN/UP de 90 ms se inyectó en 91 ms. Los eventos UI de
contacto y commit quedaron separados por 112 ms, frente a los intervalos mayores
observados en iteraciones previas. Esto NO es touch-to-photon, ni permite deducir
una latencia de 21 ms. Son ejecuciones distintas, no una prueba causal controlada.
La preparación GPU inicial tardó 968 ms antes de indicar listo; las posteriores
revisiones fueron menores. La primera pulsación grabada no se descartó, pero sí se
esperó a los recursos. No se valida contacto anterior a esa preparación.

Mover la preparación al runtime UI conserva el contexto de render usado por Skia;
no se interpreta que por ello toda demora ya esté resuelta. La preparación hace
un readback acotado fuera del gesto, nunca uno por cada frame o movimiento.

### Evidencia de entrega

El video principal proviene de este APK release y concatena Home, laboratorio y
Home corta: **1135 cuadros / 189,214689 s**. Se conserva cada cuadro y cada intervalo
dentro de sus tres tomas (137 + 923 + 75), sin interpolación, aceleración o eliminación
de cuadros. Se aplican únicamente escala espacial, recorte y títulos fuera de la UI.
No es una toma cronológica única. Las tres grabaciones originales se entregan aparte
junto a PNGs, CSV de entrada, logs, Perfetto, lock instalado y manifiestos.

**No se certifican 60/120 FPS, latencia de pantalla <=50 ms, haptics físicos, iOS ni
lectores reales.** Esas condiciones siguen abiertas y el PR permanece de revisión.
El resultado mejora la lectura geométrica de la presión; la aceptación final de la
sensación y el rendimiento en dispositivos físicos no se sustituye con un gate numérico.

