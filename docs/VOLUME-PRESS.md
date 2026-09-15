# Registrar: volumen local y continuidad de render

## Alcance

Revisión del botón grande Registrar +. No cambia el layout, las fotografías/slots,
la navbar, Ver rutina ni el material vectorial aprobado. La apariencia estática no
se sustituye por una captura del usuario ni por un asset rasterizado de la UI.

## Lo que reemplaza

El motor previo intercambiaba la representación nativa y la textura al entrar/salir
de presión. También ofrecía un apoyo que reducía/desplazaba la cápsula entera. Ambos
recursos se retiraron del recorrido de interacción.

La revisión actual prepara una caché del **material nativo de la instancia**, una
sola vez al montar su geometría. Después, REST, CONTACT, HOLD y RELEASE pasan por el
mismo Canvas y shader de Skia. No se capturan vistas, cambian opacidades del vidrio
ni se montan/desmontan renderers según `pressedProgress`. Una caché que termina durante
un contacto queda pendiente hasta reposo completo. Mientras se prepara o si falla,
el control conserva su material nativo y su callback, sin fingir refracción equivalente.

## Volumen y respuesta

Pan nativo con distancia mínima cero → posición/presión/velocidad en UI → shader Skia.
No se transmite la posición a React por frame. Haptics y acciones cruzan como eventos,
no como el bucle de animación. Las trazas de laboratorio están apagadas por defecto.

El campo de contacto tiene altura negativa, núcleo y transición suave de soporte
compacto. Un relieve inicial del bisel proporciona la normal de reposo; la presión
modifica esa normal y determina a la vez desplazamiento de muestras, proyección del
relieve, reflexión diferencial y oclusión tenue. No hay ondas ni variable de tiempo.

Valores calibrados, no medidos físicamente en el video: radio 42 dp, soporte hasta
63 dp, profundidad 2,45 dp, transición de entrada 86 ms, muestra desplazada como máximo
3,4 dp. El límite es suave para evitar una discontinuidad al saturar. El perímetro
exterior queda fijo. Solo el texto/círculo tienen un acompañamiento local de hasta
0,9 dp; no hay escala de letras, deformación, blur ni reducción global del botón.

HOLD queda inmóvil. RELEASE recupera la presión mediante spring: masa 0,4, rigidez
1500, amortiguación 49. La velocidad de arrastre caduca a los 80 ms para no introducir
un desplazamiento direccional cuando se suelta después de mantener quieto el dedo.
Movimiento reducido: profundidad 0,32 dp y acompañamiento de contenido máximo 0,12 dp.

## Refracción y sus límites

El shader admite una imagen controlada como capa inferior distinta del material.
La cuadrícula de QA y la franja azul están **debajo** del vidrio, no dibujadas como
parte de sus reflejos. Sus coordenadas se muestrean a través de la normal deformada.

En la Home se intenta copiar y recortar una vez el `BlurTargetView` que corresponde
al fondo real. Solo se aplica la diferencia de color refractado respecto al muestreo
original; el blur y la apariencia de reposo se conservan. Este fondo es una captura de
layout, no un backdrop arbitrario que se actualice en vivo durante scroll o cambios
de contenido. Para una escena dinámica controlada se puede proporcionar `substrate`.
No se promete una refracción universal de vistas React Native externas.

## Pruebas y evidencia

El laboratorio utiliza el tamaño lógico de la Home, no un botón agrandado. Se compara
además con el componente SVG original en una instancia independiente para detectar
regresiones de reposo. La prueba geométrica apaga iluminación **y** acompañamiento
del texto; una diferencia no puede atribuirse entonces al movimiento de las letras.

El protocolo registra tap, hold, horizontal, ida/vuelta, círculo, vertical, cancelación,
refracción, ablación, taps repetidos, geometría sola, material solo, movimiento reducido
y deshabilitación. Una segunda grabación abre la Home real, mantiene/arrastra/cancela
y verifica el panel de la acción tras tap y release válidos.

