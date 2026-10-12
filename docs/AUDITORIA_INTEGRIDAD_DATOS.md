# Auditoría de integridad y calidad de datos — LEMEIT AQ

Fecha: 12 de octubre de 2026, Argentina. Coordinación: chat 01; ingesta e identidad: chat 02; API: chat 03; presentación: chat 04; programación efectiva: chat 05.

## Resultado y alcance

Se reprodujeron defectos que afectan el indicador AQI, la identidad AirGradient, la validación temporal, el estado de sensores y la interpretación de errores. **No se verificó que los datos productivos estén corruptos ni que difieran de los proveedores.** Esa comparación exige respuestas originales y una muestra D1 correspondiente, que no estuvieron disponibles.

Código auditado: `92f0c895788a127674ce5fa56f680726af158217`, HEAD remoto de main consultado mediante GitHub. Referencia: `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`. Main tiene nueve commits adicionales; comparación: 15 archivos, 899 líneas agregadas, sin cambios en Worker, D1, ingesta Python, dashboard o workflow de ingesta. La comparación local específica de esos componentes terminó con código 0 y sin diferencias. Los cambios intermedios son documentación y diagnóstico estático; no corrigen los defectos de datos.

Se leyeron AGENTS.md del proyecto y repositorio, README, schema/migraciones, documentación de auditoría y plan de mejoras, Worker, Python, workflow y código del dashboard. Se consultó el chat Cloud existente “Configurar lemeit-aq” y el chat 01. El chat 01 no aportó decisiones técnicas recuperables adicionales; no se asumieron correcciones de otros chats. Esta sesión dispone de ejecución local, no de ejecución directa en el entorno Cloud existente: se utilizó una copia nueva de GitHub y rama local `audit/integridad-offline`.

Sin GET a API pública LEMEIT, sin consultas de mediciones a proveedores, sin D1 remota, ingestas reales, migraciones productivas, despliegues, merges o publicaciones. Las únicas escrituras de datos fueron SQLite en memoria. No se extrajeron secretos. Se consultaron páginas públicas de documentación técnica. Healthcheck, HSTS y CSP quedan fuera del alcance.

## Método y pruebas

El harness importa el **código real** del Worker mediante un módulo temporal en memoria, agregando exports solo a esa copia. Adapta prepare/bind/run/all/first a SQLite en memoria con foreign_keys habilitado y schema.sql actual. Ejecuta funciones reales de AQI, fechas, mapa y carga de UI extraídas del HTML en VM; no inicia navegador, mapas ni recursos externos. Para Python bloquea requests antes de importar el módulo, sustituye d1_query por SQLite y usa variables ficticias.

Todos los fixtures son sintéticos y están explícitos en las pruebas: PA sensor 101; AG seriales `fixture-*`; tiempos UTC/offset, valores válidos, faltantes e inválidos. No son capturas de sensores reales. El repositorio no contiene fixtures originales identificados para reconciliar este recorrido. Los fixtures demuestran comportamiento del código ante esas entradas, no frecuencia de ocurrencia en producción ni contrato efectivo actual de cada cuenta.

| Comando / comprobación | Resultado |
|---|---|
| `node --test --test-reporter=tap tests/data-integrity.audit.test.mjs` | 28/28 PASS, Node 24.18.0, SQLite 3.53.1; registro AUDITORIA_DATOS_TESTS.tap |
| Mismo comando con Node 22.23.3 disponible en el entorno | 28/28 PASS, SQLite 3.51.3; registro AUDITORIA_DATOS_TESTS_NODE22.tap; advertencia de SQLite experimental |
| `python -B tests/data-integrity-python.audit.py` | PASS, Python 3.11.9: valores, dedupe, nombre y conflicto schema/migración |
| `node --check worker/src/index.js` | Código de salida 0 |
| `git diff --check` | Código de salida 0 |
| `git diff --exit-code c03d7d0dca68772f3d1ea3312d797fe48f038f9c HEAD -- worker d1 index.html ingest_purpleair.py .github/workflows/purpleair-ingest.yml` | Código de salida 0, componentes idénticos |

