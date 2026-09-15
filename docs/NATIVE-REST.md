# Registrar: conservar el reposo nativo, componer solo la deformación

Alcance: únicamente Registrar +. Revisión sobre `049baca058b4602f7f2e3f2dc83fa1d8275f0206`; no cambia el material aprobado ni se extiende a navbar, Ver rutina, sliders o toggles.

## Defecto observado antes de esta revisión

La ejecución Android `35025476822` mostró seguimiento local, hold estable y recuperación exacta respecto a su propio reposo, pero la comparación con el SVG nativo original tuvo MAE RGB 0,55556. Su Canvas reemplazaba el material nativo por una textura remuestreada, incluso con presión cero. Eso no acredita identidad con el reposo original. No se debe confundir recuperación exacta con identidad respecto al diseño aprobado.

## Cambio

El SVG nativo queda montado e intacto durante toda la interacción. La capa Skia calcula primero el material deformado, con el mismo campo de altura negativo, normales, refracción y oclusión. Después compone únicamente su diferencia respecto al material de referencia de esa instancia. No cambia el opacity de una View ni escala la cápsula.

Para una base B y un destino óptico D, se resuelve la composición source-over por píxel: color premultiplicado = alpha * B + (D - B). Alpha se elige para representar el cambio de color sin salir de los límites premultiplicados. No es una curva de presión ni una sustitución de la geometría por brillo: el destino D se obtiene remuestreando las coordenadas según la normal local. Con presión cero, fuera del contacto y en el rim fijado, el shader devuelve transparencia exacta.

El texto y el círculo + siguen fuera del shader; como máximo acompañan 0,9 dp. El gesto nativo y los shared values no cambian. Los uniformes se derivan en UI; no se transmiten coordenadas a JavaScript durante cada frame. La preparación del material ocurre al establecer layout, no al pulsar.

## Verificación

`node qa/liquid/overlay-check.cjs` comprueba la composición con 20.000 pares deterministas y casos extremos, además de la transparencia en reposo y la permanencia de la fuente nativa. Son tests host, no pruebas GPU.

El workflow nativo ejecuta el mismo protocolo de MotionEvent y screenrecord, conserva sus máscaras de localidad y añade `python qa/liquid/strict-rest.py`. Este exige MAE **0** frente al original nativo, en hold, release, cancelación, ablación y rim. La existencia de este código no significa que haya pasado: consultar el run del SHA exacto y `strict-result.json`.

## Límites que no desaparecen con este cambio

El backdrop nativo se captura al establecer layout. No es una refracción en vivo de contenido React Native arbitrario en movimiento. Una capa SkImage explícita puede alimentar una escena controlada, pero eso no convierte automáticamente toda la Home en una escena refractada en vivo. Si el backdrop cambia respecto a la captura, la composición durante contacto es aproximada; el reposo continúa siendo el material nativo.

Haptics físicos, latencia touch-to-photon, rendimiento de teléfono y pruebas nativas iOS siguen pendientes. No declarar Fase A completa ni fusionar automáticamente. Los documentos anteriores conservan el historial; este archivo describe el cambio de composición, sin atribuirle métricas no ejecutadas.