La primera pulsación está grabada; no se descarta un contacto para precalentar el
motor. Se espera a que termine la preparación inicial, por lo que no se mide latencia
de arranque en frío. Screenrecord es variable: no se confunde su número de cuadros
con FPS sostenidos. Los FPS reportados corresponden a SurfaceFlinger.

JavaScript de producción (`--no-dev --minify`) dentro de Expo Go no equivale a compilar
un APK/IPA release. El emulador usa SwiftShader/API35, 720×1600 y densidad 280 dpi.

## Iteraciones y correcciones

1. La conversión inicial del SVG a Skia tenía un error de escala en la caché.
2. Corregida la escala, el renderer SVG estándar difería del material RN-SVG aprobado:
   el MAE nativo de reposo fue 8,904/255. No se aceptó ni se relajó el umbral para ocultarlo.
3. La caché del vector nativo conserva la fuente exacta y permanece estable durante el
   gesto. El primer chequeo de tipos detectó el posible retorno nulo del snapshot;
   se añadieron guards explícitos para conservar el fallback.
4. La prueba de fondo detectó que el wrapper nativo de Expo no exponía el método de
   medición de una View estándar. Se añadió la medición de su host nativo. La ejecución
   final confirmó tres preparaciones de caché (instancia inicial, comparación y Home),
   todas con fondo disponible, sin capturas por cada pulsación.

## Resultado de la ejecución final

Runtime: `049baca058b4602f7f2e3f2dc83fa1d8275f0206`.
[Checks Expo](https://github.com/vellxw/Liquid-Glass-Cuki/actions/runs/35025476573)
y [ejecución nativa Android](https://github.com/vellxw/Liquid-Glass-Cuki/actions/runs/35025476822).
Artifact `10419811634` conserva las grabaciones originales y todos los datos.

| Medición nativa del recorte RGB (0–255) | MAE |
| --- | ---: |
| SVG original frente al reposo del nuevo renderer | 0,5556 |
| Reposo frente a presión | 5,5949 |
| Hold frente a otro cuadro más de 1 s después | 0 |
| Reposo frente a recuperación/cancelación | 0 |
| Deformación desactivada, reposo frente a hold | 0 |
| Geometría sin iluminación ni movimiento de contenido | 0,7005 |
| Borde fijado durante presión | 0 |
| Zona exterior al soporte local | 0 |

El reposo no es idéntico píxel a píxel al SVG original; la diferencia pequeña de
rasterización está medida, no oculta. La vuelta al reposo del propio renderer sí
fue idéntica en estas capturas. Estas métricas no expresan porcentajes de perfección
ni por sí solas demuestran una sensación física convincente.

Se comprobaron 13 acciones válidas en el laboratorio y otras 2 en la Home real.
Cancelar no activó el panel; tap y release válidos sí lo abrieron.
SurfaceFlinger, capa ExperienceActivity: **21,491 FPS presentados grabando** y
**29,180 FPS sin grabar**. Son segmentos de 128 y 170 cuadros respectivamente.
No se alcanzaron 60 FPS en este entorno. No se selecciona la cifra superior de
otra iteración, ni se atribuyen causalmente diferencias entre runners al shader.

Las pruebas numéricas/del host no certifican tactilidad. La aceptación final requiere
revisión perceptual y rendimiento en teléfono real, iOS y haptics físicos.

## Ejecutar

```
npm install
npx expo start --go --clear
```

Para el laboratorio: `EXPO_PUBLIC_LIQUID_LAB=1` en `.env.local` y reiniciar Metro.
Sin esa variable se abre la Home. Debug/cuadrícula se mantienen apagados inicialmente.

```
npm run typecheck
npm run check
npm run check:register
npm run check:liquid
node qa/liquid/pipeline-check.cjs
npm run export:android
npm run export:ios
```

Son 97 pruebas host/numéricas: 40 base, 11 material, 35 gesto/campo y 11 pipeline.
Las exportaciones JavaScript no se presentan como compilaciones nativas.
