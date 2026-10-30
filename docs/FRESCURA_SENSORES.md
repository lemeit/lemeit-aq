# AQ-09 — Frescura de sensores

## Base y alcance

Revisión 30/10/2026 en el entorno Codex Cloud existente. GitHub confirmó main
`dc951eca4e509d1898e95f3e9578ab09160ca19b`, coincidente con HEAD local. Comparación
con la auditoría `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`: 20 commits adelante,
0 detrás; 42 archivos, 3539 adiciones y 84 eliminaciones. Esto no acredita el
cierre de los demás hallazgos ni el estado productivo del Worker/D1.

Se leyeron AGENTS, README, auditorías, plan, inventario, orden de tarjetas,
Worker, esquema/migraciones, workflows y scripts pertinentes. GitHub confirmó
#21 fusionado en main; #17 y #19 también están integrados en el historial local
contrastado. El único PR abierto encontrado fue #20 (guías/documentación de
instalación). Búsqueda adicional de frescura: sin PR equivalente. No había
cambios locales pendientes ni rama de frescura previa. Rama independiente:
`fix/aq09-frescura-sensores`.

## Regla y aceptación

- Una lectura con edad válida **0 a 25 minutos inclusive** conserva su color
  AQI. Se conserva la convención `> 25` vigente, sin modificar cálculo ni
  umbrales sanitarios.
- Al superar 25 minutos: marcador gris `#808080`, leyenda y etiqueta «Sin datos
  recientes». El popup muestra ese estado y la fecha de última medición (año
  incluido, zona Argentina), sin presentar el AQI antiguo como actual.
- La tarjeta permanece en ambas vistas, con mediciones atenuadas y borde
  discontinuo; estado y última actualización permanecen legibles. El gauge no
  muestra el índice antiguo. Los valores históricos conservados se presentan
  bajo la advertencia de falta de datos recientes.
- Fechas ausentes, ilegibles, calendarios imposibles y futuras se consideran
  sin datos recientes. Si la fecha no es interpretable se muestra «Fecha no
  disponible». D1 sin zona se interpreta UTC; ISO con Z u offset se interpreta
  respetando la zona. No se normaliza ni escribe ningún timestamp almacenado.
- Un reloj local cada segundo reevalúa las dos vistas incluso ante error HTTP,
  payload inválido, caída de red o solicitud pendiente. También reevalúa al
  volver a una pestaña/documento (`visibilitychange`/`pageshow`). Solo cambia
  frentes cuyo estado cambia; actualiza marcadores, etiquetas y popups sobre
  las mismas capas, sin descargar mosaicos ni consultas API adicionales. Se
  conservan selección, orden, dorso y gráficos al envejecer localmente.
- Al recibir una lectura nueva válida reciente, vuelve automáticamente el color
  y desaparece la atenuación. Los errores de red conservan el último conjunto
  recibido y el punto de conexión API indica el fallo; los contadores describen
  frescura de las lecturas, sin diagnosticar el estado físico del equipo.
- Falta de señal puede deberse al equipo apagado, internet o proveedor/API. No
  equivale a baja administrativa. Una baja requiere decisión explícita futura.
- Se conserva exactamente el orden de #21: AE numérico por nombre/código,
  luego sin AE (AirGradient/otros) y PurpleAir confirmado. Los AE actuales son
  PurpleAir según inventario; no se cambian sus proveedores para hacerlos
  coincidir con una descripción verbal. Sin cambios en identidad, `activo`, D1,
  historial, ingesta o contrato API. No se ocultan sensores por antigüedad.

## Reproducción y pruebas

`python scripts/test-dashboard-freshness.py` carga primero el HTML exacto de
main citado: demuestra marcador coloreado con lectura antigua y tarjeta que
mantiene estado reciente tras avanzar el reloj y fallar la red. Después carga
el HTML modificado y comprueba la corrección. Todas las solicitudes se
interceptan; solo documento y API sintética se responden, externos abortados,
service workers bloqueados. No se navega producción ni se consulta su API:
los GET públicos registran visitas en D1.

