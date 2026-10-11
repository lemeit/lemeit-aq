# Auditoría técnica inicial — LEMEIT · AQ

**Origen:** informe de Codex proporcionado por el responsable del proyecto, 2026-10-10.  
**Commit auditado:** `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`.  
**Alcance:** revisión de código y comprobaciones locales con mocks y SQLite en memoria; sin ingestas reales, cambios versionados ni verificación operativa de producción.  
**Estado:** hallazgos reportados por auditoría; no equivalen a correcciones implementadas. La comparación de GitHub del 2026-10-10 encontró `main` idéntico al commit auditado.

## Arquitectura observada

- Cloudflare Worker único: ingesta, API, administración de visitas y proxy CARTO; rutas con/sin `/aq`.
- Cloudflare D1: sensores, lecturas, visitas, vista de últimas lecturas, índices y deduplicación por sensor/timestamp.
- API: sensores activos, últimas lecturas, historial relativo/absoluto, CSV; CORS abierto deliberadamente.
- Administración: visitas protegidas con `ADMIN_KEY`.
- PurpleAir: ingesta JS/Python, conversión °F/°C, variables ambientales, canales A/B.
- AirGradient: dos tokens, filtro de ubicaciones, IDs sintéticos, CO2, VOC y NOx.
- Frontend: dashboard estático, mapas, gráficos, comparación, historial, exportación CSV/PDF, temas, idiomas y PWA.
- Operación: Wrangler, Pages documentado, migraciones manuales.

Decisiones favorables observadas: separación entre sensores e historial, SQL parametrizado y secretos de proveedores del lado servidor.

## Hallazgos prioritarios

| ID | Prioridad | Hallazgo / evidencia reportada | Corrección propuesta | Estado |
|---|---|---|---|---|
| AQ-01 | P1 | AQI devuelve 300 para 12,05 y 35,45 µg/m³ y valores negativos; reproducción de función aislada | Validar entradas, fijar metodología/precisión y fronteras; aclarar que una lectura instantánea no equivale a NowCast/promedio regulatorio | Detectado, no corregido |
| AQ-02 | P1 | AirGradient: `MAX(sensor_index)+1` separado del upsert permite colisiones y reasignación de serial; intercalación sintética | Identidad única proveedor/serial, asignación atómica y migración conservadora de historial | Detectado, no corregido |
| AQ-03 | P1 | `limit=-1` llega a SQLite y elimina límite en historial y visitas administrativas | Validar enteros positivos, máximos efectivos y responder HTTP 400 | Detectado, no corregido |
| AQ-04 | P1 | `/api/sensores` filtra activos pero `/api/ultimas` no; reproducción SQLite | Filtrar lecturas del dashboard sin romper contrato histórico | Detectado, no corregido |
| AQ-05 | P1 | Cobertura automática AirGradient no demostrada: disparador documentado `/api/ingest-ahora` solo ingesta PurpleAir; cron del README descrito como inoperante | Auditar configuración y logs autorizados; evitar dobles llamadas; no activar cron sin autorización | Pendiente de verificación operativa |
| AQ-06 | P1 | Posible XSS almacenado por interpolación sin escape de nombres, instituciones y mediciones en HTML; no se explotó | Usar `textContent` o escape contextual y pruebas con cadenas hostiles | Riesgo detectado, explotación no probada |
| AQ-07 | P2 | `hasta=2026-10-10` excluye horas de ese día; reproducción SQLite | Definir UTC y límite superior exclusivo del día siguiente | Detectado, no corregido |
| AQ-08 | P2 | Python sobrescribe nombres; Worker los conserva | Unificar política de metadatos con fixtures | Detectado, no corregido |
| AQ-09 | P2 | Mapa mantiene color de lecturas antiguas; tarjetas no envejecen tras error de red | Recalcular frescura localmente y aplicarla a tarjetas, marcadores y popups | Detectado, no corregido |

## Otros riesgos de ingesta, API y seguridad

- La deduplicación de filas no evita consultas duplicadas ni consumo de cuota. No se documentó coordinación de ejecuciones concurrentes; Cloudflare Cron y cron-job.org podrían solaparse.
- `guardados` puede contar operaciones ignoradas por `INSERT OR IGNORE`; AirGradient puede contar lecturas sin timestamp.
- AirGradient puede devolver éxito parcial tras errores de token; `scheduled()` no inspecciona resultados `{ok:false}`.
- Faltan timeouts explícitos, validación robusta de payloads y normalización amplia de timestamps.
- Sin `AIRGRADIENT_LOCATION_IDS`, se incorporarían todas las ubicaciones visibles: se propone fallo cerrado.
- Métodos HTTP sin restricción explícita: se reprodujo `POST /api/sensores` con respuesta 200.
- `SELECT *` expone potencialmente notas y seriales; definir columnas públicas.
- Exportación CSV sin mitigación de fórmulas en campos de texto.
- GET públicos registran visitas, incluso rutas desconocidas; evaluar retención y abuso.
- Proxy CARTO público consume cuota; validar coordenadas/zoom y protecciones.
- Claves compartidas por cabecera sin limitación adicional observada en código; controles Cloudflare externos no auditados.
- Los secretos están referenciados, no incrustados en los archivos revisados; no se verificaron vigencia, permisos o rotación.

## D1, mantenimiento y frontend

- Tres migraciones duplicadas en raíz y `d1/`; SQL equivalente salvo comentarios.
- Ingesta PurpleAir duplicada JS/Python y funcionalmente divergente.
- Dos índices de lecturas solapan columnas; medir antes de eliminar.
- Afirmación de eficiencia de `GROUP BY + MAX(timestamp)` no demostrada por plan local; medir en D1.
- `schema.sql` contiene esquema completo y las migraciones agregan columnas ya presentes: documentar caminos excluyentes para bases nuevas/existentes.
- `index.html` ~3300 líneas y Worker ~517 líneas: modularización posterior.
- Sin suite automatizada, CI de validación, manifiesto/lockfiles identificados; `requests` sin versión fija.
- Service worker elimina otras cachés del origen e intercepta recursos más allá del app shell.
- README afirma observabilidad habilitada, pero `wrangler.toml` no incluye bloque correspondiente.

## Integración con design.lemeit.ar

Se observó uso de CSS, `LemeitCommon.initSwitcher`, `renderFooter` y logos externos. El helper descargado tenía ambas funciones. `curl` devolvió 200 para CSS y JS (Ray IDs `a4896852cb045901-LAX`, `a4896854da7e2f62-LAX`); Python devolvió 403 para esos recursos y tres logos. No concluir bloqueo permanente. Chromium previamente cargó con TLS válido bajo permisos ampliados; entorno restringido presentó problema de confianza TLS. Recursos sin versionado ni SRI/CSP versionada; verificar cabeceras efectivas de Pages. URL principal jsPDF en cdnjs devolvió 404 durante validación previa y alternativa jsDelivr funcionó.

## Validaciones y límites de evidencia

La auditoría reportó sintaxis correcta del Worker, service worker y Python. Las reproducciones confirmadas fueron locales y no afectaron producción. **No se verificaron** cron-job.org, Cloudflare Cron, migraciones desplegadas, secretos, reglas externas ni cabeceras efectivas de Pages. Antes de cada corrección, volver a inspeccionar HEAD, reproducir y registrar pruebas.

Ver también [PLAN_MEJORAS.md](PLAN_MEJORAS.md).
