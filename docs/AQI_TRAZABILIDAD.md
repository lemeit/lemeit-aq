# Trazabilidad del indicador PM2.5 visible (AQI)

> Decisión posterior del titular: [una sola forma circular y colores AQI](CIRCULOS_AQI_MAPA.md)
> sustituye las seis geometrías/acento único de #23, ya fusionado en 934f635.
> Las referencias siguientes a formas o PR pendiente son evidencia histórica,
> no la decisión visual vigente. Frescura #22, orden #21 y cálculo intactos.
> El titular autorizó merge/despliegue de la corrección circular; las restricciones
> operativas anteriores se conservan como registro de sus respectivas tareas.

> Propuesta de presentación del mapa (30/10/2026): [marcadores compactos](MARCADORES_MAPA.md)
> renombra el selector a AQI · EPA y usa seis formas con un único acento,
> conservando fórmula y categorías de este informe. La frescura de #22 ya está
> fusionada en d76c687; el nuevo cambio aún no lo está. La denominación AQI no
> acredita promedio diario ni NowCast.

> Seguimiento AQ-09 (30/10/2026): la sección temporal de este informe describe la base histórica de #17. En la rama de [frescura](FRESCURA_SENSORES.md), `toBsAs` valida calendario y admite UTC/offsets; fechas inválidas/futuras y >25 min se neutralizan en mapa, popup y tarjetas, incluso sin red. La fórmula AQI permanece intacta. Pendiente de merge/despliegue; normalización y MAX textual del backend siguen pendientes.

Revisión: 13 de octubre de 2026, Argentina. Base exacta de main:
`2b5d44b990ca573ac8251a48be87983579fccec1`.
Referencia auditada: `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`.
Este informe verifica código versionado y pruebas offline; no acredita la
versión desplegada, el esquema D1 productivo ni metrología del proveedor.

## Recorrido de la concentración

| Etapa | Archivo y función | Comportamiento comprobado |
| --- | --- | --- |
| PurpleAir/Worker | [worker/src/index.js](../worker/src/index.js), `fetchPurpleAirData`, `insertLectura` | Solicita `/v1/sensors`; `getField(..., "pm2.5")` se vincula directamente a `lecturas.pm2_5`. También guarda campos de 10/60 minutos y A/B por separado. |
| PurpleAir/Python | [ingest_purpleair.py](../ingest_purpleair.py), `fetch_purpleair_data`, `insert_lectura` | Mismo mapeo `pm2.5 → pm2_5`, mediante parámetros SQL. No calcula el indicador. |
| AirGradient/Worker | [worker/src/index.js](../worker/src/index.js), `fetchAirGradientData`, `insertAirGradientLectura` | Consulta `/public/api/v1/locations/measures/current`; `loc.pm02 ?? null → pm2_5`. No selecciona una variante compensada de PM. `atmpCompensated` y `rhumCompensated` solo afectan temperatura y humedad. |
| Persistencia | [d1/schema.sql](../d1/schema.sql) | `pm2_5 REAL`, sin columna AQI. `INSERT OR IGNORE` y UNIQUE(sensor_index,timestamp): repetir el mismo timestamp conserva la primera fila, no sustituye su PM. |
| Última lectura | [d1/schema.sql](../d1/schema.sql), `v_ultima_lectura`; [migración 006](../d1/migration_006_optimizar_vista_ultima_lectura.sql) | JOIN con `MAX(timestamp)` agrupado por sensor. No usa `creado_en`, promedios ni ventana de 24 horas. |
| API | [worker/src/index.js](../worker/src/index.js), `fetch`, ruta `/api/ultimas` | `SELECT l.*` más metadata del sensor; `json(results)` o CSV. No calcula, corrige ni redondea PM/AQI. Esta ruta todavía no filtra `s.activo = 1` (AQ-04). |
| Navegador | [index.html](../index.html), `loadSensors`, `buildSensorCardInner` | Consulta `${API_BASE}/api/ultimas`, conserva el array en `latestSensors` y calcula `pm25ToAqi(s.pm2_5)` para las tarjetas. `API_BASE` es `https://api.lemeit.ar/aq`. |

La unidad que asume la aplicación para PM2.5 es µg/m³; el índice derivado no
tiene unidad física. No hay conversión de unidad de PM, corrección EPA por
humedad, calibración local ni recomputación del promedio A/B en estos caminos.
Esto no certifica qué procesamiento aplica el fabricante antes de entregar
`pm2.5` o `pm02`. Fahrenheit→Celsius solo transforma temperatura.

## Fórmula exacta en el frontend

