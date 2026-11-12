# Verificación de miniguías AE-01 a AE-04

Revisión: 12/11/2026. Alcance exclusivamente documental; no acredita instalación ni conectividad.

## Base y fuentes verificadas

- `main = a3d06a500a024212ff83c59ab7cb9ed2f1a98ff3`, consultado por GitHub. Comparación con auditoría `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`: 36 commits adelante, 0 detrás. No se extrapola el estado de la auditoría a producción.
- Leídos AGENTS.md, README.md, inventario y registro PurpleAir actuales. [Plan institucional](../plan_despliegue.docx), blob `5f605f3bb57dd97364317a8c366a390631c33a44`, idéntico al archivo de referencia local.
- Los ocho PDF existentes en `C:\GitHub\lemeit-aq\docs\instalacion` se compararon por SHA-256 con copias cuyo blob Git coincide con main: todos idénticos. No había valores locales nuevos que preservar. Esa carpeta no se modificó.
- Tres adjuntos recuperados de la conversación de referencia, leídos y renderizados. SHA-256:
  - AE-02 Digital Color: `9ea6313b67a1e6e287a0de61872a953b6092adb83ff6034d8e5b435d14432ea5`.
  - AE-02 impresión: `26330e5ddf4bf648c19a6606cf65200b2a599a34e2b017b3a2d01ae3e6f88972`.
  - AE-01 impresión editable: `2e6c8d3b05a18f167ced4b179a2d9f073643c7a920650b9f66172e80b113a36c`.
- El entorno Codex Cloud existente no está expuesto en esta sesión. Preparación y comprobación local de documentos y rama/PR mediante conector GitHub sobre la referencia exacta; no se crea otro entorno.

## Comparación y decisión

Las guías de main ya tenían diez campos editables y pie imprimible oscuro. No se atribuyen esos avances a esta revisión. Tras la comparación solicitada por el titular, se sustituyen las seis guías AE-01 a AE-03 con los nombres fijos existentes y se agregan dos AE-04. AE-00 se conserva sin cambios.

Reproducción: los tres adjuntos conservan la tabla 0.0-12.0 / 12.1-35.4 y una fila genérica >150 / >55.5; el adjunto AE-01 contiene texto AE-02 debajo de las sustituciones AE-01 y fecha concreta de montaje sin respaldo. Las guías de main ya corregían visualmente parte de esos defectos, pero mantenían la tabla histórica, nombres abreviados y fondos/encabezado que consumen más tinta. Las páginas nuevas se componen de nuevo para eliminar texto residual, preservando las cuatro secciones técnicas, orden y estructura general.

Mejoras justificadas:

- Pie y etiquetas negros o muy oscuros; impresión sin fondos de color y sin gran bloque oscuro en cabecera.
- Denominaciones exactas del plan: Esc. de Educación Artística N°1 "Lola Mora"; Esc. de Educación Secundaria N°2 "Manuel Pardal"; Instituto Niño Jesús; Esc. Agraria C.M. Casares (EAS Del Valle). Distritos según plan.
- Se conservan íntegros sensor index, Device ID, alta y coordenadas de registro de AE-01 a AE-03 en Observaciones, tomados de las guías de main y contrastados con REGISTRO_PURPLEAIR.md. No son verificación de campo.
- Fecha de montaje vacía, sin año prefijado. El alta del proveedor no se copia a instalación. AE-04 usa únicamente el código reservado; identificación, alta y coordenadas quedan como pendientes, sin inventarlas.
- Texto de montaje, configuración Wi-Fi, mantenimiento y diagnóstico preservado; cambios menores de redacción y espaciado sin alterar los pasos. Se elimina iconografía dependiente de fuentes para evitar glifos defectuosos. El plan general dice 2-4 m y la guía original 1.5-2.0 m: se conserva el original por alcance, sin resolver esa diferencia mediante una suposición. Acordar el punto físico en el relevamiento institucional.
- La etiqueta Wi-Fi aclara "sin clave". Datos personales y copias completadas son de uso local, no para publicar en Git.

