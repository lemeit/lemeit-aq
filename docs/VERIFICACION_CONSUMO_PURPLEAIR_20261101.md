# Verificación de consumo y disparadores PurpleAir — 01/11/2026

## Alcance y evidencia
Revisión **sin ingestas, consultas a PurpleAir, escrituras D1 ni despliegues**. Base de código: `main` en `c5e5d52a247013b6359a640a36064856bae46cf0`. Las observaciones de paneles fueron comunicadas por el titular; no se verificaron mediante acceso directo a esas cuentas.

### Confirmado por código versionado
- `POST /api/ingest-ahora` comprueba `X-Ingest-Key` y llama una vez a `ingest(env)` (`worker/src/index.js`, aprox. líneas 461–468).
- `ingest()` llama una vez a `fetchPurpleAirData()` (aprox. línea 115), que realiza **un `fetch`** a `https://api.purpleair.com/v1/sensors` con `fields` y `show_only=env.SENSOR_INDEXES` (líneas 51–63). No hay reintentos ni llamadas dentro del bucle de sensores. **Una invocación normal al endpoint equivale a una solicitud HTTP de mediciones a PurpleAir**; no certifica las reglas de facturación del proveedor.
- Cada fila se procesa en D1 usando `INSERT OR IGNORE`. `guardados++` aumenta al finalizar sin error la operación, incluso si el `INSERT` fue ignorado por duplicación; el valor no demuestra inserciones efectivas.
- `.github/workflows/purpleair-ingest.yml` tiene `schedule` comentado; `workflow_dispatch` permanece habilitado.
- `worker/wrangler.toml` **aún declara** `[triggers] crons = ["3,18,33,48 * * * *"]`; ello no demuestra que exista un trigger activo en la configuración desplegada.

### Observado en paneles (informado por el titular)
- cron-job.org, trabajo «Ingesta PurpleAir Saladillo»: historial del 01/11/2026 con ejecuciones a **:27 y :57** (intervalos de 30 minutos). Las 23 ejecuciones finalizadas visibles entre 04:27 y 15:27 figuran **200 OK**; las posteriores eran «Programado». Se observa la cadencia, pero no se verificó directamente su programación.
- Cloudflare, sección **Trigger events → Cron triggers**: «No cron triggers configured». Estado puntual observado; distinto de la declaración en `wrangler.toml`.
- PurpleAir Developer, organización del titular, intervalo **02/10/2026–01/11/2026**: saldo **19.992.888 puntos**, **11.228 llamadas**, **967.088 puntos usados**, 2 API keys habilitadas (lectura/escritura). «Recent Usage» de la clave de lectura: 101.232 puntos; escritura «No Data». No confundir uso reciente con total del período. La donación comunicada por PurpleAir fue de 20 millones de puntos.
- Los identificadores de API keys no se reproducen aquí; no se guardan secretos.

## Interpretación y límites
- A intervalos de 30 minutos, cron-job.org produciría unas **48 invocaciones/día** si mantiene la cadencia 24 horas y no hay omisiones. Según el código, cada invocación normal genera una solicitud de mediciones a PurpleAir.
- **Aclaración de cronología aportada por el titular:** la reducción de frecuencia a **30 minutos** se efectuó el **29/10/2026** y se decidió **mantener esa frecuencia**. Ese mismo día el titular solicitó puntos adicionales a PurpleAir explicando el alcance educativo del proyecto. El período agregado 02/10–01/11 incluye mayormente días anteriores a esa optimización. Su promedio de **~374 llamadas/día** (11.228 / 30) **no es comparable directamente** con las ~48 ingestas/día actuales; la discrepancia no constituye por sí misma un indicio de consultas adicionales, duplicación ni consumo anómalo. La fecha del cambio procede del testimonio del titular y aún no se corroboró con historial versionado; la evolución diaria del uso tampoco se verificó.
- El HTTP 200 del cron acredita la respuesta del endpoint, **no** las inserciones efectivas de filas nuevas, la frescura ni el correcto AQI.
- El ritmo histórico de 967.088 puntos / 30 días equivale a ~32.236 puntos/día. A ese ritmo, un saldo de 19.992.888 permitiría ~620 días; proyección, no garantía.
- El README anterior describía cron-job.org en :12/:27/:42/:57 y Cron Trigger de Cloudflare registrado. Son **antecedentes históricos**, no el estado observado el 01/11/2026.

