# AQ-02 — Identidad AirGradient: código fusionado y operación no verificada

Registro original de preparación, 13 de octubre de 2026, Argentina. Rama: `fix/aq-02-airgradient-identity`.
Base main original de PR #11: `8638fe671c9590c3715fca496ed562035637ee82`, PR #10 fusionado,
head de PR #10: `3ec199c98bcc2bf39626476fc19cda03496a734a`.
Referencia inicial: `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`.
Comparación histórica de esa base con la referencia: 25 archivos, 2187 líneas agregadas, 64 eliminadas. Worker, D1,
ingesta Python y workflow de ingesta eran iguales a la referencia en esa base; AQ-01
cambió el dashboard. No se infieren correcciones a partir de chats.

## Estado verificado de código y límites operativos

La [PR #11](https://github.com/lemeit/lemeit-aq/pull/11) figura **MERGED** en GitHub.
Merge SHA/main verificado: `8d85f9eeac3f2955ebde4f4c5885dab3eb0637dc`.
Fecha de fusión: `2026-10-13T23:03:22Z` (13 de octubre, 20:03:22 Argentina).
Worker, schema y archivo de migración 009 de esa PR están integrados en main.

La aplicación de `d1/migration_009_airgradient_identity.sql` a D1 remota y el
despliegue/versión efectiva del Worker **no están verificados**. No se los declara
aplicados ni se presume que estén ausentes. Un merge, un check de Pages o la
presencia del SQL en Git no acreditan la operación D1 ni el despliegue Worker.
No se ejecutaron consultas productivas, migraciones, ingestas ni despliegues para
esta actualización documental. El orden operativo autorizado sigue siendo:
comprobar estado real y respaldo; si corresponde, aprobar/aplicar 009; confirmar
restricciones; aprobar despliegue Worker. No repetir migración sin esa revisión.

Esta corrección documental fue contrastada con GitHub PR #11 y Git remoto main.
La descripción de su PR independiente registrará publicación; no cambia código,
SQL, disparadores ni configuración. Se revisaron PR abiertas: ninguna al preparar
este cambio. El usuario autorizó expresamente los previews automáticos de Pages al publicar
las dos PR de este encargo; no se exige exclusión ni se cambia configuración.
Esta autorización no cubre merge, Worker, D1, ingestas ni operaciones productivas.

## Evidencia histórica de Pages (no acredita D1/Worker AQ-02)

GitHub check Cloudflare Pages `115247005894`, asociado al HEAD, informa
`success / Deployed successfully`, 13/10/2026 07:21:11 Argentina.
Deployment informado: `c5656828-e4db-4cdc-8052-3ee594095bae`.
[Check GitHub](https://github.com/lemeit/lemeit-aq/runs/115247005894).
[Metadatos y logs Cloudflare](https://dash.cloudflare.com/?to=/4d66e081e02724f8cde0aedd23d50ab3/pages/view/purpleair-saladillo/c5656828-e4db-4cdc-8052-3ee594095bae).
Esto acredita el reporte de la integración en GitHub; no prueba por sí solo
el alias productivo vigente ni la versión desplegada del Worker.

La conexión Cloudflare enumera otra cuenta, sin Pages ni Workers. El account ID
del proyecto se contrastó con el cache versionado y con el check GitHub.
GET de Pages y GET de deployments del Worker en esa cuenta responden error
10000 Authentication error. No fue posible leer configuración de previews,
deployment canónico, versión del Worker ni logs reales. No se consultaron
endpoints productivos ni proveedores. GitHub combined statuses y workflow runs
para el HEAD están vacíos; check-runs sí contiene Pages success.

## Defecto y decisión

Las reproducciones del main de partida demostraron asignación separada MAX+1, duplicados
de serial admitidos y colisión de cuentas sin serial. Se convierten en aceptación.
Se usa un INSERT SELECT único para reservar el ID, tomando máximo de todos los
proveedores y piso 900000. El índice UNIQUE parcial de serial AirGradient arbitra
reintentos/concurrencia del mismo hardware. Se consulta después el ID persistido.
No se reutiliza un ID por un cambio de serial. La metadata solo actualiza
coordenadas de la identidad correspondiente; nombres manuales se conservan.
Se usan prepare/bind/run/first ya existentes, sin dependencias nuevas.
Referencia técnica: [D1 Database, autocommit](https://developers.cloudflare.com/d1/worker-api/d1-database/).

El serial físico exacto es identidad global dentro de AirGradient; cuentas y
locations son contexto, no hardware. Mismo serial visible en ambas cuentas
comparte ID; mismo location con seriales distintos no lo comparte. Se retiene
cuentaOrigen desde el token consultado, sin persistir tokens. Sin serial string
no vacío y sin espacios externos se rechaza; no se inventa identidad con
cuenta/location, pues un reemplazo físico podría heredar historial ajeno.
No se normaliza mayúsculas ni se presume otro contrato del proveedor.
Esta política puede omitir entradas antes aceptadas; errores son explícitos.
La trazabilidad histórica de ubicación sigue pendiente: no hay nuevo historial
de estaciones ni asociación persistida cuenta/location. AQ-12 y DAT-* no se corrigen.

## Migración conservadora

`migration_009_airgradient_identity.sql` crea índice y dos triggers. No cambia
IDs, seriales existentes, nombres, estado, lecturas ni deduplicación. Seriales
duplicados provocan fallo en la primera sentencia, antes de crear triggers.
NULL y seriales históricos numéricos no se reparan automáticamente.
Triggers rechazan reutilizar ID entre proveedores (incluido Python/default
PurpleAir) y cambiar identidad ya registrada. El esquema completo incluye
las mismas restricciones para bases nuevas. La migración no es idempotente:
registrar su aplicación y no repetirla sobre schema completo.

Antes de autorizar operación: respaldo recuperable; inventario de índices y
triggers; revisar seriales NULL/vacíos/numéricos, duplicados y casos posiblemente
mezclados; reconciliar manualmente con evidencia independiente. Una lectura
ya mezclada no puede atribuirse retroactivamente solo con estas columnas.
No se ejecutó inventario D1 ni se afirma saneamiento productivo.

Orden futuro: validar copia de respaldo con migración; aprobar aplicación D1;
confirmar restricciones; aprobar despliegue Worker; verificar sin ingesta manual
no autorizada. Sin índice el Worker falla antes de reservar; no desplegar primero.
Rollback requiere revisión: el Worker viejo intenta cambiar serial y puede
fallar con los triggers nuevos. Restaurar código anterior sin retirar restricciones
puede afectar ingesta; retirarlas reintroduce AQ-02. No proponer borrado de datos.

## Pruebas y criterios de aceptación

Node 22.23.3 con SQLite local; Python 3.11. Fixtures sintéticos y HTTP bloqueado.
35/35 integridad PASS, incluyendo diez casos de aceptación AQ-02 (tres convertidos
y siete adicionales); registro `AQ02_ACEPTACION.tap`. Otros PASS aún reproducen
defectos pendientes. AQ-01 12/12 PASS; healthcheck offline 47/47 PASS;
Python PASS, con colisión de ID AirGradient rechazada antes de insertar lectura.
Sintaxis Worker y git diff --check PASS.

Criterios: seriales distintos reciben IDs distintos; mismo serial converge;
IDs/metadata manual/historial preexistente se conservan; ausencia de serial
no escribe; PurpleAir conserva recorrido y rechaza ID ocupado; schema impide
duplicados y mutaciones; migración conserva filas o falla ante duplicados;
sin índice obligatorio no se reserva. No es una prueba de binding D1 remoto,
latencia real, calidad metrológica o concurrencia observada en producción.
La reserva y metadata/lectura son pasos distintos: un fallo posterior puede
dejar un sensor registrado sin lectura; reintentar conserva identidad.

## Publicación y coordinación

La PR [#11](https://github.com/lemeit/lemeit-aq/pull/11) se publicó con HEAD
`7dfb0425a1efe4cc72a21c0719bfb265df669e5e`, base original
`8638fe671c9590c3715fca496ed562035637ee82`, y luego fue fusionada con el SHA
registrado arriba. La exclusión de previews de su rama fue acreditada por el
titular; no acredita otras ramas. Los workflows versionados no reaccionan a
push/pull_request. La PR #12 incorporó previamente documentación, sin aplicar
código ni migración; la PR #11 sí integró después código y SQL en Git. La evidencia
TAP citada pertenece a la validación offline de PR #11. Cierre y procedimiento:
[validación local](AQ02_VALIDACION_LOCAL_D1.md) y [plan operativo](AQ02_PLAN_DESPLIEGUE.md).

Durante la preparación original de PR #11 se trabajó sobre un clon local
sin ejecución directa en Codex Cloud existente. Esta es una limitación histórica
de esa evidencia, no una descripción del entorno actual. La operación productiva
D1/Worker continúa sin verificar en este informe. La actualización documental
solo lee Git/GitHub; no ejecuta merge, deploy, migración D1, ingesta, consulta de
proveedores ni cambios cron. Toda operación productiva requiere autorización
separada; el código fusionado no sustituye esa autorización.


### Condición de publicación acreditada

El titular confirmó que guardó la exclusión y aportó una captura de Pages que
muestra `fix/aq-02-airgradient-identity` en **Exclude Preview branches**, con
Custom branches seleccionado e inclusión `*`. La captura y confirmación del
usuario acreditan la condición para publicar; no constituyen lectura API de
Cloudflare ni verificación del Worker. La autorización original permitió publicar esa rama y PR sin ejecutar despliegue,
migración D1 ni ingesta. La fusión posterior se constata en el estado verificado
arriba; no demuestra que esas operaciones productivas se hayan ejecutado.

## Validación de esta actualización documental

Criterios de aceptación: README y este informe describen PR #11 fusionada con
SHA/fecha exactos; código y SQL versionados se distinguen de migración aplicada
y Worker desplegado; la evidencia histórica y sus límites se conservan.
Se verificaron los enlaces relativos, ausencia del estado obsoleto
«abierta y sin merge», git diff --check y diff limitado a los dos documentos.
No se necesitan ejecutar servicios o pruebas de producción para esta corrección.
Reversión: retirar este commit documental mediante otra PR autorizada; no hay
datos que restaurar. Publicar o fusionar requiere respetar los disparadores Pages.