## Umbrales EPA y alcance temporal

[Tabla vigente EPA/AQS, fechada 11/11/2026](https://aqs.epa.gov/aqsweb/documents/codetables/aqi_breakpoints.html), consultada 12/11/2026; parámetro 88101, duración 24 HOUR. [Explicación EPA de la revisión 2024](https://www.epa.gov/system/files/documents/2024-02/pm-naaqs-air-quality-index-fact-sheet.pdf).

| AQI | PM2.5 de 24 h (µg/m³) | Categoría |
| --- | --- | --- |
| 0-50 | 0.0-9.0 | Bueno |
| 51-100 | 9.1-35.4 | Moderado |
| 101-150 | 35.5-55.4 | Insalubre para sensibles |
| 151-200 | 55.5-125.4 | Insalubre |
| 201-300 | 125.5-225.4 | Muy insalubre |
| 301-500 | 225.5-325.4 | Peligroso |

Se reemplaza la tabla histórica porque ya no representa los intervalos vigentes. Se corrige además el hueco en 55.5 causado por " >55.5". Por encima de 325.4 se aclara que se excede la escala 0-500; no se extrapola una cifra.

La columna escolar conserva la orientación original resumida, incluida la recomendación genérica original para >150 repetida en los tres tramos altos. Se identifica explícitamente como orientación heredada, no como protocolo EPA ni autorización institucional. El [indicador del portal](../AQI_TRAZABILIDAD.md) usa concentración disponible: no equivale a promedio diario ni NowCast. Esta revisión no modifica su cálculo.

## Pruebas y criterios de aceptación

Resultados: ocho archivos, ocho páginas A4, diez campos AcroForm por archivo (80 en total). Ambas versiones son editables.

- Reapertura con pypdf: diez campos canónicos y diez widgets por página; nombres y valores coincidentes, apariencias /AP /N presentes. Códigos de cabecera, portal y ficha iguales a la estación. Fecha vacía.
- Guardado y reapertura de una copia de prueba por PDF con valores sintéticos en los diez campos: 80/80 conservados, widgets y campos canónicos coincidentes, apariencias presentes. Fecha y observaciones multilínea incluidas. Las copias de prueba no se publican.
- Renderizado Poppler a 120 dpi de los ocho originales finales y revisión visual de las ocho páginas; muestra rellenada renderizada adicionalmente. Sin superposiciones, texto cortado, glifos perdidos ni datos de otra estación. Pie oscuro y campos legibles. Poppler local avisa que no tiene fuente de pantalla Symbol; no se emplea esa fuente en el contenido visible y la inspección no detectó pérdida de glifos.
- Se preservan todos los datos de registro existentes; solo la institución se expande al nombre del plan y el año prefijado del formulario se retira. Se verifican rutas relativas del índice contra los archivos nuevos y conservados.
- Revisión de contenido: no hay contraseñas, tokens, claves de lectura ni ubicaciones domiciliarias. No se incorporan referentes/teléfonos reales.
- Alcance del diff: ocho PDF y documentación en docs/, sin código, D1, configuración, ingestas, consultas al portal ni despliegues. No hay cambio de consumo ni frecuencia.
- Límite: verificación digital de formularios y renderizado; no se realizó impresión en una impresora física ni prueba en todos los lectores PDF.

## Revisión y reversión

Rama independiente desde el SHA indicado; commit con `[CF-Pages-Skip]` para omitir despliegue Pages. PR para revisión, sin fusión. Revisar diseño y denominaciones antes de usar en campo. Los nombres fijos evitan duplicados y el historial Git conserva las versiones previas. Descartar la rama revierte la propuesta; una eventual fusión requeriría decisión del titular. La sustitución documental no registra AE-04 en PurpleAir ni en LEMEIT.