`index.html`: `PM25_AQI_BREAKPOINTS` y `pm25ToAqi(pm)`:

1. Rechaza valores que no sean números finitos no negativos: devuelve `null`.
   Texto numérico, booleanos y faltantes no se convierten a cero. Cero es válido.
2. Para `pm < 0.1`, devuelve 0. Para `0.1 ≤ pm < 1e21`, toma la parte entera
   y la primera cifra decimal de `String(pm)`: trunca, no redondea PM.
   Para `pm ≥ 1e21` conserva el Number disponible, que no conserva décimas.
3. Busca el tramo que contiene C; por encima del último extremo usa el último
   tramo y extrapola. Calcula:

   `Math.round(Ilo + ((C - Clo) / (Chi - Clo)) * (Ihi - Ilo))`

4. Si el resultado no es finito, devuelve `null`.

| Clo–Chi (µg/m³) | Ilo–Ihi | Categoría |
| --- | --- | --- |
| 0.0–9.0 | 0–50 | Buena |
| 9.1–35.4 | 51–100 | Moderada |
| 35.5–55.4 | 101–150 | Grupos sensibles |
| 55.5–125.4 | 151–200 | No saludable |
| 125.5–225.4 | 201–300 | Muy no saludable |
| 225.5–325.4 | 301–500 | Peligrosa |

