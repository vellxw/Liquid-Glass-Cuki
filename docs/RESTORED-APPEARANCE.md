# Registrar: estética original restaurada

## Corrección

El usuario pidió retirar la simulación de presión, no perder el diseño. La revisión
anterior usaba el aspecto estándar de SwiftUI `glass`, que sustituía el fondo, borde,
círculo y tipografía por los del sistema. Esa sustitución se revierte.

`useGlassButtonArtwork` contiene el MISMO árbol nativo de la versión aprobada: blur,
SVG, material, ambos círculos, signo + y HomeText. Solo se extrajo del componente
interactivo; no se volvieron a dibujar sus paths ni se sustituyeron por imágenes.
La variante secundaria reutiliza exactamente el mismo árbol que tenía antes.

En iOS, el label del Button nativo aloja ese árbol mediante RNHostView. `plain`
es intencional: evita que el sistema cambie el aspecto mientras conserva el control
nativo. El label no contiene un Pressable y no intercepta el contacto; el Button
es el único dueño de la interacción y accesibilidad. La forma de hit-testing es
una cápsula del tamaño del diseño original, sin padding del estilo de sistema.

Android mantiene su Pressable habitual sobre el mismo dibujo. El scroll de Home
sigue siendo normal. La API, callback y estados disabled/busy se conservan.
No vuelve el motor eliminado: sin deformación, simulación de presión, shader,
capturas del botón, springs propios ni dependencias de la etapa anterior.

La superficie visual es el Black Glass de CUKI, no el material propietario de Apple.
Conservar una acción SwiftUI no implica usar su skin estándar.

## Alcance

El material, iconos, tipografía nativa, tokens, HomeScreen, PrimaryRegisterButton,
Ver rutina y los siete archivos de la navbar están protegidos mediante hashes.
No se añadieron dependencias ni se cambió Expo SDK. La carpeta `src/liquid` sigue
eliminada y no puede reactivarse mediante una variable de entorno.

## Verificación del código

Runtime: `3cca7d1988b7f9f69cd4b0726a2c0ea9f7139f73`.
64 checks del host: 17 navbar + 23 Home + 11 material + 13 botón. El fixture
`qa/button/approved-GlassButton.tsx.fixture` es el componente completo anterior,
con sus importaciones originales; el test compara las dos variantes en cuatro
escalas. El fixture no se importa en la app ni renderiza una referencia PNG.

Checks Expo: https://github.com/vellxw/Liquid-Glass-Cuki/actions/runs/35138426271
Instalación, compatibilidad, TypeScript, 64 tests y exportaciones Android/iOS
terminaron correctamente. La copia local se comparó byte a byte con source.zip
del run. Los cambios posteriores de informe/QA no se presentan como nuevo runtime.

## Pruebas nativas

Run: https://github.com/vellxw/Liquid-Glass-Cuki/actions/runs/35138426272
Android utiliza Expo Go/API35/SwiftShader; iOS utiliza Expo Go y XCTest en simulador.
El protocolo comprueba tap, hold sin repetición, cancelación exterior, disabled,
busy, repetición y la acción real en Home. Son pruebas nativas de esos entornos,
no mediciones de FPS, latencia touch-to-photon ni validación de teléfonos físicos.

Android: el reposo antes/después de extraer el dibujo tiene MAE 0 sobre el rectángulo
completo de 442 × 117 píxeles, misma posición, sin reescalar. La recuperación también
es idéntica. La navbar y Ver rutina no reciben este nuevo wrapper iOS.

La prueba iOS guarda dos capturas y sus geometrías: diseño original RN y restaurado
dentro del Button SwiftUI, ambos en la misma caja. `qa/button/compare-ios.py` calcula
la diferencia sobre el rectángulo completo; no excluye bordes, círculo o letras.

## Resultado final de esta revisión

Ambos jobs nativos terminaron correctamente. iOS 26.2, iPhone 17 Pro simulado y
Xcode 26.3: XCTest comprobó cuatro acciones de demo, cancelación, hold sin repetición,
los estados bloqueados y una acción de Registrar dentro de la Home. El botón sigue
identificándose como un Button real, no como un gesto sobre una imagen.

La comparación iOS dio **MAE 0, RMSE 0 y error máximo por canal 0** sobre el rectángulo
completo de **740 × 196 píxeles**. Original y restaurado ocupan exactamente el mismo
rectángulo `(233, 713)–(973, 909)` en las capturas, a escala física 3. No se reescalaron
los recortes ni se excluyeron textos, círculo, bordes o interiores. Android también
dio MAE 0 comparando el dibujo antes/después de su extracción como módulo compartido.

Artifacts de esta ejecución: iOS `10464258883`, Android `10464472497`, checks
`10463409401`. Los originales, la comparación y sus datos se entregan por separado
como evidencia; no forman parte de los assets de la interfaz.

El video breve conserva 63 cuadros consecutivos de la demo iOS, unos 3,3 segundos,
con sus intervalos internos originales. Solo se aplica reducción espacial uniforme,
sin interpolar movimiento ni acelerar. No es toda la sesión ni un benchmark. El
original tiene discontinuidades de timestamps fuera de este fragmento y se conserva
completo en la evidencia. El log de XCTest registra esperas de idle/animación al entrar en la
Home que también aparecían en la entrega previa. No se atribuyen esos tiempos a la
latencia del botón ni se declara resuelto su origen en esta tarea estética.

Se preservan las limitaciones del ensayo: simuladores con Expo Go, no un IPA/APK de
producción ni un estudio de FPS, latencia física o lectores de pantalla en teléfonos.
La modificación recupera el diseño y conserva el botón ordinario; no restaura la
simulación de presión ni presenta la superficie dibujada como Liquid Glass nativo.
