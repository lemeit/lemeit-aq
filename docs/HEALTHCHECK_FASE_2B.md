# Healthcheck: fase 2B

Fecha: 2026-10-12 (Argentina). Rama: `feat/healthcheck-phase2b`.
Base main revalidada: `45368cc295858403f47f22c896d2ecd15264a1f1`.
Cinco commits por delante y cero por detrás de la auditoría
`c03d7d0dca68772f3d1ea3312d797fe48f038f9c`; Worker, D1 y frontend sin cambios
en esa comparación. Se leyeron AGENTS.md, README, Worker, Wrangler, esquema D1,
workflows y scripts. Entorno Codex Cloud no disponible: preparación en checkout
local completo, pruebas y propuesta vía GitHub, sin sustituir archivos sources/.

## Defectos y reproducción

Run https://github.com/lemeit/lemeit-aq/actions/runs/38268837511, reporte
2026-10-12T15:15:15.182Z: PASS 5, WARN 2, FAIL 1, SKIP 12; 39 pruebas PASS.
`api-docs` falla DESTINATION. Una lectura real sin seguir redirects confirmó
HTTP 308 con Location `/aq/api` en `/aq/api.html` a las 15:21:10 UTC.
La lista cerrada anterior bloquea esa normalización antes de solicitar el destino.
Pages documenta `.html` hacia la ruta sin extensión:
https://developers.cloudflare.com/pages/configuration/serving-pages/.

Se reprodujo el WARN de expiración con dos GET a `/aq/`: el primero obtiene
valid_to; el segundo reanuda sesión TLS y devuelve certificado vacío. Con agente
independiente sin caché de sesiones se obtiene valid_to. Vencimiento observado:
`Dec 23 16:15:20 2026 GMT`. La reproducción inicial fue Node 24.18.0; el log
histórico del runner Node 22 no registra si su sesión se reanudó, por lo que
no se afirma que ese dato histórico haya sido observado directamente.

## Enrutamiento verificado sin ejecutar HTML/JS

El navegador accedió a la cuenta correcta de Cloudflare. Overview del gateway
mostró `cda9475b` al 100%, Ready, despliegue manual Wrangler: la misma versión
cuya copia de código se revisó previamente (`phase2a-ready/gateway-active.mjs`,
evidencia local fuera del PR). No se abrió Quick Edit ni previews. Esa copia
obtiene `/api` del origen `purpleair-saladillo.pages.dev` para `/aq/api`, sin
llamar API AQ ni D1. Se releyó la copia; no se presenta como una nueva
descarga del código activo. La versión visible revalida la evidencia anterior.

Workers Routes de la zona mostró las siete rutas completas: `app.lemeit.ar/*`
apunta únicamente a lemeit-gateway; API AQ usa `api.lemeit.ar/aq/*`, distinto
hostname. No hay ruta más específica para `/aq/api`. Gateway sin bindings.
Pages producción observada en commit `45368cc...`; árbol Git sin Functions,
`_headers`, `_redirects` ni `_routes.json`. `api.html` es un stub con meta refresh
y location.replace hacia index.html?tab=api: el diagnóstico no sigue ninguna de
esas navegaciones del HTML, ni ejecuta JS ni service workers.

## Cambio implementado

- Añadir únicamente `https://app.lemeit.ar/aq/api` a la lista cerrada y a las
  confirmaciones individuales. Rutas vecinas, queries, externos, Pages directo,
  API, credenciales y downgrade permanecen bloqueados antes del transporte.
- Usar un agente HTTPS independiente por solicitud: keepAlive=false,
  maxCachedSessions=0; liberar al cerrar. Conservar cadena/hostname validados.
- Cinco regresiones añadidas, cargadas desde la prueba existente, sin modificar
  workflow ni horario. Confirmación individual sigue obligatoria para cada salto.

## Cabeceras reales y alcance

En `/aq/` y en la respuesta final 200 de `/aq/api`: Content-Type
`text/html; charset=utf-8`, X-Content-Type-Options `nosniff`, Referrer-Policy
`strict-origin-when-cross-origin`; HSTS y CSP ausentes. En el 308 de api.html,
Referrer-Policy presente; Content-Type, nosniff, HSTS y CSP ausentes. Los WARN
se mantienen; no se cambió ninguna política de producción ni se relajó TLS.
El control mide cabeceras del salto final, no seguridad completa de la aplicación.
HTTP 200 de api-docs acredita el stub estático, no la documentación renderizada.

API/JSON/frescura/proveedores/ingesta/cron/D1 y demás controles operativos
siguen SKIP (12). No se ejecutó GET a API, ingesta, migración ni escritura D1.
No se recolectan cuerpos ni cabeceras crudas en los reportes.

## Pruebas y aceptación

```
node tests/healthcheck.test.mjs
node --check scripts/healthcheck-lib.mjs
node --check scripts/healthcheck.mjs
node --check scripts/healthcheck-validators.mjs
node --check tests/healthcheck-phase2b.test.mjs
node scripts/healthcheck.mjs --offline
```

Base: 39/39 PASS. Propuesta Node 24: 44/44 PASS. Pruebas verifican 308->200,
confirmación individual, bloqueo de rutas vecinas/externos/API/queries, liberación
del agente, TLS estricto y preservación de WARN por cabeceras o expiración ausente.
Sintaxis y diff correctos. Offline no hace HTTP/DNS: 0 PASS, 1 WARN (Node24),
0 FAIL, 16 SKIP, salida 0. Diagnóstico real Node24: 8 PASS, 3 WARN, 0 FAIL,
12 SKIP; páginas y vencimientos PASS, cabeceras y versión Node WARN, salida 0.
Node 22.23.3 oficial: 44/44 PASS desde la raíz del checkout; sintaxis correcta.
Offline: 1 PASS, 0 WARN, 0 FAIL, 16 SKIP, salida 0. Diagnóstico real Node22:
9 PASS, 2 WARN (HSTS/CSP en ambos endpoints), 0 FAIL, 12 SKIP, salida 0;
latencias 227 ms Pages y 211 ms api-docs en esta muestra, sin valor de benchmark.
Un intento inicial desde el directorio padre falló solo en la prueba CLI por
cwd incorrecto; desde la raíz pasó sin cambios de código. npm exec invocó
Node24 en este equipo; se usó el binario oficial Node22 descargado por separado,
sin agregar dependencias al repositorio.

## Publicación sin despliegue

Usuario autorizó preparar fase 2B sin desplegar ni fusionar, y autorizó excluir
exactamente esta rama de previews. Pages revalidado: Custom branches, inclusión
`*`, exclusiones `feat/healthcheck-phase2a` y `feat/healthcheck-phase2b`. Exclusión
guardada y reabierta; persiste. Main y despliegues automáticos intactos, watch
paths `*` intacto. Gateway y Worker API muestran Builds/Git repository/Connect:
sin Git conectado. Workflows versionados no tienen push ni pull_request;
ingesta solo workflow_dispatch, healthcheck schedule/dispatch. No se ejecutaron.
No usar skip build como garantía. Verificar Pages skipped al publicar.

## Riesgos y reversión

Más handshakes TLS, sin nueva frecuencia ni dependencias de aplicación. Se puede
alcanzar un salto adicional ahora confirmado, dentro del máximo previo de 12
solicitudes por corrida y los mismos timeout/reintentos. Si cambia gateway,
retirar confirmaciones hasta nueva revisión. Restaurar archivos desde SHA base
revierte la propuesta; no hay datos que revertir. Toda fusión o reversión remota
sobre main exige autorización porque activa despliegue automático.