Resultados ejecutados en Node 24.19.0, Python/Playwright y Chromium local:

- `node --test tests/*.test.mjs`: siete archivos PASS, cero fallos.
- `node tests/freshness.test.mjs`: 4 PASS; borde 25 min ±1 ms, futuro ±1 ms,
  NULL/inválidos/calendario, UTC/offsets, capas AQI/PM/CO2/NOx/VOC/temperatura y
  exclusión de lecturas antiguas del dominio relativo.
- `node tests/data-integrity.audit.test.mjs`: 35 PASS. Se actualizaron los
  controles AQ-09; los otros PASS siguen incluyendo reproducciones de defectos
  pendientes, no cierres de auditoría.
- `python scripts/test-dashboard-freshness.py`: PASS; HTML real, dos vistas,
  avance de tiempo sin fetch, red/HTTP/payload fallidos, solicitud pendiente,
  recuperación, timestamp nulo/inválido/futuro, selección, orden, identidad de
  capas/dorsos, leyenda no duplicada, ES/EN, temas claro/oscuro y 390/1440 px.
- `python scripts/test-dashboard-card-order.py` y
  `python scripts/test-dashboard-latest-measurement.py`: PASS.
- `node scripts/test-dashboard-format-pm25.cjs`: PASS, incluida compilación de
  scripts inline; sintaxis Worker/SW y `git diff --check`: PASS.
- `python tests/data-integrity-python.audit.py`: PASS sin HTTP.
- `node scripts/healthcheck.mjs --offline --output work/freshness-healthcheck.json`:
  0 FAIL, 16 SKIP, WARN únicamente Node 24 frente a 22 recomendado.

Chromium requirió ejecución fuera del sandbox de procesos; las solicitudes
continuaron interceptadas. Las expectativas anteriores «Sin datos»/«No data»
y seis muestras de leyenda se actualizaron al texto nuevo y siete muestras
(seis categorías AQI y una de frescura).

## Publicación autorizada sin despliegue

El bloqueo inicial del 30/10/2026 era real: Pages tenía previews custom con
inclusión `*` y ocho ramas excluidas, sin esta rama. No se publicó mientras
existía ese bloqueo. Posteriormente el titular autorizó explícitamente publicar
el PR, actualizar la documentación y excluir **únicamente**
`fix/aq09-frescura-sensores`; aclaró «lo hago yo el merge entonces».

Con esa autorización se leyó nuevamente el proyecto `purpleair-saladillo` y se
aplicó PATCH solo para agregar esa rama a `source.config.preview_branch_excludes`.
GET posterior confirmó `exclusionVerified=true`, `sourceVerified=true` (todos
los otros campos de source idénticos, incluidas ocho exclusiones anteriores),
`canonicalUnchanged=true` y `latestUnchanged=true`. Se mantienen GitHub
`lemeit/lemeit-aq`, `production_branch=main`,
`production_deployments_enabled=true`, `deployments_enabled=true`,
`preview_deployment_setting=custom`, `preview_branch_includes=["*"]`,
`path_includes=["*"]` y `path_excludes=[]`. Latest/canonical conservaron el ID
`b2fc7a1f-db1f-46cb-ab75-2c35d1568c46` y SHA main
`dc951eca4e509d1898e95f3e9578ab09160ca19b`.

La exclusión se verificó **antes** de publicar. Los workflows versionados no
tienen disparadores push/pull_request: healthcheck usa schedule/dispatch;
ingesta, dispatch con schedule comentado. No se ejecutó ninguno manualmente.
El proxy local sigue rechazando Git HTTPS; se usa el conector GitHub para
publicar árboles idénticos a los commits locales, con padres y contenido
verificados, sin cambiar red ni credenciales.

