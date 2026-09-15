# Registrar: círculo nativo y continuidad del material

El primer run de esta PR (`35028331672`, commit `036a23f`) pasó drag, hold,
release, cancelación y ablación, pero falló el gate estricto de reposo.
La diferencia restante fue MAE 0,00286834: 288 píxeles, máximo 2/255 por canal,
todos localizados en el borde antialias del círculo +. No se borró ni relajó
la aserción. La composición del círculo en una capa SVG separada no tenía los
mismos redondeos de color que el SVG original compartido con el material.

Ahora el círculo mantiene el pase SVG nativo original junto con el material.
Es un inserto rígido: no se traslada, no se deforma y no se remuestrea. El shader
protege su radio más el límite de muestreo de 3,4 dp y el filtro bilineal; la
contribución óptica se desvanece suavemente fuera de esa protección. Las letras
siguen separadas y pueden acompañar hasta 0,9 dp. No se añade una escala ni un
desplazamiento del botón completo. La depresión del vidrio continúa alrededor
del inserto; la zona cubierta por el círculo no pretende ser vidrio deformable.

El siguiente run debe volver a verificar el mismo recorte completo, sin excluir
el círculo de la máscara ni reducir el criterio de MAE=0. La prueba host compara
los atributos originales de ambos círculos; no reemplaza el gate nativo.

Siguen pendientes el backdrop externo en vivo, haptics físicos, rendimiento en
un teléfono y las pruebas nativas iOS. No se declara Fase A completa, ni se
extiende esta interacción a otros controles. Los parámetros de presión son de
prototipo, no mediciones físicas extraídas del video oblicuo de referencia.
