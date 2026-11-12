# Denominación de la red

La denominación acordada por el titular es **Red de Monitoreo Ambiental**, sin nombre de localidad. El proyecto incluye instituciones de Saladillo y del partido de 25 de Mayo. Se conservan los nombres propios de instituciones, direcciones, coordenadas, topónimos y antecedentes históricos.

## Corrección documental del 12/11/2026

Base verificada: main `d297588edec359c7aba7a6adad9be0450c4c040e`, 42 commits adelante y 0 detrás de la auditoría `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`. Se releen AGENTS.md, README y los índices actuales. PR #34 ya fusionado: esta revisión va en una rama y un PR nuevos.

Se sustituyen diez PDF: AE-00, AE-01, AE-02, AE-03 y AE-04, cada uno en Digital Color e Impresion. Las dos franjas de identificación se reemplazan por:
- Cabecera: Red de Monitoreo Ambiental · app.lemeit.ar/aq.
- Pie: Red de Monitoreo Ambiental - lemeit.ar.

Se retira el texto anterior de los contenidos PDF, incluidas las capas ocultas debajo de los recubrimientos antiguos. No se limita a cubrirlo visualmente. Se mantienen el diseño elegido, tabla histórica, instrucciones técnicas, identificadores, Device ID, coordenadas, fechas y los diez campos editables por PDF. Esta revisión sustituye la condición de integridad absoluta de los PDF indicada en la verificación inicial de AE-04: ahora se autoriza modificar únicamente esas dos franjas.

## Búsqueda en documentación

Se revisan todos los Markdown y HTML actuales del repositorio, las dos presentaciones PPTX, los dos DOCX de docs/ y los diez PDF. No aparecen otras coincidencias de la denominación local anterior en el texto o contenido XML de esos documentos; las coincidencias se concentran en cabeceras y pies de las guías. No se modifican imágenes, nombres de archivos, rutas de la wiki ni referencias geográficas legítimas.

README e índices fijan la denominación general. No se renombran rutas ni archivos; todos los enlaces previos a los PDF siguen sirviendo. El alcance de la búsqueda es lemeit/lemeit-aq, no otros proyectos ambientales del titular.

## Pruebas

- Diez PDF de una página, cien campos canónicos y cien widgets; valores idénticos a las fuentes, apariencias presentes y campos editables.
- Prueba de completar, guardar y reabrir los cien campos: PASS. Incluye código, fecha y observaciones multilínea; copias sintéticas excluidas del PR.
- Extracción del contenido final: dos apariciones de la denominación acordada por PDF y ninguna de la denominación local anterior.
- Comparación de imágenes antes/después con el mismo motor: cero píxeles diferentes fuera de las franjas de cabecera y pie.
- Renderizado Poppler de los diez documentos y una copia rellenada; inspección de las veinte franjas y una página completa sin recortes ni superposiciones.
- Comprobación de datos y hashes antes de sustituir las copias de la carpeta local. Si una copia contiene cambios ajenos, se detiene su reemplazo para no perderlos.

Límite: sin impresión física. La tabla AQI histórica permanece sin modificaciones, por la decisión anterior de conservar el contenido de las guías; la advertencia del índice sigue vigente.

Solo documentación: sin cambios de código, ingestas, D1, secretos ni producción. Sin cambios de consumo ni frecuencia. Commit [CF-Pages-Skip], PR sin fusión ni despliegue. El entorno Cloud existente no está expuesto; comprobación local y GitHub por conector. Reversión de la propuesta: descartar el PR; las fuentes anteriores quedan en Git y en la copia de trabajo de verificación.
