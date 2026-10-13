# AQ-01 — Corrección del indicador PM2.5 en escala EPA

Inicio: 12 de octubre de 2026. Verificación de fuente oficial: 13 de octubre de 2026, Argentina. Rama: `fix/aq-01-epa-pm25`.
Base remota verificada: `7e0de1ad3c4f1547fd99d548049ded96e88e31f2` (main, auditoría PR #9).
Referencia anterior: `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`.

## Alcance y estado

Corrección propuesta para AQ-01 exclusivamente. Este documento registra la preparación del commit y sus pruebas; la publicación se registra en la descripción de la PR. Fuente oficial comprobada. Sin despliegue. No se marca AQ-01 implementado/verificado en producción.

Main agrega 20 archivos y 1610 líneas respecto de la referencia; son diagnóstico, pruebas y documentación. La comparación específica de Worker, D1, index.html, Python de ingesta y workflow de ingesta quedó sin diferencias antes de editar. Se leyeron AGENTS.md, README.md, auditoría, plan, Worker, D1/migraciones, workflows y scripts. Los workflows versionados solo tienen schedule/workflow_dispatch, sin push/pull_request ni despliegue.

## Fuente oficial comprobada

Referencia oficial solicitada: EPA/AirNow, Technical Assistance Document for the Reporting of Daily Air Quality, mayo 2026, tabla 6 y sección IV:
https://document.airnow.gov/technical-assistance-document-for-the-reporting-of-daily-air-quailty.pdf

El 13 de octubre, después de publicarse la política de red del entorno, se descargó la guía oficial mediante HTTPS con validación TLS. Se verificaron portada EPA-403/B-26-003, mayo 2026; sección IV (página impresa 13), tabla 6 y nota 4 (página impresa 14), y explicación de extrapolación >500. SHA-256 del PDF: `b69de26a0f3d4603572595fc8b49be8fd157fd0faaaab023410bb13b4b6e5e0c`. El PDF se mantiene únicamente en /tmp, no se añade a sources/ ni al repositorio.

| PM2.5 µg/m³, truncado a décima | Índice |
| --- | --- |
| 0.0–9.0 | 0–50 |
| 9.1–35.4 | 51–100 |
| 35.5–55.4 | 101–150 |
| 55.5–125.4 | 151–200 |
| 125.5–225.4 | 201–300 |
| 225.5–325.4 | 301–500 |

Se trunca la concentración a una décima; se interpola entre extremos del tramo y se redondea el índice al entero más próximo. La representación decimal evita errores binarios al truncar valores ya expresados en décimas. Casos: 12.05 →12.0 →56; 35.45 →35.4 →100; 9.0 →50; 325.4 →500.

Por encima de 325.4 truncados se extrapola con la pendiente del tramo 301–500, conforme a la nota 4 de la tabla 6 y la explicación oficial. Se redondea el índice después de extrapolar: 325.5 →500; 325.6 →500; 325.7 →501; 400 →649. La presentación muestra `>500` solo cuando el índice redondeado excede 500, con categoría peligrosa y aguja saturada. No se inventa un valor tope numérico en el cálculo. Un resultado que desborda Number y no es representable devuelve null/presentación neutra. La fórmula divide antes de multiplicar para evitar overflow intermedio evitable.

Solo se aceptan números finitos no negativos. Null, undefined, negativos, NaN, infinitos, texto, booleanos y objetos producen null y presentación neutra con raya. No se convierten faltantes a cero. La concentración cero sí produce índice cero.

## Presentación y consumidores

Una tabla compartida gobierna conversión e inversa. La inversa acepta índices enteros 0–500; fuera de rango/invalidación devuelve null. Es aproximada para dibujar límites: truncamiento y redondeo impiden reconstruir una muestra original. No es una transformación aplicada a datos D1.

Seis categorías: buena, moderada, grupos sensibles, no saludable, muy no saludable y peligrosa. Se conserva la paleta legible lemeit para las primeras cuatro y se añaden púrpura/granate para las dos superiores; los colores no son una promesa de reproducción exacta de los RGB de EPA. Cards, gauge, mapa, popup, etiquetas, leyenda y bandas del gráfico comparten clasificación. Invalidaciones del indicador se muestran neutras; el gráfico extiende el color peligroso más allá de la última frontera. No se modifica el tratamiento temporal/frescura de AQ-09.

Aviso visible y ayuda en español/inglés: indicador derivado de una muestra PM2.5; **no es AQI diario ni NowCast**. El período efectivo de la muestra no está verificado. No se atribuye promedio horario/diario ni variante/calibración de proveedor. No se calcula índice multipolutante ni se altera la medición almacenada/exportada.

## Archivos

- `index.html`: cálculo, inversa, categorías, gauge, bandas, formato neutral y aclaraciones bilingües.
- `tests/data-integrity.audit.test.mjs`: dos reproducciones AQ-01 convertidas en aceptación; control fuente→SQLite→API actualizado para esperar 56; demás reproducciones intactas.
- `tests/aq-01.acceptance.test.mjs`: aceptación ampliada sobre funciones reales extraídas en VM.
- Este documento y dos registros TAP actuales.

## Pruebas offline

Node 24.19.0, Python 3.12.14. Fixtures sintéticos, SQLite en memoria; no peticiones a API pública, proveedores o CARTO.

| Comando | Resultado |
| --- | --- |
| `node --test-reporter=tap tests/aq-01.acceptance.test.mjs` | 12/12 PASS; AQ01_ACEPTACION.tap |
| `node --test-reporter=tap tests/data-integrity.audit.test.mjs` | 28/28 PASS; AQ01_INTEGRIDAD.tap |
| `python -B tests/data-integrity-python.audit.py` | PASS de reproducciones/controles pendientes de Python |
| `node tests/healthcheck.test.mjs` | 47/47 PASS, incluye suites importadas de fases 2B/2C |
| `node --input-type=module --check < worker/src/index.js` y `node --check sw.js` | PASS |
| `node --check` por stdin sobre cada script inline de index.html | PASS |
| `git diff --check` | PASS |

Aceptación específica cubre extremos de todos los tramos, huecos originales, truncamiento, interpolación/redondeo, inválidos, 325.49/325.5/325.6/325.7, extrapolación y extremos enormes, todas las 3255 décimas 0–325.4, inversa de los 501 índices, categorías/colores, gauge neutro, cards/etiquetas/leyenda y bandas del gráfico. Los PASS de otros IDs siguen siendo reproducciones de defectos o controles, no correcciones. Los TAP históricos de la auditoría se preservan.

El runner con aislamiento por proceso del entorno solo mostró una prueba contenedora; se ejecutaron directamente los módulos con reporter TAP para confirmar los 12 y 28 casos reales, completados sin fallos ni SKIP. No se usó un resultado de cero pruebas como evidencia.

Limitaciones: VM y SQLite local, sin binding D1 real, precisión/calibración del hardware ni reconciliación de lecturas productivas. No se afirma validación visual completa de Chart.js/Leaflet en un navegador; las funciones reales de renderizado se prueban con DOM/estilos mínimos en memoria. No se ejecutó healthcheck público.

## Condiciones de publicación

Git HTTPS mediante proxy permite lectura y fetch de main. API GitHub accesible tras publicar política el 13 de octubre: repo y permisos, PR #9 fusionada, main remoto sin cambios y check Cloudflare Pages success. La lectura de webhooks devuelve 403 “Resource not accessible by integration”: es una limitación de permiso del conector, distinta del bloqueo de red anterior. GitHub Pages devuelve 404; la lista de deployments GitHub está vacía, lo que por sí solo no prueba ausencia de deploys Cloudflare.

Se inspeccionó el PDF de configuración Pages aportado por el usuario: proyecto purpleair-saladillo, exclusiones exactas de cuatro ramas healthcheck, inclusión `*`; no aparece `fix/aq-01-epa-pm25`. Los controles seleccionados no se distinguen con certeza en el PDF y el formulario no acredita por sí solo un guardado posterior. No se infiere que previews estén deshabilitados. Se pidió añadir y guardar la exclusión exacta, conservando ajustes existentes; no se cambió configuración desde esta tarea.

El 13 de octubre el usuario confirmó expresamente que añadió, guardó y reabrió la exclusión exacta `fix/aq-01-epa-pm25`, conservando las demás. Esta es evidencia aportada por el titular, no una lectura API Cloudflare. Con esa confirmación se autoriza publicar la rama y la PR; sin ella no se habría realizado push para evitar un preview no autorizado. No confiar en skip build como garantía ni reutilizar una rama histórica excluida. No hay credenciales Cloudflare en el entorno ni se solicitan valores por chat. La restricción de publicación es del alcance explícito del usuario: no despliegues ni previews automáticos.

## Reversión

Antes de merge, descartar la PR/rama no afecta producción. Si una autorización futura permite integrar, revertir únicamente el commit AQ-01 mediante una PR separada, revisar su diff y ejecutar estas pruebas y las reproducciones restantes. No hay datos ni esquema que restaurar. Main tiene despliegue automático de Pages según documentación: fusionar o revertir en main requiere autorización independiente porque puede desplegar. Esta tarea no autoriza merge ni despliegue.