## Estado comunicado de los monitores
Al 01/11/2026, el titular informa que había tres monitores encendidos alrededor del cambio del 29/10: uno ya desplegado que sigue reportando y dos en su domicilio aún pendientes de despliegue, apagados desde aproximadamente el 30/10 (fecha aproximada). Esta situación no certifica por sí sola la cobertura real de la red ni el estado de todas las estaciones inventariadas. Los monitores apagados no producirían nuevas observaciones, pero **la ingesta puede seguir solicitando a PurpleAir los sensores incluidos en `SENSOR_INDEXES`** y consumir puntos; el proveedor puede devolver su última muestra con timestamp antiguo, que `INSERT OR IGNORE` no duplica.

## Riesgo pendiente: configuración de Cron Cloudflare
La ausencia de Cron Triggers en el panel contrasta con `worker/wrangler.toml`, donde siguen declarados. **Antes del siguiente despliegue**, reconciliar de forma autorizada la configuración declarativa con el estado deseado para no reactivar accidentalmente un disparador extra. No se modifica `wrangler.toml` en este PR.

## Siguientes verificaciones (solo lectura, sin gastar puntos de mediciones)
1. Verificar en el historial de PurpleAir el **consumo diario anterior y posterior a la reducción de frecuencia de fines de octubre**, y contrastarlo con la fecha precisa del cambio (si hay registros). Solo si persisten diferencias dentro de un período homogéneo, investigar desglose por clave/endpoint; no invocar endpoints de mediciones.
2. Confirmar directamente la configuración del job de cron-job.org (:27/:57), el período cubierto por los logs y que no hay otros jobs que invoquen la misma ingesta.
3. Revisar registros ya existentes en Cloudflare (sin invocar endpoints) y métricas de frescura de lecturas para contrastar HTTP 200 con ingestas efectivas.
4. Coordinar cualquier modificación de programación y cobertura AirGradient con la auditoría de ingesta del chat 02.

## Cambios realizados
Solo documentación. No hay modificaciones de código, disparadores, secrets, DB ni producción. No se ejecutaron pruebas de integración que consuman puntos. Aceptación documental: datos y fecha explícitos, evidencia distinguida de inferencias, sin secretos y enlaces a los archivos fuente.

## Conciliación de la configuración versionada — 02/11/2026

El titular autorizó preparar la conciliación del cron en el repositorio, mediante rama y PR, sin fusionar ni desplegar. Base revisada: `798a3026f431109d0c8e918363398d99b00c4582`. Las secciones anteriores conservan el diagnóstico histórico del 01/11.

**Defecto reproducido offline:** la configuración base declara cuatro ejecuciones por hora (`3,18,33,48 * * * *`), pese al estado deseado sin Cron Triggers. Un futuro despliegue con esa declaración puede recrear consultas adicionales a PurpleAir y ejecutar también AirGradient. La deduplicación D1 no evita el costo de la consulta.

**Cambio mínimo:** conservar `[triggers]` y reemplazar la lista por `crons = []`, con comentarios operativos. Según [Cloudflare](https://developers.cloudflare.com/workers/configuration/cron-triggers/#via-the-wrangler-configuration-file), una lista vacía elimina los Cron Triggers al desplegar; omitir la propiedad conserva los existentes. No se cambia el handler `scheduled()`, los endpoints, campos, sensores, secretos, bindings, D1 ni la programación de cron-job.org. No se ejecuta un despliegue como parte de este trabajo.

**Aceptación y prueba offline:** parsear ambos TOML; comprobar que la base contiene el cron histórico y el resultado contiene un array vacío; comparar que el resto de las claves y valores es idéntico. Comprobar el diff limitado a configuración y documentación. No se simulan llamadas a proveedores ni se ejecuta el handler. La comprobación efectiva de un próximo despliegue queda pendiente de autorización y deberá confirmar cero Cron Triggers mediante lectura de configuración.

**Impacto y límites:** se preserva el esquema acordado de PurpleAir por cron-job.org a :27/:57, hasta 48 ejecuciones diarias normales. Este cambio de repositorio no acredita ahorro adicional actual ni mide consumo real. AirGradient no tiene ingesta automática en este esquema: antes de reconectar sus equipos debe planificarse su cobertura sin duplicar PurpleAir. El umbral de frescura de 25 minutos se conserva; la consulta cada 30 minutos puede producir intervalos de «Sin datos recientes».

**Reversión:** antes de fusionar, cerrar el PR descarta la propuesta. Después de fusionar, revertir su commit mediante otro PR restaura el archivo anterior; eso no modifica producción por sí mismo. No desplegar automáticamente esa reversión: restauraría la declaración del cron histórico y podría duplicar PurpleAir junto con cron-job.org. Cualquier reactivación requiere autorización y coordinación de ambos servicios. No hay cambios de datos que revertir.
