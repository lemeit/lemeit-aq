# Healthcheck: fase 2C

Fecha: 2026-10-12 (Argentina). Base: `ae6a6881743d54fd7d7572f7d3b65b6ce9767a86`.
Main está siete commits por delante y cero por detrás de la auditoría
`c03d7d0dca68772f3d1ea3312d797fe48f038f9c`. Worker, D1 y frontend sin cambios
en esa comparación. Revisados AGENTS.md, README, scripts, tests, ambos workflows,
Worker/Wrangler, esquema D1 y documentación. Codex Cloud no figura disponible
entre proyectos accesibles; archivos recuperados de GitHub por SHA, pruebas locales.

## Defecto reproducido

Actions [38315026512](https://github.com/lemeit/lemeit-aq/actions/runs/38315026512):
43 pruebas PASS, diagnóstico 6 PASS / 1 WARN / 1 FAIL / 12 SKIP.
`api-docs` falla DESTINATION ante 308 de `/aq/api.html` a `/aq/api`.
Fixture base reproduce el bloqueo antes de solicitar el destino.

## Evidencia de seguridad

Evidencia de solo lectura aportada por Work: código descargado del gateway activo
`lemeit-gateway`, deployment `9edee30c-6466-4665-84df-17e678f16d8d`, versión
`cda9475b-faea-4754-bb95-ecd21348753a` al 100%, sin bindings. `/aq/api` obtiene
`purpleair-saladillo.pages.dev/api`, sin API AQ ni D1. Work verificó ausencia de
Page Rules, Bulk Redirects y reglas aplicables de redirección, transformación u origen.
Esta sesión revalidó vía Cloudflare API el deployment, versión, bindings vacíos y
las siete rutas de zona: `app.lemeit.ar/*` va al gateway, sin ruta más específica.

Pages revalidado: deployment `48a1dc8a-9380-4482-b30f-e7ed541da63a`, SHA base,
sin Functions ni comando build. Árbol Git incluye `api.html`, sin `_redirects`,
`_routes.json` ni Functions. El stub contiene meta refresh y JavaScript hacia el
portal; nunca renderizarlo ni ejecutar su contenido. Solo se leen cabeceras y
se destruye el cuerpo. Un HTTP 200 acredita el stub, no la API ni documentación renderizada.

## Cambio y aceptación

- Añadir exclusivamente `https://app.lemeit.ar/aq/api` a lista cerrada y confirmación.
- Mantener confirmación individual antes de cada transporte y salto.
- Bloquear vecinos, queries (incluso vacías), fragmentos, aliases de URL inicial,
  API, origen Pages directo, externos y downgrade, aunque se amplíe configuración.
- Conservar TLS/hostname estrictos, agente por salto sin caché TLS, timeout 10 s,
  un reintento y máximo dos redirects. Máximo 12 solicitudes por corrida.
- JSON sin cuerpos, cabeceras crudas, cookies, Location arbitrarios ni secretos.
- Mantener 12 SKIP operativos: API, JSON, frescura, TLS API, proveedores, CARTO,
  admin, ingesta, cron y D1. SKIP no acredita salud del componente.

## Validación local verificada

Node 22.23.3: 47/47 pruebas PASS; sintaxis del motor y tests 2C correcta.
Offline: 1 PASS / 0 WARN / 0 FAIL / 16 SKIP; no DNS ni HTTP.
Diagnóstico real autorizado: 9 PASS / 2 WARN / 0 FAIL / 12 SKIP, salida 0.
Ambos endpoints HTTP 200; `api-docs` siguió un 308 al destino exacto confirmado.
Cadena/hostname TLS y vencimiento PASS. HSTS y CSP ausentes: WARN conservados.
Latencias de muestra 484 ms Pages y 283 ms stub; no son benchmark.
El primer intento bajo sandbox devolvió ENOTFOUND; con red autorizada fue exitoso.
No se ejecutó HTML/JS, GET de API, consulta D1, ingesta ni migración.

Comandos desde raíz: `node tests/healthcheck.test.mjs`,
`node scripts/healthcheck.mjs --offline`, `node scripts/healthcheck.mjs`.
El workflow existente usa Node 22, contents:read y artefacto sanitizado de 14 días.

## Publicación, impacto y reversión

Usuario autoriza push, PR, Actions, merge y cierre del diagnóstico. Previo al push
se añadió únicamente `feat/healthcheck-phase2c` a exclusiones Pages existentes;
lectura posterior confirma Custom, inclusión `*`, exclusiones 2A/2B/2C, producción
automática y watch paths intactos. Deployment canónico permaneció en SHA base.
Workflows no disparan por push/PR; ingesta solo workflow_dispatch y no se ejecuta.
La fusión a main dispara Pages automáticamente: alcance limitado a diagnóstico,
tests y docs; HTML, JS del sitio, Worker, D1 y configuración de aplicación intactos.
Pages publica desde raíz sin build: los archivos del diagnóstico/documentación
son públicos; contienen solo código y evidencia pública sanitizada.

Reversión: revertir el commit de esta fase por PR devuelve el bloqueo y FAIL del
stub, sin datos que restaurar; main dispara Pages también al revertir.
Si gateway, reglas o Pages cambian, retirar confirmaciones hasta revisar evidencia.
HSTS/CSP quedan para corrección separada. No declarar salud de ingesta/frescura/API.
Próximos temas: AQ-03 límites API, AQ-04 inactivos y AQ-06 XSS según PLAN_MEJORAS;
AQI e identidad AirGradient siguen pendientes de sus propias verificaciones.

## Verificación remota previa a integración

PR [#7](https://github.com/lemeit/lemeit-aq/pull/7), rama `feat/healthcheck-phase2c`.
Actions [38317388422](https://github.com/lemeit/lemeit-aq/actions/runs/38317388422)
sobre `6231874bff93ae874f94d53b0e7a898807b96d07`: success, Node 22.23.3,
47/47 PASS, diagnóstico 9 PASS / 2 WARN / 0 FAIL / 12 SKIP. Artefacto sanitizado
`11776957159`, carga exitosa. Todos los pasos del job completados correctamente.
Pages confirmó push `0e633317` skipped, registro `86e3e3d2-aac6-439e-b0e3-6df3b550819c`;
producción permaneció en `48a1dc8a`. La comparación remota confirma exactamente
8 archivos scripts/tests/docs/config del diagnóstico; frontend/Worker/D1/workflows intactos.
Se autoriza integración bajo el alcance del usuario; verificar main tras fusionar.
