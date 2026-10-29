# PurpleAir: alta segura, versiones e incidente AE-03

## Incidente confirmado por el titular

AE-03 (Instituto Niño Jesús, PurpleAir PA-II-FLEX, sensor_index 298691, device ID `fc:f5:c4:ae:ca:d6`) ya quedó registrado en D1 y visible en el portal. Al usar **Rotate** sobre `SENSOR_INDEXES` se creó una nueva versión del Worker, pero faltaba promoverla para activar la lista actualizada. La solución informada fue promover/desplegar esa versión. No se conoce aquí el ID de la versión previa al incidente ni se reconstruyó su secreto.

La consulta de solo lectura confirma registro y lectura reciente, además de un deployment activo; no demuestra retrospectivamente el valor del secreto ni la secuencia exacta de acciones. Ver [evidencia e inventario](INVENTARIO_ESTACIONES.md).

**Reproducción conceptual del defecto, sin producción:** una versión activa A conserva la lista anterior; Rotate prepara B con el nuevo sensor, pero B no está desplegada. Las ejecuciones de A siguen usando la lista anterior. Crear B no equivale a activarla. No se reprodujo mediante una rotación real.

## Procedimiento para una futura alta

Este procedimiento no autoriza operaciones de producción. Registrar aprobación explícita antes de escribir D1, rotar secretos, desplegar, modificar disparadores o ejecutar ingestas reales.

1. Identificar Worker, ambiente, base/binding y versión activa. Revisar código y disparadores reales; no reactivar respaldos por defecto. Registrar sensor físico con proveedor, institución, modelo, device ID, sensor_index y código AE único en el inventario aprobado; comprobar si ya existe antes de cualquier alta en D1. Preservar historial. En el Worker actual, el primer ingest puede crear metadata: planificar la carga/corrección institucional para no duplicar filas.
2. **Respaldar de forma privada la lista completa vigente de `SENSOR_INDEXES`**, desde el registro seguro del titular. Cloudflare no devuelve el valor de un secreto guardado. Si no existe respaldo fiable, detener la rotación y reconstruir con el titular la lista autorizada; D1 contiene históricos/inactivos y no sustituye por sí sola la lista activa. Guardar también IDs de deployment/versiones y configuración necesaria para reversión.
3. Preparar la lista completa resultante, conservando todos los sensores autorizados anteriores y agregando el nuevo una sola vez. Validar índices, separadores y proveedor. No reemplazar a ciegas el secreto por el índice nuevo ni copiar automáticamente la tabla de inventario. Los IDs sintéticos AirGradient no pertenecen a esta lista. Nunca mostrar el valor en chats, commits, capturas, comandos con argumentos visibles ni logs.
4. Con autorización, rotar `SENSOR_INDEXES` por el canal seguro del entorno correcto. **En el flujo Rotate de este incidente, rotar por sí solo no activó la versión nueva**. Revisar la versión creada y promoverla/desplegarla explícitamente, comprobando el deployment y porcentaje efectivo. No desplegar código local ajeno como efecto accidental. Distinguir versión subida de versión activa.
5. Comprobar la siguiente ejecución del disparador existente mediante logs ya generados, sanitizados. No lanzar una ingesta manual sin permiso separado. Confirmar que se incluyó el nuevo sensor y que los anteriores siguen cubiertos; un contador de “guardados” no prueba filas nuevas, por deduplicación y contadores actuales (AQ-10).
6. Consultar D1 directamente con SELECT: metadata, proveedor, código, última lectura y avance de timestamp para el nuevo y los anteriores. No dar por online a un sensor solo por tener una fila o `activo = 1`. Preservar la distinción entre registro, instalación física y conectividad.
7. Comprobar API (`/api/sensores`, `/api/ultimas`, histórico del sensor) y dashboard (institución, código, proveedor, frescura y ausencia de duplicados) **solo con autorización para las escrituras de visitas que esos accesos generan**. Mientras rija solo lectura estricta, dejar esos controles pendientes y usar D1/metadatos. No presentar esta omisión como éxito de API/UI.
8. Registrar fecha, responsable, versión activa, resultados por sensor, limitaciones y aprobación. No aumentar frecuencia ni consumo por duplicar disparadores. El secret homónimo de GitHub Actions es independiente del Worker: si se prevé usar ese camino, revisar su lista en una operación autorizada; no reactivar el schedule ni sincronizarlo automáticamente.

El código de `main` pasa `env.SENSOR_INDEXES` a `show_only`. El endpoint `POST /api/ingest-ahora` ejecuta solo PurpleAir; `scheduled()` invoca ambos proveedores. El estado histórico del cron externo no verifica cobertura AirGradient (AQ-05 pendiente).

## Matiz entre herramientas

No generalizar que toda actualización de secretos requiere promoción manual: [Cloudflare Secrets](https://developers.cloudflare.com/workers/configuration/secrets/) distingue `wrangler secret put` (crea versión y la despliega inmediatamente) de `wrangler versions secret put` (solo crea versión, requiere despliegue posterior). El dashboard también tiene un paso Deploy. Esta guía describe el fallo observado con Rotate y exige comprobar la versión efectiva en todos los casos. No ejecutar estos comandos como parte de una revisión documental.

## Reversión autorizada

Antes del cambio, identificar versión estable y compatibilidad con schema/bindings actuales, y mantener respaldo privado de la lista anterior. Si desaparecen sensores previos, no avanza la ingesta o hay errores tras activar la versión, detener nuevas modificaciones y decidir reversión con el responsable.

Con autorización explícita, volver a una versión estable compatible mediante Deployments/Rollback y comprobar el deployment efectivo. Cambios de secretos pueden bloquear el retorno a versiones anteriores: no forzar ni eludir validaciones; si ocurre, preparar una versión compatible con la lista anterior respaldada y desplegarla solo tras aprobación. No recuperar claves revocadas. [Cloudflare Rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/) aclara que revertir Worker no restaura D1 ni otros recursos conectados.

No borrar AE-03, lecturas ni sensores históricos para revertir la configuración. Verificar con SELECT y logs existentes que los sensores previos siguen cubiertos; API/UI requieren el permiso señalado. Registrar motivo, versión final y controles. Para revertir solo esta documentación, revertir el commit del PR mediante otro PR; no hay cambios de schema ni runtime asociados.

## Validación y criterios de aceptación documental

- Inventario único coherente con titular y corte D1, incluidos AE-04 reservado, dos AirGradient y `codigo` pendiente de AE-03.
- README enlaza inventario y procedimiento; sus conteos históricos no se presentan como estado actual.
- Se explican respaldo completo, reemplazo del valor, activación efectiva, controles de ingesta/D1/API/UI y reversión sin exponer secretos.
- Se distingue confirmación del usuario, verificación directa y controles pendientes.
- Diff limitado a Markdown; enlaces relativos comprobados contra el árbol del repositorio; no cambios en código, workflows, schema, frecuencia ni configuración.
- No se acredita solución de AQ-03/04/05/06, migración 009 ni despliegue del HEAD por la incorporación de AE-03.
