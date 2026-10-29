# Orden visual de tarjetas

Base inspeccionada: `2b3032976e49c5e75f2f4153f6803c522af3ecff`, coincidente con `origin/main` local y el main verificado por el agente coordinador mediante el conector GitHub el 29/10/2026. Comparación local con auditoría `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`: 19 commits adelante; 39 archivos cambiados, incluidos frontend/AQI, identidad AirGradient, schema y diagnóstico. No se certifica despliegue ni cierre de auditoría. El intento local de `git ls-remote` no pudo conectar con el proxy; la verificación de HEAD remoto corresponde al conector GitHub utilizado por el agente coordinador el 29/10/2026.

Se revisaron AGENTS, README, frontend, Worker, D1, workflows y scripts. El Worker registra visitas mediante `logVisita` para GET públicos antes de resolver `/api/ultimas`: no se consultó esa API ni proveedores. Las pruebas de ingesta existentes usan mocks y SQLite en memoria; no son ingestas reales.

## Evidencia e identidad

La evidencia estática de [inventario](INVENTARIO_ESTACIONES.md), transcrita de una consulta anterior de solo lectura, identifica AE-00/198617, AE-01/298687, AE-02/298701 y AE-03/298691 como **PurpleAir**, no AirGradient. AE-03 tiene `nombre='AE-03'` y `codigo=NULL`. AirGradient 900002 y 900003 no tienen AE. No se repitió la consulta D1. AE-04 reservado no tiene fila y no se agrega.

`loadSensors` consume `/api/ultimas`; su SQL no contiene ORDER BY. Antes, `renderGrid` iteraba el array recibido y Mapa iteraba su filtro con coordenadas. `buildSensorCardInner` muestra `institucion || nombre` como título, y `nombre` como subtítulo cuando difiere de institución; `codigo` no se mostraba ni se usaba para ordenar. El texto mostrado se conserva.

## Criterios de aceptación

1. Coincidencia completa, sensible a mayúsculas, `AE-` seguido de uno o más dígitos; se recortan espacios exteriores. Primero se busca en **nombre visible**; solo si no ofrece AE válido se busca en **codigo**. No se buscan fragmentos en institución ni textos como `AE-3 escuela`. Conflicto `nombre=AE-02/codigo=AE-99`: gana AE-02. El fallback puede ordenar por metadata no visible sin cambiar etiquetas.
2. Todos los AE válidos primero, independientemente del proveedor, por número ascendente: AE-2, AE-10, AE-100. Ceros iniciales equivalentes. Se comparan cadenas decimales normalizadas por longitud/valor, sin pérdida de precisión.
3. Después, sin AE: AirGradient, otros y desconocidos comparten grupo. Al final, sin AE y `proveedor === 'purpleair'` explícito. No se infiere proveedor por código, ausencia de código, rango de ID ni mediciones.
4. Desempate en cada grupo y número AE por `sensor_index` ascendente numérico. IDs no decimales/ausentes después de decimales, por cadena y comparación de código de caracteres; a igual valor numérico, cadena original; a igualdad total, posición original estable. Sin dependencia del locale.
5. Solo se ordena una copia para iterar tarjetas de Actuales y Mapa. No se mutan array ni objetos, IDs, proveedor, datos, selección por defecto, selectores ni orden de marcadores. La selección por defecto sigue usando el array original. Mapa conserva su filtro de coordenadas.
6. Lecturas ausentes, antiguas o frescas no intervienen en el orden; misma secuencia DOM en móvil/escritorio y ES/EN. No se agregan sensores que la API no entregue.

## Reproducción y validación

`python scripts/test-dashboard-card-order.py` carga primero el HTML de la base exacta con fixtures interceptados: reproduce AE-03 antes de AE-02 y PurpleAir sin AE antes de AirGradient. Luego carga el HTML modificado: comprueba orden esperado, array y selección originales, selectores, ES/EN, 390 y 1440 px y las tarjetas de `cargarMapa` real con adaptador Leaflet local. Service workers bloqueados; todas las solicitudes se responden con fixtures o se abortan, sin transporte productivo.

Ejecutado en Codex Cloud con Node v24.19.0, Python/Playwright y `/usr/bin/chromium`:

- `node --test tests/*.test.mjs`: 6 archivos PASS.
- `node tests/card-order.test.mjs`: 4 pruebas PASS; regresión, números, metadata incompleta, proveedores desconocidos, conflictos nombre/código, empates, no mutación y ausencia de lecturas.
- `node scripts/test-dashboard-format-pm25.cjs`: PASS, incluye compilación de todos los scripts inline.
- `python tests/data-integrity-python.audit.py`: PASS.
- `python scripts/test-dashboard-card-order.py`: PASS (Chromium requirió ejecución fuera del sandbox de procesos).
- `python scripts/test-dashboard-latest-measurement.py`: PASS, regresión previa del HTML real.
- `node scripts/healthcheck.mjs --offline --output work/card-order-healthcheck.json`: WARN solo por Node 24 frente a recomendado 22; 16 SKIP, 0 FAIL.
- `git diff --check`: PASS.

## Límites y publicación sin despliegue

El comparador se prueba con timestamp NULL y PM ausente. El renderizado existente falla con timestamp NULL; no se corrige en este cambio. La prueba de navegador usa timestamps antiguos y PM ausente. `/api/ultimas` parte de la vista de lecturas, por lo que sensores sin ninguna fila de lectura pueden no llegar al frontend: no se altera API ni se incorporan filas por otra vía. No se verificó producción, frescura, hardware ni librerías CDN reales; Leaflet está sustituido en la prueba de mapa.

El badge existente usa PurpleAir como fallback si falta proveedor. Se conserva por alcance (solo orden); el comparador nunca usa ese fallback como evidencia del proveedor. No se modificaron IDs persistidos, D1, Worker/API, historial, activos/inactivos ni reglas de selección.

Los workflows versionados no se disparan por push/PR: healthcheck tiene schedule/dispatch; ingesta tiene dispatch y cron comentado. La comprobación independiente del agente coordinador mediante el conector Cloudflare (GET /pages/projects) el 29/10/2026 acreditó Pages conectado a este repo con previews activas para ramas nuevas. Tras autorización explícita del usuario para excluir únicamente `fix/orden-visual-estaciones` y crear el PR, el agente coordinador añadió solo esa rama a `source.config.preview_branch_excludes` del proyecto `purpleair-saladillo` mediante PATCH. GET posterior del 29/10/2026 confirmó `exclusionVerified=true`, los demás campos de source intactos y latest/canonical deployment sin cambios. La rama queda lista para PR hacia main sin despliegue. HEAD main revalidado mediante el conector GitHub el 29/10/2026: `2b3032976e49c5e75f2f4153f6803c522af3ecff`, sin cambios respecto de la base; no requiere resolver conflictos. No se autoriza merge ni despliegue. No hubo ingestas reales, migraciones ni cambios de datos productivos.
