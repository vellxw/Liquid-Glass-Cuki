# Validación de la entrega Home 1.1.0

## Ejecutado en la preparación del paquete

- Resolución de imports locales y transpilación sintáctica TS/TSX mediante TypeScript disponible en el entorno.
- 17 comprobaciones estructurales de la barra.
- 23 comprobaciones estructurales de Home, layout, slots, acciones y feedback.
- SHA-256 de los siete archivos originales de la barra frente al ZIP SDK 57.
- Verificación del contenido y extracción del ZIP final.

Los tests usan componentes host simulados. No comprueban Yoga, CoreText, el blur nativo, accesibilidad en dispositivo ni interacciones reales del sistema.

## Fuentes de esta entrega

El ZIP anterior contenía toda la barra y su demo. Los adjuntos de la actualización contenían HomeScreen.tsx y App.tsx, pero no sus dependencias locales. Se conservaron estos dos archivos y se completaron los módulos de Home a partir de la composición y medidas de la referencia. Los archivos de la barra no se editaron.

Las 4 iteraciones y métricas históricas comunicadas previamente no se presentan como mediciones de este paquete. Tampoco se incluyen en runtime imágenes de esas revisiones.

## Pendiente de verificación nativa

El registro npm no resolvió en el entorno de preparación; no fue posible instalar las dependencias de Expo. No se ejecutaron localmente `tsc --noEmit` con las dependencias completas, Expo Doctor, los bundles de Metro, Xcode, Gradle ni Expo Go.

El workflow `.github/workflows/checks.yml` ejecuta la instalación y las comprobaciones de JavaScript y TypeScript en GitHub. Incluso un workflow satisfactorio no sustituye la revisión visual de la aplicación en iOS/Android.

## Revisión manual recomendada

Abrir en Expo Go SDK 57. Revisar la Home al inicio, las safe areas y el scroll en una pantalla corta. Pulsar todos los destinos y ambos botones Registrar varias veces. Comprobar Perfil, Nutrición y Ver rutina. Revisar bordes, blur y baseline con las fuentes nativas del dispositivo. Usar `showAssetGuides` para ver los espacios de fotografías sin alterar el layout.