**PASS significa que la reproducción o control se comporta como se documenta; no significa que el defecto esté resuelto.** Antes de integrar correcciones deben convertirse los casos correspondientes en pruebas de aceptación del comportamiento correcto. No se ejecutó el diagnóstico público ni se amplió la revisión de Healthcheck.

Límite técnico: adaptador SQLite local, no runtime Cloudflare ni binding D1 real; versiones y latencia pueden diferir. La carrera demuestra una intercalación permitida de consultas separadas, no una colisión observada en el servicio. Las pruebas de UI verifican lógica y HTML, no una sesión visual completa.

## Matriz fuente → D1 → API → UI

Referencias de líneas corresponden al commit auditado; W = worker/src/index.js, P = ingest_purpleair.py, S = d1/schema.sql, U = index.html.

| Proveedor / aspecto | Fuente e ingesta | Persistencia D1 | API | UI y limitación |
|---|---|---|---|---|
| PurpleAir: identidad | sensor_index de fields/data; show_only configurado; W34–62, 114–140; Python P24–30, 146–166 | PK sensor_index, proveedor purpleair; W65–78; S5–16 | sensores filtra activo; ultimas une metadata actual | Dashboard toma ultimas, U2223–2242; sensor activo sin lectura no aparece; ID recibido no se revalida contra allowlist |
| PurpleAir: PM | pm1.0, pm2.5, pm10.0 se copian; W81–111 y P104–143 | pm1_0, pm2_5, pm10_0 REAL; sin método/calibración/flags | JSON/CSV no transforman PM | µg/m³; AQI usa pm2_5; no armonización ni corrección EPA implementada |
| PurpleAir: ventanas/canales | pm2.5_10minute/60minute y canales A/B se conservan | pm2_5_10min/60min y canales; S29–37 | Incluidos en SELECT l.* / historial | Overlays A/B; AQI no utiliza ventanas almacenadas; no validación de divergencia de canales |
| PurpleAir: ambientales | °F → °C con redondeo a dos decimales; humedad/presión/VOC/RSSI copiados | temperatura, humedad, presion, voc, rssi | Sin conversión adicional | °C, %, hPa e índice VOC; no normalización metrológica adicional |
| PurpleAir: tiempo | last_seen Unix segundos → datetime(unixepoch) UTC | TEXT YYYY-MM-DD HH:MM:SS; timestamp NOT NULL; creado_en separado | Range relativo usa UTC SQLite; fechas absolutas se comparan como texto | Añade Z y convierte a Buenos Aires; falta/reloj futuro no rechazados explícitamente |
| AirGradient: selección | Dos tokens concatenados; filtro global locationId; serialno o fallback locationId; W145–193, 236–272 | MAX(sensor_index)+1 separado del upsert; serial sin UNIQUE | proveedor airgradient en metadata | Ubicación/nombre del sensor actual; sin vínculo cuenta/location versionado; riesgo de mezclar sensores |
| AirGradient: PM | loc.pm01/pm02/pm10 copiados; W210–233 | mismas columnas PM; sin campos de método | Mismo contrato numérico | Comparación directa con PA; pm02_corrected/pm02Compensated no se usan; no prueba de equivalencia física |
| AirGradient: ambientales | rco2, tvocIndex, noxIndex, wifi; Compensated prioritario para atmp/rhum | co2, voc, nox, rssi, temperatura/humedad; presión/canales/ventanas quedan NULL | API conserva valores | CO2 ppm; VOC/NOx índices; unidad común de columna no certifica escala equivalente entre fabricantes |
| AirGradient: tiempo | Reemplazos de T/Z/fracción, sin parser ni conversión de offset | TEXT; dedupe por texto exacto; vista MAX(timestamp) | Orden lexicográfico e intervalos | UI asume UTC sin zona; offset remanente genera fecha inválida; misma fecha física puede duplicarse |
| Ambos: dedupe | INSERT OR IGNORE; sin inspección de meta.changes | UNIQUE(sensor_index,timestamp); conserva primera fila, no actualiza correcciones | Sin estado de ingestión ni flags en lecturas | No puede distinguir repetición idéntica de descarte/error; guardados no significa nuevas filas |
| Ambos: estación e historial | Upserts cambian coordenadas; nombres difieren entre Python/Worker | Institución/estado/notas actuales; sin historial de ubicación/metodología | Ultimas une metadata vigente; histórico devuelve lecturas | No se puede reconstruir ubicación o configuración vigente al medir a partir del esquema solo |
| Ambos: AQI/frescura | Sin AQI backend; última muestra no es agregación diaria/NowCast | Guarda concentraciones y creado_en, no índice AQI | API no publica AQI ni cobertura temporal | AQI y colores calculados solo en UI; frescura >25 min; mapa no aplica esa neutralización |

