# Diagnóstico AQ

Implementación independiente, sin dependencias npm, package.json ni build. No
modifica Worker, D1, proveedores, cron, secretos, servicios ni despliegues.

## Evidencia inicial y procedencia

El 2026-10-11 se leyeron AGENTS.md, README, Worker, Wrangler, esquema y migraciones
D1, workflow de ingesta, Python y scripts PowerShell antes de editar.
La falta de diagnóstico/suite se reproduce sobre el HEAD inicial con:

```bash
git ls-tree -r --name-only 002853684c9489dc6c70e0325750ad9b760bd54c
```

No contiene package.json, tests, healthcheck ni CI de validación: solo el workflow
de ingesta manual, cuyos scripts no se ejecutaron. GitHub volvió a confirmar
`main = 002853684c9489dc6c70e0325750ad9b760bd54c`, tres commits por delante de
`c03d7d0dca68772f3d1ea3312d797fe48f038f9c`. La comparación remota solo añade
`docs/AUDITORIA_TECNICA.md` y `docs/PLAN_MEJORAS.md`; no hay fixes de código.
Los hallazgos AQ-01 a AQ-09 y los demás riesgos siguen sin corregirse. Añadir
pruebas de diagnóstico no corrige AQI, identidad, filtros, límites, XSS ni cron.

