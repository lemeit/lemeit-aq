# Instalación de sensores Aire Escolar

## Guías originales AE-02

Documentos aportados por el titular el 28/10/2026, conservados byte por byte:

- [Mini Guía de Instalación - Sensor Aire Escolar AE-02 (impresión)](Mini%20Gu%C3%ADa%20de%20Instalaci%C3%B3n%20-%20Sensor%20Aire%20Escolar%20AE-02.pdf).
- [Mini Guía de Instalación (Digital Color) - Sensor Aire Escolar AE-02](Mini%20Gu%C3%ADa%20de%20Instalaci%C3%B3n%20%28Digital%20Color%29%20-%20Sensor%20Aire%20Escolar%20AE-02.pdf).

Ambos tienen una página A4, texto extraíble y ficha para completar en papel.
Los originales no contienen campos de formulario interactivos.

Son material histórico: la tabla AQI de estos PDF utiliza el primer tramo
PM2.5 de 0–12, diferente del cálculo documentado actualmente en
[trazabilidad del AQI](../AQI_TRAZABILIDAD.md). Se preservan sin corregir su
contenido; su incorporación no valida como actuales la escala ni las
indicaciones escolares del documento.

## Guías editables AE-01 - Escuela Lola Mora

Copias del diseño original con ocho campos de formulario editables:

- [AE-01 - Escuela Lola Mora - Digital Color](Mini%20Guia%20AE-01%20-%20Escuela%20Lola%20Mora%20-%20Digital%20Color%20-%20editable.pdf).
- [AE-01 - Escuela Lola Mora - Impresión](Mini%20Guia%20AE-01%20-%20Escuela%20Lola%20Mora%20-%20Impresion%20-%20editable.pdf).

Precargadas con Escuela Lola Mora, 25 de Mayo, AE-01, modelo PurpleAir
PA-II-FLEX, Sensor index 298687 y Device ID `ec:64:c9:cb:9f:3`, según lo
informado por el titular. Confirmar Device ID con la etiqueta. La fecha
28/10/2026 corresponde a la instalación prevista y es editable; no acredita
una instalación o conexión verificadas. Referente, teléfono, red y ubicación
quedan vacíos. Estas copias conservan la tabla AQI histórica advertida arriba.
No subir versiones completadas con contactos o datos privados sin revisión.

Verificaciones: ocho campos canónicos y ocho widgets con apariencias válidas
en cada PDF; valores precargados comprobados, renderizado de ambas páginas y
revisión visual. Copias locales idénticas a las entregadas al titular:

| Versión AE-01 | SHA-256 |
| --- | --- |
| Digital Color | `23b73edbd2bbcbeacc0255418106bd4b0e285c8151c4932413b7d3b74e7c65c8` |
| Impresión | `2e6c8d3b05a18f167ced4b179a2d9f073643c7a920650b9f66172e80b113a36c` |

## Integridad y aceptación

Problema reproducido: las dos guías no estaban versionadas ni enlazadas desde
el README de main `1e426885a643629938a78b8f66fbe10b517010be`.
Esta base está 18 commits por delante y ninguno por detrás de la referencia
auditada `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`.

| Documento | Bytes | SHA-256 |
| --- | ---: | --- |
| Impresión | 192335 | `26330e5ddf4bf648c19a6606cf65200b2a599a34e2b017b3a2d01ae3e6f88972` |
| Digital Color | 292053 | `9ea6313b67a1e6e287a0de61872a953b6092adb83ff6034d8e5b435d14432ea5` |

Criterios y comprobaciones: igualdad binaria con los adjuntos, apertura con
pypdf, extracción de texto, renderizado de ambas páginas y revisión visual,
resolución de enlaces relativos y diff limitado a documentación. Los PDF
originales no se regeneran, comprimen ni modifican.

No se ejecutan ingestas, migraciones ni despliegues. El trabajo se prepara
localmente porque esta sesión no ofrece ejecución directa en el entorno
Codex Cloud existente. El commit de respaldo utiliza el prefijo
`[CF-Pages-Skip]` para omitir su despliegue automático, según la
[documentación de Pages](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/#skipping-a-build-via-a-commit-message).
No se modifican la configuración de Pages ni sus disparadores.
Descartar la rama revierte esta propuesta;
no hay cambios de datos o esquema.
