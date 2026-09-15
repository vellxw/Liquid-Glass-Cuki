# Registrar: borde y material primario

Base: `be81c2ec8a451e7298c67ad1abc835c85a90293e`.
El árbol completo del ZIP inicial coincide con GitHub:
`978b38dbc209bdeb48c44affbc5d8f220da2ba0b`.

## Cambio acotado

`src/home/GlassButton.tsx` selecciona el nuevo `RegisterButtonMaterial.tsx`
solo para `primary`. El círculo, su gradiente, el signo +, HomeText, Pressable,
blur, opacidad al pulsar, dimensiones y callback se conservan.
No cambia `PrimaryRegisterButton.tsx`, el layout, las dependencias ni la navegación.

El nuevo material utiliza contornos cerrados, atenuación radial y campos
elípticos tangentes a las curvas. No tiene extremos de paths abiertos,
filtros SVG, máscaras nuevas, texturas, imágenes ni animaciones.
Los perfiles suaves son muestras de una caída gaussiana con alfa diferencial:
no anillos blancos idénticos superpuestos. Los reflejos especulares se atenúan
tanto transversalmente como a lo largo de la curva.

## Medidas y comparación

| Dato | Referencia | Captura anterior |
|---|---|---|
| Archivo completo | 941 × 1672 px | 600 × 1335 px |
| Origen aproximado del botón | (241, 860) | (116, 637) |
| Ancho | 460 px | 368 px |
| Escala respecto al espacio vectorial | 1 | 0,8 |

Se mantiene el espacio vectorial existente de **460 × 122**, con 12 unidades
exteriores para QA. La altura de la referencia es aproximadamente 124 px:
esa diferencia de 2 px se registra, no se oculta estirando el recorte.
No se modifica la geometría aceptada del botón para reducir el error.

Centros orientativos del campo de luz, en coordenadas normalizadas (u,v):
frío (0,080; 0,148), champán (0,917; 0,189), verde tenue (0,059; 0,852),
nacarado (0,915; 0,893). Los máximos especulares siguen arcos interiores;
estos centros describen el halo, no una mancha uniforme sobre la superficie.

La máscara se fijó antes de editar: distancia firmada a la cápsula entre
-15 y +3 unidades. Incluye **todo el perímetro y todas las esquinas**,
18.392 píxeles, sin recortar zonas después del refinamiento.
El núcleo se evalúa separadamente sobre una banda libre de texto.
`qa/register/comparison-config.json` conserva transformaciones y límites.

### Iteraciones realmente ejecutadas (diagnóstico vectorial)

1. Contornos cerrados y nuevo núcleo oscuro. Se detectaron bandas duras.
2. Atenuación gaussiana y menor contraste del surco. Persistían reflejos con
   silueta demasiado definida.
3. Campos elípticos con transparencia transversal; se detectaron pequeños
   máximos separados a lo largo de las curvas.
4. Muestreo continuo de los arcos para integrar esos máximos y añadir
   reflexión cálida inferior izquierda.
5. Anchura especular, caída suave del halo y temperaturas de los reflejos
   inferiores, sin cambiar geometría ni contenido.

| Región | MAE vector anterior | MAE vector revisión 5 |
|---|---:|---:|
| Perímetro completo | 46,533 | 37,762 |
| Superior izquierda | 53,203 | 43,682 |
| Superior central | 47,245 | 32,899 |
| Superior derecha | 53,992 | 42,976 |
| Inferior derecha | 46,231 | 41,569 |
| Inferior central | 37,726 | 30,464 |
| Inferior izquierda | 52,336 | 52,314 |
| Núcleo, diagnóstico aparte | 26,461 | 14,383 |

Perímetro: RMSE 63,090 → 53,721; media local de SSIM 0,2405 → 0,2610.
La captura real anterior obtiene MAE 49,608 con esa misma máscara.
La mejora inferior izquierda es mínima: sigue requiriendo atención en la
comprobación nativa. Ninguno de estos números representa un porcentaje de
perfección. Los vecindarios de SSIM pueden abarcar píxeles fuera de la máscara.

La referencia tiene fotografía bajo el vidrio. El diagnóstico usa fondo
neutro explícito #0B1315 y **no renderiza BlurView ni la tipografía nativa**.
No se reconstruyó el fondo ni se normalizó la exposición para mejorar el score.
Las imágenes de antes y después no son dos capturas nativas comparables.
Las comparaciones PNG, overlay 50 %, diff absoluto y máscara se entregan
como evidencia adjunta a la conversación; no se cargan desde la app.

## No regresión y comandos

40 checks existentes y 11 nuevos checks estructurales pasan localmente.
La nueva batería se ejecuta también en el workflow existente de GitHub Actions.
Protege los archivos runtime ajenos al material por SHA-256, el dibujo
secundario normalizado, la geometría, los controles, el círculo, IDs únicos
SVG, transparencia final de gradientes y límites de los strokes.
Además, el render vectorial de Ver rutina es idéntico píxel a píxel antes/después.
Esto no equivale a una prueba visual en dispositivo.

```bash
npm install
npx expo install --check
npm run typecheck
npm run check
node qa/register/check.cjs
npm run export:android
npm run export:ios
```

La instalación local agotó el tiempo de espera del registro npm. Los checks
locales utilizan el loader de inspección existente y TypeScript del host;
las validaciones con dependencias instaladas se ejecutan en GitHub Actions.
Consultar el resultado de CI en el PR. Exportar bundles no compila un APK/IPA.

### Reproducir el diagnóstico (opcional, herramientas QA externas)

`render.cjs` reutiliza el JSX del componente, no una segunda implementación.
Necesita TypeScript resoluble por Node. Su SVG se puede rasterizar con una
herramienta externa; los PNG que usa compare.py deben medir 968 × 292 (2×).

```bash
node qa/register/render.cjs . /tmp/review/v5.svg
python -m pip install pillow numpy scikit-image
# Rasterizar el SVG a v5.png, a 2x, antes del siguiente comando.
python qa/register/compare.py referencia.png captura-anterior.png /tmp/review
```

`baseline.png` y `v1.png` a `v5.png`, cuando estén presentes en ese directorio,
se comparan con la misma configuración. Las dos capturas originales son
entradas de análisis del usuario, no assets redistribuidos de la aplicación.

## Validación nativa pendiente / PR

No hay captura de esta revisión en Expo Go, simulador o teléfono. La revisión
se publica en `fix/register-glass-polish` con PR hacia `main`, sin fusionar:
la validación del material nativo queda pendiente incluso si CI pasa.

Para probarla en el mismo teléfono de la captura anterior:

```bash
git clone --branch fix/register-glass-polish https://github.com/vellxw/Liquid-Glass-Cuki.git
cd Liquid-Glass-Cuki
npm install
npx expo start --go --clear
```

Abrir la Home con el mismo Expo Go compatible con SDK 57, sin pulsar el botón,
mantener orientación/escala del dispositivo y capturar una imagen completa
sin recomprimir. Revisar el tamaño real y las cuatro esquinas ampliadas.
Probar Registrar, Ver rutina y la navegación después. Un emulador Android,
cuando esté conectado, permite capturar con `adb exec-out screencap -p`.
El diagnóstico SVG es auxiliar; no sustituye este paso ni acredita pixel-perfect.
