# Miniguías AE-04: diseño anterior conservado

12/11/2026. Por instrucción del titular se retira del PR la propuesta de rediseño. Se conservan **sin modificaciones** los ocho PDF AE-00 a AE-03 de la carpeta local y de main. Se agregan únicamente AE-04 Digital Color e Impresion y su entrada en el índice.

## Base y datos

Main comprobado: `7d170384846a650df61fa79b6cb34a63dbd5edf2`, 38 commits adelante y 0 detrás de la auditoría inicial `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`. Se mantienen AGENTS.md y el plan institucional revisados.

Plantilla: PDF AE-03 de cada versión en la carpeta local indicada, idénticos por hash a las copias existentes en main. Se modifica exclusivamente la identificación en los campos y los metadatos. Diseño, contenido técnico, tipografía, fondos, tabla y pie conservados.

Datos procedentes de [registro PurpleAir](REGISTRO_PURPLEAIR.md) y [alta AE-04](../ALTA_AE04_20261112.md):
- Institución: Esc. Agraria C.M. Casares (EAS Del Valle), según plan_despliegue.docx.
- Código AE-04; PurpleAir PA-II-FLEX; sensor index 298873.
- Device ID f0:24:f9:c2:ee:ac.
- Alta PurpleAir 12/11/2026.
- Coordenadas declaradas -35.86807451954287, -60.73151263154378.

AE-04 sigue en pruebas, sin montaje escolar. No se completa una fecha concreta de instalación. Se conserva el formato de fecha de la plantilla: vacío en color y espacios con año 2026 en impresión. El alta PurpleAir figura solo en Observaciones.

## Validación

Dos PDF de una página y diez campos editables cada uno. Se comprueban campos canónicos y diez widgets, valores coincidentes, apariencias presentes y ausencia de bandera de solo lectura. Prueba de rellenado, guardado y reapertura de los veinte campos: PASS; incluye fecha y observaciones de dos líneas. Copias sintéticas de prueba excluidas del PR.

La secuencia gráfica de cada página es idéntica byte a byte a la plantilla; solo cambian las apariencias de los campos identificatorios y los metadatos. Se renderizan ambas páginas y una muestra rellenada con Poppler, y se inspeccionan sin recortes ni superposiciones de los datos nuevos. Nombre institucional, códigos, índice, Device ID, fecha de alta y todos los decimales son legibles. No se realizó impresión física.

Los ocho PDF locales existentes no se modifican; se verificó que coinciden con main. El diff final del PR conserva sus blobs originales. No se modifican código, D1, secretos, ingestas, configuración ni producción. Commits con [CF-Pages-Skip], sin fusión ni despliegue. El entorno Cloud existente no está disponible; se preparan documentos localmente y se actualiza la rama mediante GitHub.

## Tabla histórica conservada

La tabla AQI forma parte del contenido anterior que el titular pidió conservar. Sigue siendo **histórica**, como ya advierte el índice; esta adaptación no la valida ni la presenta como vigente. La [tabla EPA/AQS actual](https://aqs.epa.gov/aqsweb/documents/codetables/aqi_breakpoints.html), comprobada durante esta tarea, usa otros intervalos desde 2024. Tampoco se presenta la orientación escolar heredada como un protocolo EPA. No se altera la tabla en esta adaptación para mantener el contenido solicitado.

Reversión: descartar la rama del PR; las guías anteriores quedan intactas. Antes de actualizar una copia ya completada por una escuela, conservar sus valores locales.