Referencia de los tramos, truncamiento, interpolación y redondeo:
[EPA/AirNow, TAD mayo 2026, sección IV, tabla 6 y nota 4](https://document.airnow.gov/technical-assistance-document-for-the-reporting-of-daily-air-quailty.pdf),
páginas impresas 13–16. La guía define el AQI diario de PM con concentración
de 24 horas y un método NowCast separado. Aplicar su escala numérica a una
sola fila no acredita ninguno de esos métodos temporales.

Ejemplos del código: `12.05 → 12.0 → 56`, `35.45 → 35.4 → 100`,
`9.0 → 50`, `325.4 → 500`, `325.5 → 500`, `325.7 → 501`, `400 → 649`.
`Math.round` redondea al entero más próximo (empates positivos hacia arriba).
`formatAqi` muestra `>500` solo si el resultado redondeado excede 500;
`aqiInfo` mantiene categoría peligrosa y `aqiGaugeNeedleAngle` satura en 500.
No se limita a 500 el cálculo numérico. `formatPm25` muestra la concentración
recibida, sin reemplazarla por la concentración truncada del cálculo.

## Consumidores y período temporal

Tarjetas de Actuales y Mapa comparten `buildSensorCardInner`. El popup de
`cargarMapa`, `MAPA_PARAMS.aqi.get` y el color de las capas AQI/PM2.5 reutilizan
`pm25ToAqi`. `aqiInfo` usa `AQI_CATEGORIES`. El gráfico mantiene concentraciones
históricas; `aqiBandsPlugin` usa `pm25FromAqi` para dibujar bandas de referencia.
Esa inversa es aproximada y no reconstruye mediciones ni modifica D1.

No se consumen `pm2_5_10min`/`pm2_5_60min` para el indicador, no se calcula
promedio diario ni ponderación NowCast, ni índice máximo entre contaminantes.
24h/7d/30d son filtros de `/api/historico/:index`, no períodos de integración
del indicador. El cron configurado cada 15 minutos y el refresco del dashboard
cada 5 minutos tampoco definen el período físico de una muestra. El código
no guarda metadatos que acrediten la duración de integración de `pm2.5`/`pm02`.
No se etiqueta como medición instantánea, promedio horario o promedio diario.

La frase pública «Este valor refleja la última medición del sensor. No representa
el promedio del día.» se refiere a la última lectura **disponible en el sistema**,
seleccionada por la vista. No promete que coincida con la última existente en
el proveedor ni que esté fresca. La ayuda explica que el navegador deriva el
indicador a partir de PM2.5. El aviso se conserva solo en el bloque general,
sin agregar párrafos a las tarjetas. ES/EN usan el mecanismo existente.

## Timestamp y frescura: garantías y límites

- PurpleAir: `last_seen` se convierte con `datetime(?, 'unixepoch')` a texto UTC
  en Worker y Python. No usa hora de descarga ni `creado_en` para el indicador.
- AirGradient: `insertAirGradientLectura` reemplaza T por espacio y retira Z
  y fracciones con sufijo Z. No normaliza offsets ni valida fechas. Un timestamp
  ausente evita insertar esa lectura. Un texto inválido puede persistirse y
  ganar el MAX textual. MAX corresponde al orden temporal solo con fechas
  válidas, comparables y normalizadas; no se afirma esa garantía para toda fila.
- UI: `toBsAs` sustituye espacio por T y añade Z; `formatBsAsFull` muestra
  `America/Argentina/Buenos_Aires`. Un offset ya presente puede producir una
  fecha inválida; no se corrige en esta PR.
- `isStale` usa diferencia con `Date.now()` y umbral estricto >25 minutos.
  Las tarjetas antiguas muestran badge Sin datos y gauge sin valor atenuado.
  El mapa todavía puede colorear lecturas antiguas; una fecha futura se considera
  fresca y un fallo de red no envejece automáticamente las tarjetas (AQ-09).

## Comparación con la auditoría y PR previas

Main base está 17 commits por delante, sin commits por detrás: 36 archivos,
3059 líneas añadidas y 78 eliminadas. Consulta GitHub: ningún PR abierto al
iniciar esta revisión. PR relacionadas ya fusionadas:

- [#10](https://github.com/lemeit/lemeit-aq/pull/10): corrige AQ-01. En el commit
  auditado, `pm25ToAqi` tenía cinco tramos (0–12, 12.1–35.4, 35.5–55.4,
  55.5–150.4, 150.5–250.4), sin truncamiento y con retorno 300 fuera de tramo.
  Main usa los seis tramos actuales, validación y extrapolación descritos arriba.
- [#13](https://github.com/lemeit/lemeit-aq/pull/13): restaura `formatPm25` en JS.
- [#14](https://github.com/lemeit/lemeit-aq/pull/14) y
  [#16](https://github.com/lemeit/lemeit-aq/pull/16): aclaración de última medición;
  #16 la ubica en el aviso general, pero conserva el texto extenso que se retira
  en esta propuesta. [#11](https://github.com/lemeit/lemeit-aq/pull/11) corresponde
  a identidad AirGradient, no al cálculo del indicador.

Frente al auditado, Python y el mapeo PM/timestamp, vista de última lectura y
consulta `/api/ultimas` mantienen su lógica; los cambios del Worker corresponden
a AQ-02. Integración en main no acredita despliegue ni aplicación de migraciones.

## Aceptación, validación y reversión

Defecto reproducido: main contiene el aviso extenso y README no explica dónde
se calcula el indicador. Criterios: recorrido y fórmula contrastados con código,
tabla oficial, ejemplos reproducibles, enlaces relativos existentes, aviso breve
ES/EN sin texto técnico retirado y cálculo/API/ingesta sin modificaciones.

Validación local con Node 24.18.0 y Python 3.11.9:

- `node tests/aq-01.acceptance.test.mjs`: 12/12 PASS.
- `node tests/data-integrity.audit.test.mjs`: 35/35 PASS, HTTP real bloqueado.
- `node scripts/test-dashboard-format-pm25.cjs`: PASS; verifica sintaxis inline,
  formato y usos de la concentración en mapa/tarjetas.
- `node --check worker/src/index.js`, `node --check sw.js`: PASS.
- Compilación sintáctica de `scripts/test-dashboard-latest-measurement.py`: PASS.
- 13 enlaces relativos de README, este informe y el registro histórico: existen.
  La fuente oficial externa EPA/AirNow fue abierta y contrastada con el cálculo.
- `git diff --check`: PASS. Diff de Worker/D1/ingesta/workflows: vacío.

Los PASS de reproducciones de otros hallazgos no acreditan su corrección.
El smoke Python se actualizó a esta base y texto, pero no se ejecutó: Playwright
no está instalado en este entorno Windows y el script requiere Chromium en
`/usr/bin/chromium`. No se afirma validación visual completa en navegador.

Se trabajó en un checkout local aislado: esta sesión no ofrece ejecución directa
en el entorno Codex Cloud existente. No se ejecutan ingestas reales, consultas
a API productiva/proveedores, migraciones ni despliegues. Publicar exige impedir
el preview automático de Pages para esta rama; main conserva deploy automático.
Con autorización explícita del titular, se agregó únicamente
`docs/aqi-origen-y-aclaracion` a `preview_branch_excludes` del proyecto Pages
`purpleair-saladillo`. La API Cloudflare confirmó el guardado y la conservación
de todos los demás campos de configuración de origen, incluidas las exclusiones
previas y el despliegue automático de main. El commit productivo canónico al
verificar seguía en la base `2b5d44b`. La publicación y su comprobación posterior
se registran en la descripción de la PR; esta tarea no autoriza merge.
Antes de merge, descartar la rama revierte la propuesta. Una reversión posterior
requiere otra PR autorizada; no hay datos ni esquema que restaurar.
