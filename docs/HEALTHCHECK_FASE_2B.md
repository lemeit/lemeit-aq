# Healthcheck: fase 2B con destino bloqueado

Fecha: 2026-10-12 (Argentina). Propuesta para PR correctivo; no fusionar ni desplegar.

## Estado y alcance

GitHub confirma PR #5 fusionado y main en 1cecac815d4057d7a12987a72aa0735cd3051874. Ese cambio permite /aq/api; la instrucción vigente exige bloquearlo. Esta corrección restaura la lista cerrada y el diagnóstico sanitizado. No modifica Worker, D1, frontend, cron ni workflows.

## Reproducción y aceptación

El fixture de 308 desde /aq/api.html a /aq/api exige FAIL api-docs, blockedDestination=/aq/api y redirectStatus=308. Solo se solicita la ruta inicial; ninguna configuración habilita el destino. No se registran Location arbitrarios, queries ni URLs externas. HSTS/CSP ausentes siguen WARN y controles operativos SKIP=12.

Se conserva agente HTTPS por solicitud, keepAlive=false y maxCachedSessions=0, liberado al cerrar, con validación de cadena y hostname. Las cuatro regresiones comprueban bloqueo, sanitización, TLS y preservación de WARN.

## Validación

Desde la raíz: node tests/healthcheck.test.mjs; node --check scripts/healthcheck-lib.mjs; node --check tests/healthcheck-phase2b.test.mjs; node scripts/healthcheck.mjs --offline.

Copia recuperada: 43/43 PASS locales con Node 22.23.3 y Node 24. No equivalen a ejecución Actions ni verificación actual de producción. Offline no hace HTTP ni DNS. No se ejecutaron ingestas ni consultas de producción en esta revisión.

## Publicación y reversión

PR #5 cerrado: requiere nuevo PR sobre main actual y revalidación de todos los disparadores y exclusión Pages. No cambiar branch control, fusionar ni desplegar sin autorización específica. Publicación autorizada solo en feat/healthcheck-phase2b, contra main.

Revertir el futuro commit de corrección recupera el comportamiento anterior; no hay datos que revertir. Más handshakes TLS, sin cambios de frecuencia ni dependencias.

## Revisión previa de disparadores

Pages revalidado en esta sesión: Custom branches, inclusión *, exclusiones feat/healthcheck-phase2a y feat/healthcheck-phase2b. Sin Deploy Hooks. GitHub Pages deshabilitado; lista de webhooks vacía. Workflows versionados sin push/pull_request. Gateway muestra Builds / Git repository / Connect: sin repositorio conectado.

GitHub Apps: ChatGPT Codex Connector, Cloudflare Workers and Pages y Ona integrations. Tras reautenticación, Ona muestra No projects en el Workspace 345 de Luciano Lamaita y automatizaciones no disponibles en el plan actual. Worker API muestra Builds / Git repository / Connect: sin Git conectado. No se modificaron disparadores. Main tiene seis commits por delante de la auditoría y cero por detrás; Worker, D1 y frontend sin cambios en esa comparación.