Controles positivos reproducidos: fields reordenados se mapean correctamente; opcionales PA faltantes quedan NULL; PM y canales numéricos se conservan; 68 °F →20 °C; ventanas 10/60 min se almacenan; AG preserva CO2/NOx y prioriza ambientales Compensated; dedupe exacto evita segunda fila bajo schema.sql. Esto no valida precisión del hardware.

## Hallazgos confirmados y severidad

P1: puede alterar identidad, interpretación pública o integridad del recorrido; prioridad alta. P2: confiabilidad, trazabilidad o interpretación de resultados. No se asigna P0 ni se presume incidente productivo.

| ID / gravedad / chat | Reproducción y consecuencia | Evidencia del código actual |
|---|---|---|
| AQ-01 / P1 / 01+04 | 12.05, 35.45, negativos, NaN e infinito →300; 9→38; >250.4 siempre 300. Tramos incompletos, huecos decimales y escala desactualizada para la etiqueta EPA. Una muestra pm2_5 no representa AQI diario/NowCast. | [U1995](https://github.com/lemeit/lemeit-aq/blob/92f0c895788a127674ce5fa56f680726af158217/index.html#L1995), inversa U1876–1887, consumo U2016/U2275 |
| AQ-02 / P1 / 02+01 | Dos seriales obtienen 900001 antes de insertar; segundo upsert cambia serial y deja dos lecturas de dispositivos distintos bajo mismo ID. Schema admite dos filas con mismo proveedor/serial. Sin serial, mismo locationId de dos cuentas se fusiona. | [W181](https://github.com/lemeit/lemeit-aq/blob/92f0c895788a127674ce5fa56f680726af158217/worker/src/index.js#L181), W199–204/W262; S5–20 |
| DAT-01 / P1 / 01+02 | PA acepta PM -3/texto y humedad 150. last_seen NULL produce lectura ignorada y ok:true/guardados:1. AG sin timestamp también informa guardado. Datos inválidos no quedan separados ni contabilizados. | [W81](https://github.com/lemeit/lemeit-aq/blob/92f0c895788a127674ce5fa56f680726af158217/worker/src/index.js#L81), W133–135/W211/W267; S24–45 |
| DAT-02 / P1 / 01+02 | 22:00Z y 19:00-03:00 son mismo instante y quedan dos filas. UI invalida offset; isStale devuelve false. Texto zz-invalid gana MAX(timestamp), desplazando la lectura válida. Fecha futura se considera fresca. | [W210](https://github.com/lemeit/lemeit-aq/blob/92f0c895788a127674ce5fa56f680726af158217/worker/src/index.js#L210), S68–75; U1890–1925 |
| AQ-04 / P1 / 03+04 | Sensor activo=0 desaparece de sensores pero permanece en ultimas/dashboard. Las lecturas históricas siguen disponibles, lo cual debe preservarse. | [W404](https://github.com/lemeit/lemeit-aq/blob/92f0c895788a127674ce5fa56f680726af158217/worker/src/index.js#L404), W412–421; U2239–2242 |
| AQ-03 / P1 / 03 | limit=-1 devuelve 3001 filas y elimina el tope; abc, cero y fracciones responden 200. SELECT ASC limitado entrega primeras filas y no informa truncamiento. El defecto de parseo también está en visitas; no se consultó admin real. | [W424](https://github.com/lemeit/lemeit-aq/blob/92f0c895788a127674ce5fa56f680726af158217/worker/src/index.js#L424), W429/W447/W474 |
| AQ-05 / P1 condicional / 02+05 | POST ingest-ahora documentado como disparador externo solo consulta PA; scheduled consulta ambos; Actions solo Python/PA y schedule comentado. La brecha de cobertura real de AG depende de los jobs efectivamente activos, no verificados. | [W454](https://github.com/lemeit/lemeit-aq/blob/92f0c895788a127674ce5fa56f680726af158217/worker/src/index.js#L454), W463/W509; README37–77; workflow23–45 |
| AQ-09 / P2 / 01+04 | Mapa conserva verde para dato antiguo. Fallo de red no renderiza cards ni actualiza antigüedad; último estado puede persistir. Timestamps inválidos no envejecen por NaN. | [U2046](https://github.com/lemeit/lemeit-aq/blob/92f0c895788a127674ce5fa56f680726af158217/index.html#L2046), U2171–2184/U2223–2266/U3300 |
| AQ-07 / P2 / 01+03 | desde=hasta=2026-10-12 devuelve cero aun con medianoche y mediodía de ese día. Input date de UI manda texto sin conversión de zona; contrato API dice UTC, UI muestra Buenos Aires. | [W434](https://github.com/lemeit/lemeit-aq/blob/92f0c895788a127674ce5fa56f680726af158217/worker/src/index.js#L434), U1049–1050/U2665–2671 |
| AQ-08 / P2 / 02 | Worker conserva nombre manual; Python lo sobrescribe con nombre del proveedor. Reactivar camino Python puede revertir metadata curada. | [P81](https://github.com/lemeit/lemeit-aq/blob/92f0c895788a127674ce5fa56f680726af158217/ingest_purpleair.py#L81), W65–78 |
| AQ-10/11 / P2 / 02+05 | Dedupe informa guardados:1 aun con 0 inserciones. Un token AG 500 y otro válido →ok:true sin errores; scheduled resuelve sin registrar ok:false cuando ambos payloads son vacíos. No hay timeouts explícitos en fetch del Worker; Python sí usa 30 s. | [W135](https://github.com/lemeit/lemeit-aq/blob/92f0c895788a127674ce5fa56f680726af158217/worker/src/index.js#L135), W161–178/W267/W509; P58/P73 |
| AQ-12 / P2 / 02 | Sin allowlist AG se ingesta todo; con lista no coincidente se descarta. Existe lista en wrangler, pero no se verificó configuración desplegada. PA usa show_only sin control adicional de IDs recibidos. | [W242](https://github.com/lemeit/lemeit-aq/blob/92f0c895788a127674ce5fa56f680726af158217/worker/src/index.js#L242), W54/W127; wrangler.toml27 |
| DAT-03 / P2 / 03+04 | Error HTTP 500 de historial con {error:...} termina en mensaje “sin datos”; no diferencia ausencia de mediciones de fallo de D1/API. | [U2686](https://github.com/lemeit/lemeit-aq/blob/92f0c895788a127674ce5fa56f680726af158217/index.html#L2686) |
| AQ-15 / P2 / 01+03 | Schema completo seguido de migration_004 falla por columna duplicada. Hay migraciones con DELETE de dedupe; no deben aplicarse automáticamente. Falta un procedimiento inequívoco para nueva/existente. | [S14](https://github.com/lemeit/lemeit-aq/blob/92f0c895788a127674ce5fa56f680726af158217/d1/schema.sql#L14), migration_004 líneas22–26; migration_003 líneas30–36 |

Otros aspectos confirmados por inspección: no hay envelope original/hash/cuenta/locationId/método de PM ni calidad por lectura; creado_en es inserción, no hora de ejecución intentada. Metadatos e inserción son escrituras separadas; una lectura fallida puede dejar sensor creado. El prefijo numérico 900000 no impone separación formal entre IDs de proveedores. Los nombres/mediciones se interpolan en HTML (U2182, U2292, U2742): riesgo de datos externos no confiables ya documentado en AQ-06; no se ejecutó explotación ni se amplió auditoría de seguridad.

## AQI y armonización: hechos, hipótesis y pendientes

La guía oficial [EPA/AirNow, mayo 2026, tabla 6 y sección IV](https://document.airnow.gov/technical-assistance-document-for-the-reporting-of-daily-air-quailty.pdf) establece PM2.5 truncado a una cifra decimal, interpolación y redondeo del índice; puntos vigentes 0–9.0, 9.1–35.4, 35.5–55.4, 55.5–125.4, 125.5–225.4 y 225.5–325.4 para índices hasta 500. El AQI diario y NowCast requieren períodos/algoritmos distintos. Esto confirma diferencias metodológicas del código, sin convertir una muestra sintética en recomendación sanitaria ni cambiar umbrales durante la auditoría.

La [documentación publicada por PurpleAir](https://community.purpleair.com/t/api-fields-descriptions/4652) distingue variantes ATM, CF=1 y ALT y define last_seen como recepción en servidor. El código solicita nombres genéricos pm2.5/pm2.5_a/b; **no quedó verificado su alias exacto, versión o período efectivo con una respuesta original y documentación contractual actual**. No se infiere que todas las variantes sean equivalentes ni que last_seen sea hora precisa de adquisición física.

AirGradient dispone de [documentación de API](https://api.airgradient.com/public/docs/api/v1/) y [guía de acceso](https://www.airgradient.com/documentation/kb/where-do-i-access-the-api-documentation-api-token-and-local-api/). La página Swagger no expuso contenido textual de modelos en esta consulta. El fixture con pm02=8, pm02_corrected=5 y pm02Compensated=4 prueba que el Worker selecciona 8; **no prueba que las cuentas reales envíen esos tres campos**, ni que sea obligatorio usar uno distinto. Obtener contrato/respuesta de ese endpoint específico antes de decidir. Tampoco intercambiar campos de API local/MQTT con cloud por similitud de nombre.

Confirmado: no se aplica corrección/calibración PM adicional en ninguno de los caminos revisados. Pendiente: acordar método de armonización, interior/exterior, humedad, firmware, canal degradado y comparación con referencia. Una misma unidad µg/m³ no garantiza métodos, períodos o sesgos equivalentes. No se compararon dashboard de fabricante y LEMEIT ni se midió precisión del sensor.

Para identidad, D1 documenta [auto-commit y batch transaccional](https://developers.cloudflare.com/d1/worker-api/d1-database/). Ello orienta el diseño posterior, pero envolver una asignación cliente MAX+1 no sustituye unicidad y relectura consistente; diseñar y probar la operación completa antes de proponer migración.

## PRs propuestos, orden y aceptación

Orden específico para integridad de datos; complementa PLAN_MEJORAS, no altera su estado. Ningún PR se publicó ni se integró.

| Orden / alcance pequeño | Responsable | Criterios de aceptación y pruebas |
|---|---|---|
| 1. AQ-01: cálculo y etiqueta AQI, más inversa/bandas | 01+04 | Negativos/no finitos rechazados; fronteras/decimales sin huecos; tabla EPA versionada y fuente; >300 correctamente tratado; explicitar estimación desde muestra, sin llamarla NowCast/diario. Preservar PM original; no recalcular D1. |
| 2. AQ-02: identidad AG atómica | 02+01 | Dos dispositivos concurrentes conservan IDs distintos; mismo serial concurrente converge; cuenta/location sin serial no se fusiona; ID PA no colisiona. Preparar detección de conflictos existentes y migración conservadora para revisión, sin ejecutarla ni reasignar historial por suposición. |
| 3. DAT-01/02: timestamps y validación de entrada | 01+02 | Z, offset y fracciones → UTC canónico; mismo instante deduplica; fecha inválida/futura fuera de tolerancia no domina últimas; números finitos y rangos razonables; opcionales NULL válidos; invalidaciones contabilizadas. No borrar ni corregir filas existentes automáticamente. |
| 4. AQ-03: límites; luego AQ-07 fechas en PR separado | 03+01 | Enteros positivos y máximos efectivos, HTTP 400 para inválidos; intervalo exclusivo acordado; día final completo; zona de inputs explícita; señalar truncamiento/paginación sin mezclar evolución de contrato inesperada. |
| 5. AQ-04: últimos solo activos; luego AQ-09 frescura en UI | 03+04 | Inactivos excluidos del estado actual, historial preservado. Cards/mapa/popups neutralizan dato viejo/ inválido y envejecen con reloj local aun sin red; no presentar fallos como ausencia de mediciones. |
| 6. AQ-10/11: contadores, errores y timeout | 02+05 | Insertados/duplicados/descartados y fallos por proveedor/token distinguidos; ok:false visible en scheduled; timeout y tests offline de error parcial; sin nueva ingesta real para validar. |
| 7. AQ-12 y AQ-08 en PRs separados | 02 | Allowlist ausente falla cerrada; identidad autorizada por cuenta/location; política común de nombres en JS/Python, nombres manuales preservados. No activar schedule. |
| 8. Contrato de PM y trazabilidad; luego AQ-15 documentación | 01+02+03 | Fixture de contrato aprobado, método/unidad/período y crudo/corregido explícitos; entradas originales trazables y sanitizadas; caminos schema nuevo/migración existente separados; cualquier cambio de datos requiere autorización posterior. |

En paralelo como diagnóstico de lectura: chat 02/05 puede verificar jobs y cobertura AG con configuración/logs existentes autorizados. No reactivar cron, aumentar frecuencia ni añadir consultas reales para “probar”. Rollback de futuros cambios de código: revertir PR aislado; identidad/esquema requiere plan de recuperación propio y autorización antes de ejecutar, no un simple revert.

## Obtención segura de evidencia original — propuesta sin ejecutar

Priorizar respuestas ya retenidas/exportadas por el responsable, evitando gastar cuota. Si no existen, pedir autorización específica para una captura acotada por proveedor/token, cantidad y costo estimado conocidos, **sin invocar endpoints de ingesta LEMEIT**. Guardar fuera de archivos públicos; eliminar tokens, headers, URLs con credenciales, nombres privados y coordenadas sensibles. Reemplazar sensor/serial/cuenta/location de manera estable manteniendo las relaciones entre muestras y filas. No alterar timestamps, unidades, valores, nulls, campos ni forma del payload necesaria para el caso de prueba.

Adjuntar manifiesto: origen exacto sin credenciales, versión/documentación, fecha de captura, tipo de respuesta, campos, transformaciones de anonimización y hash del fixture sanitizado. El original permanece privado; su vínculo verificable con el fixture debe conservarlo el responsable. Incorporar normal/faltantes, sensor desconectado, duplicado, canales divergentes, offsets y cuenta AG superpuesta cuando existan ejemplos reales; si alguno no existe, mantenerlo marcado sintético.

Separadamente, proponer exportación mínima y de solo lectura de schema efectivo, índices, mapping de sensores y filas de esos instantes, a través de acceso D1 autorizado, no GET público con visitas. Emparejar fuente→normalización esperada→fila→JSON/CSV→UI por ID/instante/método. No es correcto emparejar solo por hora de consulta, porque el proveedor puede repetir última muestra. No copiar visitas, notas privadas ni secretos. No inferir pérdida histórica a partir de una foto aislada.

Pendientes no verificables ahora: configuración/logs efectivos cron-job.org y Cloudflare Cron; credenciales disponibles/alcance; esquema/migraciones realmente aplicados; completitud/gaps de series; duplicados o mezcla real de seriales; fidelidad numérica respecto de respuestas originales; metrología y calibración; Worker/Pages desplegados coincidentes con main. No se promete disponibilidad continua del sitio con pruebas offline.

## Entrega y coordinación

Archivos nuevos de auditoría: este informe, dos pruebas offline y dos registros TAP. Worker, Python de ingesta, SQL, UI y configuración operativa permanecen idénticos al commit inspeccionado. Estado: diagnóstico y reproducciones verificadas localmente; correcciones solo propuestas. La documentación se prepara para revisión en rama local; GitHub continúa siendo fuente de verdad y no se declara este informe publicado.

Chat 01 coordina integridad y prioridades; chat 02 recibe identidad, contrato de proveedor y cobertura. Los hallazgos se identifican por AQ-* / DAT-* para evitar repetir esta auditoría en cada conversación.
