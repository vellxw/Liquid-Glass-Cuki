# BottomNavGlass

Barra de navegación nativa reconstruida a partir de la imagen de referencia de 2048 × 684 px. React Native + Expo + TypeScript. Cinco destinos: **Hoy, Recetas, Registrar, Entrenar, Progreso**.

La implementación contiene vistas y controles nativos, texto nativo, vectores propios y desenfoque nativo. Los PNG de revisión no forman parte del proyecto ni se cargan en tiempo de ejecución.

## Ejecutar el proyecto nuevo

Base de dependencias: **Expo SDK 57, React 19.2.3 y React Native 0.86.3**. Node 22.13.0 o posterior (se incluye `.nvmrc` para Node 22). Expo Go debe admitir SDK 57.

```sh
npm install
npx expo install --fix
npx expo-doctor@latest
npm run typecheck
npm run check
npm run start:clear
```

Para una compilación nativa local:

```sh
npm run android
# o, en macOS con Xcode:
npm run ios
```

`npm start` inicia Metro, no crea por sí solo un binario nativo. Para abrirlo con Expo Go, la aplicación de Expo Go debe ser compatible con el SDK del proyecto; en caso contrario, utiliza una compilación nativa local. Los scripts `android` e `ios` requieren el SDK de Android o Xcode, respectivamente.

No se incluye un archivo de bloqueo de dependencias: no se pudo resolver npm desde el entorno de entrega. `expo install --fix` alinea los paquetes con la revisión instalada de SDK 57 y npm generará el archivo de bloqueo localmente.

## Corrección de compatibilidad con Expo Go

Esta revisión sustituye el manifiesto de SDK 55 por dependencias de SDK 57. Se mantienen sin cambios las fuentes del componente y la pantalla demo. Para una instalación nueva, extrae este ZIP en una carpeta distinta: no copies `node_modules`, `.expo` ni el archivo de bloqueo de la instalación anterior. Para migrar una carpeta existente, consulta `ACTUALIZACION-SDK57.md`.

## Archivos

```text
App.tsx                              Demo funcional y modo de referencia
index.ts                             Entrada de Expo
src/bottom-nav/
  BottomNavGlass.tsx                  Componente público: controles, estado y blur
  GlassMaterial.tsx                   Capas del vidrio, reflejos y bordes
  GlassIcons.tsx                      Cinco iconos vectoriales originales
  NativeLabel.tsx                     Texto nativo y ajuste de baseline
  tokens.ts                          Geometría, colores y parámetros importantes
  ReferenceFrame.tsx                  Encuadre nativo proporcional al original
  index.ts                           Exportaciones
qa/
  check.cjs                          Comprobaciones estructurales con hosts simulados
  render-vector.cjs                   Revisión SVG de las mismas capas vectoriales
  load-ts.cjs                        Cargador de fuentes para QA sin host nativo
  build-standalone.cjs                Genera la variante de un solo archivo
  RESULTADOS.md                      Alcance de las verificaciones realizadas
```

## Uso controlado

```tsx
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { BottomNavGlass, type BottomNavId } from './src/bottom-nav';

function Example() {
  const backgroundRef = useRef<View | null>(null);
  const [tab, setTab] = useState<BottomNavId>('hoy');

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <BlurTargetView ref={backgroundRef} style={{ flex: 1 }}>
        {/* Contenido de la pantalla */}
      </BlurTargetView>
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: 32 }}>
        <BottomNavGlass
          activeTab={tab}
          onChange={setTab}
          blurTarget={backgroundRef}
          onRegisterPress={() => console.log('Registrar')}
        />
      </View>
    </View>
  );
}
```

La demo completa aplica además los insets reales del dispositivo. La barra es independiente de la navegación y del área segura: no agrega padding inferior ni se posiciona de forma absoluta por sí sola.

## Uso sin estado externo

```tsx
<BottomNavGlass width={382.4} defaultActiveTab="hoy" />
```