Motor y CLI adaptados de [PReViA PR #3](https://github.com/lemeit/previa/pull/3),
fusión confirmada `d85804c8a131fa89778a8e67a8a6adfd91061add`.
Se estudiaron en main `scripts/healthcheck-lib.mjs`, `scripts/healthcheck.mjs`,
`tests/healthcheck.test.mjs`, `healthcheck.config.json` y `docs/HEALTHCHECK.md`.
Se conservaron transporte HTTPS, timeouts, reintentos, redirecciones, resumen y
CLI; se quitaron build/dist y controles propios de Supabase. Se agregó lista
cerrada Pages, umbral de vencimiento TLS, SKIP de API y validadores puros AQ.

## Comandos

Desde la raíz, con Node 22 (sin instalar dependencias):

```bash
node tests/healthcheck.test.mjs
node scripts/healthcheck.mjs --offline
node --check scripts/healthcheck-lib.mjs
node --check scripts/healthcheck-validators.mjs
node --check scripts/healthcheck.mjs
node --input-type=module --check < worker/src/index.js
node --check sw.js
```

El runner estándar `node --test tests/healthcheck.test.mjs` también está disponible.
En este entorno Node 24, la ejecución aislada informó solo el archivo como una
prueba; `node --test --test-isolation=none tests/healthcheck.test.mjs` y la ejecución
directa mostraron las 32 pruebas individuales. El workflow usa ejecución directa,
compatible con Node 22. No se verificó Node 22 localmente: el runtime disponible
es 24.19.0; no se instaló otro runtime por la falta de acceso al proxy.

Sin `--offline`, el comando `node scripts/healthcheck.mjs` comprueba DNS y,
solo si `pagesRoutingConfirmed` es exactamente true, las rutas Pages permitidas.
Actualmente es false: falta verificar reglas reales de enrutamiento de producción.
Cambiar ese indicador requiere evidencia de que `/aq`, `/aq/` y `/aq/api.html`
son Pages estático y no invocan Worker por sí mismas. El cliente Node no ejecuta
HTML, JS ni service workers; nunca abrir el dashboard para este diagnóstico.
En este entorno, además, app.lemeit.ar y api.lemeit.ar no están autorizados en la
política HTTP ni TCP y el proxy no responde. No se intentó sortearlo.

Genera consola, resumen Actions y `healthcheck-results/healthcheck.json`, ignorado
por Git. Acepta `--config archivo.json` y `--output healthcheck-results/otro.json`.
PASS confirma únicamente el control indicado; WARN requiere revisión; FAIL sale
1; PASS/WARN/SKIP salen 0. SKIP no equivale a salud comprobada. Configuración o
escritura inválidas salen 1; si no se pudo escribir JSON, el artefacto lo denuncia.

## Controles y aceptación

- DNS de app.lemeit.ar y api.lemeit.ar, timeout 10 s. No informa IPs.
- Pages público y documentación API: HTTP 200 y tipo text/html; TLS con cadena,
  hostname y vigencia validados por Node. No desactivar validación TLS.
- Vencimiento certificado: FAIL si vencido, WARN si ausente o menor a 30 días.
- Cabeceras: nosniff por valor; HSTS, CSP y Referrer-Policy por presencia; falta
  produce WARN, sin alterar configuración. No es auditoría completa de políticas.
- Latencia hasta cabeceras, WARN sobre 3 s; no mide navegador ni cuerpo.
- Un reintento (conexión, timeout, 429/5xx), máximo dos redirecciones por intento,
  ciclos bloqueados. Solo HTTPS, host app.lemeit.ar y las tres rutas mencionadas;
  credenciales, queries, fragmentos y puertos no estándar bloqueados. Nunca sigue
  una redirección a API, proveedor, CARTO o admin. Límite por petición 10 s; el
  workflow limita el job completo a 10 minutos.
- No registra cuerpos, cabeceras crudas, cookies, tokens, metadatos personales,
  URLs redirigidas ni mensajes de error externos. Los reportes solo contienen
  identificadores de controles, mensajes internos, contadores y tiempos.

`healthcheck-validators.mjs` solo recibe fixtures/mocks, nunca descarga datos:

- `/api/sensores`: array de objetos, sensor_index entero positivo seguro único,
  nombre string, activo 0/1 y proveedor purpleair/airgradient. El endpoint real
  solo lista activos; se admiten inactivos en fixtures para verificar exclusión.
- `/api/ultimas`: array, sensor_index e id de lectura únicos, proveedor explícito,
  timestamp y métricas presentes numéricas finitas o null. Campos adicionales se
  toleran por SELECT *. No se calcula AQI ni se exige sensor activo en esa ruta:
  la consulta actual no lo filtra (AQ-04).
- Histórico: unicidad de id y par sensor/timestamp; varias lecturas del mismo
  sensor son válidas; proveedor no es obligatorio en el contrato histórico.
- Timestamp estricto `YYYY-MM-DD HH:MM:SS`, interpretado UTC, formato real D1
  consumido por dashboard. No acepta ISO con T/Z, offsets, formatos ambiguos,
  fracciones ni normalización automática de fechas imposibles.
- Fecha inválida, futura o proveedor inconsistente: FAIL. Más de 25 minutos o
  activo sin lectura: WARN. A exactamente 25 minutos sigue reciente.
- Inactivo no exige frescura. Lectura fuera del listado activo: WARN, compatible
  con AQ-04; no afirma sensor inexistente. Cobertura se cuenta por proveedor:
  activos recientes/activos esperados; sin activos del proveedor, SKIP. Array
  vacío advierte, sin convertir ausencia de datos en salud.

Las 32 pruebas cubren restricciones de destinos, redirecciones, reintentos,
timeout antes del socket, TLS, expiración, cabeceras, sanitización, salida CLI,
arrays, IDs, UTC, fechas inválidas/futuras, lectura vieja, activo sin lectura,
inactivos y cobertura por proveedor. Son evidencia de validadores, no de la red
real. No afirman salud sanitaria ni ejecución de cron a partir de frescura.

## API y límites operativos

`logVisita` inserta en visitas por cada GET público antes de resolver la ruta,
incluso desconocida. Por la prohibición de modificar D1, sensores, últimas,
histórico, JSON y frescura en producción son SKIP explícitos. No se usan POST,
OPTIONS ni otros métodos para sortearlo. TLS aislado al host API es posible en
principio sin HTTP, pero no está implementado y se informa SKIP.
También SKIP: proveedores, CARTO, admin, ingesta, cron y D1. No se consultaron
PurpleAir/AirGradient, no se ejecutaron migraciones ni escrituras remotas.
No se verificaron secretos, cron-job.org, migraciones desplegadas o cobertura
operativa real AirGradient. Este diagnóstico no reemplaza esas comprobaciones.

## Workflow y publicación bloqueada

`.github/workflows/healthcheck.yml`: manual y diario a las 09:17 UTC, 06:17
Argentina aproximadamente (GitHub puede demorarlo). Node 22, contents: read,
suite offline, diagnóstico permitido y artefacto sanitizado con always y retención
14 días, timeout 10 minutos, sin secrets, deploy, build, instalación ni ingesta.
El schedule solo se activa al fusionar en main. Aquí no se fusionó ni se ejecutó
ningún workflow; la ingesta existente queda intacta.

Antes de publicar se encontró evidencia de integración Pages automática en
[AQ PR #2](https://github.com/lemeit/lemeit-aq/pull/2): el bot Cloudflare anunció
una preview para `docs/auditoria-y-plan-mejoras-20261010`, commit `3140988`,
proyecto `purpleair-saladillo`. Incluso cambios documentales dispararon deploy.
La cuenta indicada por ese comentario y por la caché Wrangler local no está
accesible por la conexión Cloudflare de esta sesión (error de autenticación).
La cuenta accesible devuelve cero proyectos Pages y ninguna zona lemeit.ar;
eso no demuestra ausencia de integración en la cuenta correcta. No se pudieron
verificar filtros actuales de ramas ni Workers Builds de ese proyecto.

**No se publicó feat/healthcheck ni se creó PR**, por la prohibición de despliegues.
No se cambiaron ajustes para evitarlo. Se entrega commit local, parche y borrador
de PR para revisión. Antes de publicar debe verificarse en la cuenta correcta
que push/PR de esta rama no despliega Pages ni Worker.

## Resultados reales, riesgos y reversión

2026-10-11: 32/32 pruebas offline PASS, cero fallos. Sintaxis de los tres módulos
nuevos, Worker, service worker y AST Python: OK. Diagnóstico offline: salida 0,
0 PASS, 1 WARN (Node 24.19.0 frente a 22), 0 FAIL, 16 SKIP. No se ejecutó diagnóstico
HTTP público por falta de confirmación de ruta y restricciones del entorno.
Hashes SHA-256 de Worker/config, D1, workflow de ingesta, Python, frontend y service
worker conservados. Diff acotado a diagnóstico, pruebas, workflow independiente,
README y .gitignore; sin package.json ni dependencias nuevas.

Riesgo residual: diagnóstico parcial puede confundirse con salud completa; revisar
siempre SKIP. Una vez permitido HTTP, carga máxima acotada a dos rutas Pages con
reintentos y saltos; nunca consumo de proveedores o visitas D1. No se amplió
frecuencia de ingesta. Revertir el commit elimina diagnóstico, documentación,
pruebas y workflow; no hay datos ni servicios que restaurar. Revertir/publicar
también exige comprobar integración de despliegue antes de push. No fusionar
hasta revisar estas limitaciones y la confirmación de rutas pendiente.
