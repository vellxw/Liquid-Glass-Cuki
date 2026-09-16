# Registrar: botón nativo, sin simulación de presión

## Resultado

Se elimina `src/liquid`, `LocalRegisterArtwork`, el seguimiento de presión, los shaders,
las capturas/cachés de la simulación, sus laboratorios y benchmarks. Skia, Reanimated,
Worklets, Gesture Handler y Expo Haptics dejan de ser dependencias directas.
El historial Git conserva el trabajo anterior; el árbol actual no lo carga.

En iOS se utiliza un Button real de SwiftUI mediante @expo/ui. El estilo glass y la
forma capsule delegan material, contacto y recuperación al sistema. No hay Pressable,
gesto de drag o animación custom encima. iOS 26+ usa glass; versiones anteriores usan
bordered. Glass requiere además una compilación con Xcode 26+. El aspecto de Registrar
en iOS es ahora el de Apple, no una copia pixel-perfect del SVG previo.

Android usa un Pressable normal sobre el vidrio estático de CUKI, sin deformación.
No se presenta ese fallback como el material exclusivo de Apple. Disabled, busy y
callback ausente bloquean el botón. Mantener no repite, y salir de la zona de retención
del control cancela. La Home vuelve a ScrollView normal. Navbar, Ver rutina, iconos,
tokens y el material estático del fallback conservan los hashes protegidos.

## Validación

Runtime: 530d3fe303a4bdac6bec1ceef05f798c2a8d0cc7.
Árbol: 4201b9a4d28a29564bb6acbcb6d0223dcf9b96b9.
El source.zip de CI identifica el merge 7c69154459c0e6db3cb37a73dd03bd9d42e23dd6;
se reconstruyó su árbol y es idéntico al runtime. Este informe posterior no cambia
código de aplicación ni representa una nueva ejecución nativa.

- Checks: https://github.com/vellxw/Liquid-Glass-Cuki/actions/runs/35111717770
- Pruebas nativas: https://github.com/vellxw/Liquid-Glass-Cuki/actions/runs/35111717725

Pasaron instalación, compatibilidad de Expo, TypeScript, 62 checks del host (17 navbar,
23 Home, 11 material, 11 botón) y exportaciones JavaScript Android/iOS. Los checks se
repitieron desde la copia extraída. Los mocks no sustituyen las pruebas nativas.

iOS: XCTest sobre Expo Go en simulador iPhone 17 Pro / iOS 26.2, Xcode 26.3. Se verificó
un elemento nativo Button, altura >=44 puntos, tap, hold, cancelación, disabled, busy,
taps repetidos y acción de Home. Cuatro acciones de demo y una apertura del panel real.
Cero fallos del test. Se compiló el runner XCTest, no un IPA standalone de CUKI.
El log conserva cuatro esperas de idle/fin de animación de hasta 60 segundos en Home;
no se afirma que midan latencia táctil ni se atribuye su causa al nuevo botón.

Android: Expo Go / API35 / SwiftShader / 720x1600. Cuatro acciones de demo y la acción
de Home, hold sin repetición, cancelación sin acción y estados disabled/busy comprobados.
Recuperación al reposo: MAE 0. No se compiló un APK standalone en esta ejecución.

No se certifican FPS, latencia touch-to-photon, lectores reales o tactilidad en teléfono.
Es una sustitución del motor rechazado por controles del sistema, no otra simulación.

## Evidencia y reproducción

Artifacts originales: iOS 10453087612; Android 10452961117; checks/source 10452164070.
La demostración iOS es un extracto de la grabación nativa, sin interpolación ni aceleración.
El original tiene una discontinuidad de timestamps durante la preparación inicial;
se conserva intacto en la evidencia. El extracto empieza después y omite menús y esperas.
No se usa la frecuencia variable del MP4 como benchmark. Se entrega también la Home en PNG.

```bash
npm install
npx expo start --go --clear
```

Node >=22.13.0 y Expo Go SDK 57. Extraer en una carpeta nueva para no conservar archivos
eliminados. Recompilar development builds anteriores: cambiaron las dependencias nativas.
Demo opcional: EXPO_PUBLIC_BUTTON_DEMO=1 en .env.local y reiniciar Metro.
EXPO_PUBLIC_LIQUID_LAB deja de tener efecto. Sin variable se abre la Home.

Fuentes oficiales:
- https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/button/
- https://developer.apple.com/documentation/swiftui/glassbuttonstyle