Sin `activeTab`, el componente mantiene su selección internamente. Con `activeTab`, el padre controla la selección. `onChange` se invoca al pulsar cualquiera de los cinco destinos. `onRegisterPress` se invoca cada vez que se pulsa Registrar, incluso cuando ya está seleccionado.

Al seleccionar Registrar no se dibuja una cápsula rectangular detrás: se mantiene el círculo, se refuerza discretamente su borde y cambia a blanco el label. Los demás destinos reutilizan la cápsula activa desplazada a su centro. Estos estados adicionales son decisiones funcionales; la referencia solamente muestra Hoy seleccionado.

## Props

| Prop | Tipo / valor predeterminado | Función |
| --- | --- | --- |
| `width` | `number`, o ancho del padre | Ancho en puntos nativos; la altura conserva la proporción. |
| `activeTab` | `BottomNavId`, opcional | Selección controlada. |
| `defaultActiveTab` | `'hoy'` | Selección interna inicial. |
| `onChange` | `(id: BottomNavId) => void` | Notifica la pulsación de un destino. |
| `onRegisterPress` | `() => void` | Acción adicional de Registrar. |
| `blurTarget` | `RefObject<View \| null>` | Referencia al BlurTargetView del contenido en Android. |
| `blurIntensity` | `32` | Intensidad nativa. Cero desactiva la capa de blur. |
| `androidBlurMethod` | `'dimezisBlurViewSdk31Plus'` | Desenfoque en Android 12+; opción `'dimezisBlurView'` disponible para dispositivos anteriores. |
| `fontFamily` | Arial en iOS; sans-serif en Android | Permite seleccionar una fuente ya instalada en la aplicación. |
| `disabled` | `false` | Deshabilita las cinco interacciones. |
| `style` | `StyleProp<ViewStyle>` | Posición y márgenes exteriores. No agregar padding a esta vista. |
| `testID` | `'bottom-nav-glass'` | Prefijo para los cinco controles. |

Identificadores: `hoy`, `recetas`, `registrar`, `entrenar`, `progreso`.

## Mediciones y decisiones visuales

Las coordenadas siguientes están expresadas en píxeles de la referencia, no en puntos de React Native. Las cajas son aproximadas; los trazados conservan también las pequeñas asimetrías.

| Elemento | Medición |
| --- | --- |
| Imagen | 2048 × 684 |
| Contenedor exterior | x ≈ 67, y ≈ 110, ancho ≈ 1912, alto ≈ 444 |
| Cápsula activa | x ≈ 89, y ≈ 178, ancho ≈ 350, alto ≈ 340 |
| Registrar | Centro ≈ (1020, 275), diámetro visual ≈ 198 |
| Centros de los grupos | x ≈ 272, 638, 1020, 1413, 1774 |
| Baseline de los labels | y ≈ 440 |
| Tipografía | 56 px; Hoy 58 px; peso regular |
| Iconos normales | Siluetas de aproximadamente 80–115 px |
| Borde exterior | Aproximadamente 3 px en el plano de diseño |
| Bordes activo y central | 2.7 y 2.8 px en el plano de diseño |

El factor único es `anchoNativo / 1912`. A 382.4 puntos de ancho, la altura es 88.8 puntos, la cápsula activa mide 70 × 68 puntos y el círculo tiene aproximadamente 39.6 puntos de diámetro incluyendo su borde. No se estiran por separado los ejes.

El contenedor no es un rectángulo redondeado: su techo se arquea ligeramente. Tanto el contenedor como la cápsula usan curvas Bézier propias. El reparto horizontal utiliza centros medidos, no cinco columnas idénticas.

### Composición

1. `BlurView` nativo, recortado por `MaskedView` con la silueta exterior.
2. Fondo oscuro translúcido y gradiente de profundidad.
3. Reflejos radiales laterales y luz inferior del contenedor.
4. Cápsula activa con gradientes independientes, rebote verde, brillo cálido superior y reflejo lateral frío.
5. Círculo central con gradiente propio, reflexión perimetral, viñeta y varios perfiles de borde.
6. Vectores de los iconos y `Text` nativo sobre `Pressable` nativos.