Estado: [PR #22 abierto](https://github.com/lemeit/lemeit-aq/pull/22) hacia
main; no fusionado ni desplegado. No se autoriza merge automático: el titular hará el merge.
Main conserva su despliegue automático; la exclusión protege solo esta rama,
no un futuro merge. No se abre el preview ni el dashboard productivo, cuyos GET
podrían escribir visitas. Sin ingestas reales, D1, migraciones ni secretos.

## Riesgos, límites y reversión

La frescura depende del reloj del navegador. El intervalo nominal es de 1 s:
puede haber hasta un ciclo de latencia en primer plano; navegadores suspendidos
no ejecutan JS y se reevalúan al volver. No es una garantía de ejecución en
segundo plano ni una comprobación física del sensor. La recuperación requiere
recibir una respuesta válida; se conserva la frecuencia API existente de 5 min.
Sin aumento de consumo de proveedores ni frecuencia de ingesta.

Leaflet se sustituye por un adaptador offline en las pruebas de mapa: se
verifican opciones de color, texto, popup y llamadas de actualización reales
del dashboard, pero no mosaicos, CDN, foco/teclado de Leaflet ni lector de
pantalla. La accesibilidad comprobada es básica (estado textual visible,
fecha accesible, sin depender solo del color y sin overflow), no auditoría WCAG.
No se midió producción ni se validó Node 22. API basada en última lectura puede
omitir sensores sin ninguna lectura; este PR no agrega filas que no entrega
la API. Se mantienen pendientes MAX(timestamp) textual, validación backend de
fechas y filtro administrativo de `/api/ultimas` (AQ-04).

Descartar la rama revierte la propuesta antes de fusionar. Una reversión futura
por PR no requiere restaurar datos; merge/reversión en main puede desplegar y
necesita autorización independiente.

## Revalidación antes de publicación

Con la autorización posterior se repitieron las siete suites Node y el smoke
Chromium offline de frescura: PASS, sin fallos. Sintaxis inline/formatPm25 y
`git diff --check`: PASS. Se comprobaron 49 enlaces relativos en los diez
Markdown añadidos/modificados, sin destinos inexistentes. Los tests funcionales
no cambiaron en esta ampliación documental. README y el nuevo índice técnico
resumen la regla; plan/roadmap, operación, trazabilidad y auditorías enlazan esta
propuesta. Se preservaron tablas, fechas, evidencia y TAP históricos.


## Publicación comprobada y avance concurrente de main

GitHub creó [PR #22](https://github.com/lemeit/lemeit-aq/pull/22), abierto sin
merge ni auto-merge. Primer HEAD publicado:
`74e929b86ce7cb581f62113e4f8061a69572f7ce`; árbol
`c584631f0a6e8e0f33540283435dcd617d0794ec`, idéntico al commit documental local
`761734a`. Pages registró `a1d96c17-f84e-48c5-8eb0-44036a5aca8f` con
`is_skipped=true`, `skip_reason=branch_config`: ninguna etapa inició build/deploy.

Mientras se preparaba el PR se fusionó #20 por otra vía. Main pasó a
`a9d2acd4d9f6f0e4e154b7dfc3a1e3f5849ecb21`: 21 commits adelante y 0 detrás
del auditado, 52 archivos en la comparación GitHub. Su registro Pages
`979816c5-7ac7-46fd-8d0d-5e3f749e4678` está omitido por `commit_message`;
no es un despliegue de AQ-09. El canónico conserva `dc951eca…` y
`b2fc7a1f-db1f-46cb-ab75-2c35d1568c46`. La afirmación anterior de latest intacto
corresponde exclusivamente al instante del PATCH, antes de este evento externo.

Se actualiza la rama de la propuesta sobre ese main, conservando los registros,
inventario, guías y PDF de #20. Se resuelve el conflicto documental de fin de
archivo en operación colocando el registro de #20 antes de la sección AQ-09;
se conserva también su párrafo nuevo en README. Código y pruebas de frescura
no cambian. Se publican dos commits equivalentes (funcional y documental),
con lease sobre el HEAD propio anterior; no se cambia main. Las referencias
previas a 20 commits y a #20 abierto describen la revisión inicial, no el
estado final. El SHA final y la comprobación Pages posterior constan en el PR.
