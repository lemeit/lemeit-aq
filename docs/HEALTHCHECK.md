> Estado vigente: [fase 2C](HEALTHCHECK_FASE_2C.md) permite exclusivamente el stub estático `/aq/api` con evidencia y autorización actual. El bloqueo y las restricciones de publicación descritos abajo son históricos.

> Operación 28/10/2026: ver [inventario verificado por SELECT directo](INVENTARIO_ESTACIONES.md) y [alta PurpleAir/reversión](OPERACION_PURPLEAIR.md). No usar el healthcheck público para validar AE-03 bajo restricción de solo lectura: registra visitas en D1. API y dashboard permanecen sin comprobación independiente en este corte.

# Diagnóstico AQ — fase 2A

> Actualización 2026-10-12: [fase 2B](HEALTHCHECK_FASE_2B.md) mantiene bloqueada la ruta
> estática exacta `/aq/api` y corrige la obtención del certificado TLS. Las
> referencias históricas deben interpretarse según el alcance vigente de fase 2B.

Fecha de preparación: 2026-10-11; exclusión autorizada: 2026-10-12 (Argentina).
Base revalidada: main 2f37864576b8ed7d152f9c36aa2d3d9184047884.
Comparación con auditoría c03d7d0dca68772f3d1ea3312d797fe48f038f9c:
cuatro commits por delante, cero por detrás; Worker, D1 y frontend sin cambios.
Se inspeccionaron AGENTS.md, README, Worker, Wrangler, workflow y diagnóstico reales.

## Defecto y cambio

main omite HTTP con pagesRoutingConfirmed=false y exige independencia del Worker.
La evidencia revisada acredita un gateway estático, no esa independencia.
Se reemplaza el indicador por staticGatewayRoutesConfirmed: confirmación de cada
URL exacta, exigida también antes de cada salto de redirección.
El indicador antiguo no habilita HTTP. La lista cerrada del motor prevalece
aunque la configuración incluya otras URLs.

## Evidencia y alcance

Informe operativo y copia revisada del gateway activo cda9475b:
- /aq: 301 hacia /aq/, sin subpetición.
- /aq/: obtiene https://purpleair-saladillo.pages.dev/.
- /aq/api.html: obtiene https://purpleair-saladillo.pages.dev/api.html.

Estas rutas dependen de lemeit-gateway; el código revisado no llama API AQ ni
escribe D1 para ellas. Pages purpleair-saladillo está conectado a producción main.
La evidencia proviene de la inspección anterior; esta sesión no reabrió Quick Edit.
No se afirma independencia del gateway ni vigencia futura de esa versión.

/aq/api permanece prohibido: su posible normalización desde api.html solo fue
simulada. Si aparece, falla antes de solicitar el destino. El cliente tampoco
permite origen Pages directo, API, proveedores, admin ni dominios externos.
No abrir dashboard, previews ni Quick Edit: pueden ejecutar JavaScript con GET
de API que registra visitas D1.

## Comandos y aceptación

Desde la copia o raíz del repositorio, sin dependencias npm:

```
node tests/healthcheck.test.mjs
node gateway-review.test.mjs
node scripts/healthcheck.mjs --offline
node --check scripts/healthcheck-lib.mjs
node --check scripts/healthcheck.mjs
node --check scripts/healthcheck-validators.mjs
```

gateway-review.test.mjs y gateway-active.mjs son evidencia local, no archivos
propuestos para publicar en el repositorio.

Sin --offline, el diagnóstico resuelve DNS e intenta HTTPS únicamente sobre
rutas confirmadas. Node valida cadena TLS y hostname; no desactivar validación.
Se cierra el cuerpo al recibir cabeceras: no se ejecutan HTML, JS ni service workers.
HTTP 200 y text/html requeridos. Vencimiento vencido FAIL; ausente o menor a
30 días WARN. Latencia hasta cabeceras sobre 3 segundos WARN.
nosniff se evalúa por valor; HSTS, CSP y Referrer-Policy por presencia.
No es una auditoría completa de políticas de seguridad.