Los reflejos suaves se construyen con gradientes elípticos y trazos superpuestos, no con filtros SVG dependientes del navegador. Los identificadores SVG son únicos por instancia. El material no captura los toques.

La opacidad original y la intensidad exacta del blur no pueden deducirse de una sola composición sobre negro; los valores de la implementación son parámetros de reproducción. La fuente exacta tampoco puede identificarse con certeza a partir de la imagen. Se usan fuentes nativas y el baseline se ajusta con las métricas de `onTextLayout`.

### Accesibilidad

Cada destino tiene su propio control nativo, label, estado de selección y estado deshabilitado. Las cinco zonas táctiles superan 44 × 44 puntos cuando la barra tiene al menos 280 puntos de ancho. Los adornos están ocultos al lector de pantalla. El orden visual está fijado de izquierda a derecha para conservar la referencia.

La escala automática del texto está desactivada para mantener las medidas de la captura. Para un producto con requisitos de texto ampliado, conviene definir una variante de mayor altura y tamaño de labels, en lugar de forzar la escala dentro de esta geometría fija.

## Blur y diferencias entre plataformas

El contenido a desenfocar debe estar dentro de `BlurTargetView`, y la barra debe renderizarse después como un hermano, no dentro de su propio objetivo de blur. La demo sigue esta estructura.

En Android sin `blurTarget`, se conservan las capas de material pero no se activa el blur. El método predeterminado usa blur en Android 12+ y evita la implementación más costosa en versiones anteriores. `MaskedView` tiene soporte Android experimental según la documentación de Expo; es importante verificar su composición en el dispositivo objetivo.

No se utiliza el material Liquid Glass del sistema como sustituto del dibujo: su apariencia no garantiza las proporciones ni los reflejos concretos de esta referencia. Aquí el aspecto es una reconstrucción de vidrio mediante capas nativas y vectoriales.

## Revisión y límites de validación

Se produjeron cinco versiones de revisión vectorial a partir del mismo código de materiales e iconos. Se corrigieron el contorno superior, las curvas laterales, el diámetro y centro del círculo, la intensidad del borde inferior, los reflejos localizados, el balance verde de la cápsula y el halo de la casa.

**Se ejecutaron 17 comprobaciones estructurales con resultados correctos.** Comprueban sintaxis, geometría, handlers, modos controlado y no controlado, deshabilitación, repetición de Registrar, composición de blur e identificadores SVG. Usan componentes host y hooks simulados para inspeccionar la estructura; no son pruebas de un motor React Native real.

**No se ejecutaron un simulador iOS/Android, una compilación nativa, ni `tsc` con todas las dependencias instaladas.** La resolución de npm no estaba disponible en el entorno. El PNG comparativo externo es una revisión de los vectores, con tipografía de escritorio sustitutiva y sin el compositor de blur nativo. No es una captura de Expo ni acredita igualdad píxel a píxel en un dispositivo.

El renderizador de QA puede exportar las mismas capas a SVG:

```sh
npm run qa:vector -- hoy
```

Ese archivo es solamente una herramienta de revisión. La aplicación no lo importa ni lo muestra como imagen.

Para generar la variante nativa de un solo archivo:

```sh
node qa/build-standalone.cjs
```

## Documentación técnica de las APIs empleadas

Estas fuentes se utilizaron para comprobar las APIs, no como referencias visuales:

- [Expo SDK 57](https://expo.dev/changelog/sdk-57)
- [Expo BlurView y BlurTargetView](https://docs.expo.dev/versions/v57.0.0/sdk/blur-view/)
- [react-native-svg en Expo](https://docs.expo.dev/versions/v57.0.0/sdk/svg/)
- [MaskedView en Expo](https://docs.expo.dev/versions/v57.0.0/sdk/masked-view/)
- [Safe area context](https://docs.expo.dev/versions/v57.0.0/sdk/safe-area-context/)
- [Métricas de Text](https://reactnative.dev/docs/text#textlayout)