Timeout 10 segundos, un reintento y dos redirecciones por intento.
Máximo 12 solicitudes del cliente por corrida para los dos endpoints, con posibles
subpeticiones del gateway a Pages. Ciclos y destinos no permitidos se bloquean.
No se informan cuerpos, cabeceras crudas, cookies, URLs externas ni errores externos.
PASS verifica solo controles ejecutados; SKIP no acredita salud.
FAIL sale 1; PASS/WARN/SKIP salen 0. Reporte JSON y resumen sanitizados.

API pública registra visitas D1 antes de resolver endpoints; por eso API, JSON,
frescura, ingesta, cron, D1, proveedores, CARTO y admin siguen SKIP.
Los validadores de arrays, identidad, timestamps UTC estrictos y frescura solo
reciben fixtures. No modifican AQI ni corrigen hallazgos de la auditoría.

## Resultados

39/39 pruebas del diagnóstico y validadores PASS; 4/4 simulaciones gateway PASS.
Sintaxis de los tres módulos OK. El modo offline no consulta DNS ni HTTP.
Las pruebas verifican confirmación individual, bloqueo de saltos no confirmados,
API y destinos externos antes del transporte, sanitización y exclusiones.

HTTP real intentado: 0 PASS, 1 WARN, 4 FAIL, 12 SKIP. DNS no resolvió
app.lemeit.ar ni api.lemeit.ar; los controles HTTPS devuelven ENOTFOUND.
Esto no demuestra caída del sitio. TLS, cabeceras y redirecciones reales
siguen pendientes. Node disponible 24.18.0; validación con Node 22 pendiente.
No se ejecutó JavaScript del dashboard, despliegue, ingesta ni acceso D1.

## Publicación y operación

Entorno Codex Cloud de lemeit/lemeit-aq no disponible entre los proyectos accesibles.
Entrega parcial local basada en archivos del conector GitHub, no checkout Cloud.
Cambios propuestos: scripts/healthcheck-lib.mjs, healthcheck.config.json,
tests/healthcheck.test.mjs y este documento. Worker, workflow y cron intactos.

El 2026-10-12, con autorización explícita del usuario, se cambió únicamente
Branch control de Pages purpleair-saladillo: Custom branches, inclusión *,
exclusión exacta feat/healthcheck-phase2a. Se guardó y reabrió el formulario:
la exclusión persistió. Producción main y sus despliegues automáticos siguen
habilitados; watch paths * intacto. No usar skip build como garantía de exclusión.
El Worker API muestra Builds → Git repository → Connect: no tiene Git conectado.
El workflow de ingesta solo tiene workflow_dispatch; no se ejecutó.

Tras autorización específica del usuario, se verificó el 2026-10-12 que
lemeit-gateway también muestra Builds → Git repository → Connect: sin Git conectado.
La versión activa sigue cda9475b, con despliegue manual Wrangler.
La revisión automática había rechazado esa lectura; la autorización posterior
permitió completarla sin abrir Quick Edit, previews ni el sitio AQ.
La rama de propuesta feat/healthcheck-phase2a está excluida de previews Pages.
Abrir el PR no autoriza fusionarlo: main conserva despliegue automático.
Revalidar HEAD y ajustes antes de cualquier publicación o fusión posterior.

El diagnóstico existente conserva su horario 09:17 UTC (06:17 Argentina).
La propuesta hará que la siguiente ejecución tras la fusión intente HTTP permitido.
No se ejecutó workflow remoto ni se amplió frecuencia de ingesta.

Riesgo: cambios en gateway/Pages invalidan la evidencia; retirar URLs confirmadas
hasta revisar la nueva implementación. WARN de cabeceras no acredita seguridad
completa; FAIL por destino bloqueado indica alcance incompleto.
Reversión: restaurar los cuatro archivos desde SHA base. No hay datos que revertir.
Toda publicación o reversión remota requiere comprobar disparadores antes del push.

