# AQ-02 — Plan de despliegue y recuperación, pendiente de autorización

13 de octubre de 2026, Argentina. Estado: cierre documental offline; producción no verificada. Sensores en pruebas y no oficiales.

## Fuente de verdad y alcance

Main consultado por GitHub: `8638fe671c9590c3715fca496ed562035637ee82`. PR [#11](https://github.com/lemeit/lemeit-aq/pull/11): abierta, sin merge, HEAD `7dfb0425a1efe4cc72a21c0719bfb265df669e5e`. Frente a la auditoría `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`: 11 commits, 25 archivos, 2187 inserciones y 64 eliminaciones. Main contiene AQ-01; AQ-02 sigue propuesto en PR #11. Revalidar ambos HEAD antes de operar; un cambio exige revisar nuevamente migración, compatibilidad y pruebas.

Se leyeron AGENTS.md del proyecto y repositorio, README, auditoría de integridad, plan de mejoras, documentación AQ-02, SQL, Worker, configuración y workflows. Ver [informe offline](AQ02_VALIDACION_LOCAL_D1.md) y [corrección propuesta](AQ02_CORRECCION.md). Este cierre no modifica código, SQL ni disparadores y no implica merge o despliegue. No se ejecutó D1 remoto ni concurrencia real.

Inventario D1 anterior de solo lectura: 2 AirGradient, 3 PurpleAir, 13641 lecturas, cero seriales AG duplicados y cero huérfanas. Es antecedente; no reemplaza el preflight actualizado ni demuestra ausencia de historia mezclada.

## Autorizaciones y responsabilidades

El titular debe autorizar por separado: (a) ventana, interrupción prevista, pausa/restablecimiento de escritores y respaldo/exportación; (b) copia privada y pruebas D1 aisladas, si requieren recursos cloud; (c) merge de PR #11 y posibles automatismos; (d) aplicación única de migración 009; (e) despliegue Worker; (f) controles que escriban visitas, ingestas de aceptación o recuperación destructiva. Registrar responsable, fecha, alcance, versión objetivo, duración máxima y decisión de recuperación. Ninguna de esas operaciones está autorizada por este documento.

GitHub workflows versionados no tienen disparadores push/pull_request, pero Pages puede publicar previews por integración externa. El 13 de octubre de 2026, el titular confirmó haber guardado en Cloudflare Pages la exclusión de `docs/aq-02-cierre-20261013`, conservando `fix/aq-02-airgradient-identity`. Esta condición se acredita por confirmación del usuario, no por lectura API ni por verificación independiente de la configuración. La publicación autorizada comprende únicamente esta rama documental y una PR hacia main, sin merge. No confiar en skip build. La lectura de Pages del trabajo anterior falló con Authentication error 10000 por cuenta no autorizada; no fue un rechazo automático de aprobación. No hay ejecutor Codex Cloud existente disponible en esta sesión; la publicación documental se realiza mediante el conector GitHub con los artefactos locales preparados.

## Respaldo consistente y ensayo previo

1. Identificar cuenta, base `purpleair-saladillo`, binding DB y versión efectiva Worker; contrastar identificadores de configuración, sin copiar credenciales a informes. Inventariar todos los escritores: cron-job.org, Cloudflare scheduled, dispatch Python, endpoints manuales, accesos administrativos y registro de visitas. No asumir estado actual a partir del README de septiembre.
2. En ventana autorizada, pausar todos los escritores y bloquear nuevas escrituras; drenar operaciones en vuelo y registrar el estado previo de cada disparador. Los GET públicos registran visitas: pausar ingestas solamente no da una copia estable de toda la base. Verificar quiescencia con controles directos, sin activar proveedores.
3. Registrar esquema efectivo y un punto recuperable de Time Travel si el backend y plan lo soportan, comprobando retención real, permisos y método de recuperación. El bookmark no sustituye una copia ensayada. Exportar schema y datos completos a almacenamiento privado con acceso limitado, sin filtros de tablas que omitan objetos necesarios; no subir SQL, bases, URLs firmadas ni seriales a GitHub.
4. La [API de exportación D1](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/export/) advierte indisponibilidad para consultas mientras se exporta. No es una lectura operacionalmente inocua: acordar impacto, mantener polling hasta complete/error y comprobar archivo completo antes de continuar. En el ensayo inicial no se inició exportación por ese riesgo; hoy tampoco se inició.
5. Guardar manifiesto privado con hora Argentina y UTC, bookmark, schema, versiones, hash de exportación, conteos por tabla y huellas ordenadas de todas las columnas. Restaurar el respaldo en copia privada nueva y comprobar lectura y recuperación. El schema versionado no reemplaza el efectivo. Ejecutar la migración exacta allí, comparar todas las filas/valores y objetos esperados; registrar integridad, FK y conservación, no solo conteos. Si la copia queda antigua, obtener una nueva durante la ventana final y repetir controles.
6. Antes de producción, exigir aceptación en D1 aislado con identidad del mismo serial y seriales distintos concurrentes, colisión PA/AG, ausencia de serial, metadata y reintentos tras fallo. Usar datos sintéticos y proveedores mock; ninguna ingesta real. SQLite y mocks ya aprobados no certifican esta concurrencia ni el binding remoto.

## Preflight SQL directo de solo lectura

Propuesta para ejecutar únicamente con acceso de lectura aprobado, primero en copia privada. No se ejecutó contra D1 en esta sesión. Si falta una tabla/columna o el esquema difiere, detener; no adaptar ni reparar automáticamente. Resultados con IDs/seriales permanecen privados. La salida compartida debe limitarse a agregados y estado.

```sql
SELECT type, name, tbl_name, sql FROM sqlite_schema
WHERE type IN ('table','index','trigger','view') ORDER BY type,name;
PRAGMA table_info(sensores);
PRAGMA table_info(lecturas);
PRAGMA foreign_key_list(lecturas);
PRAGMA index_list(sensores);
PRAGMA integrity_check;
PRAGMA foreign_key_check;
SELECT proveedor, COUNT(*) AS n FROM sensores GROUP BY proveedor;
SELECT COUNT(*) AS n FROM lecturas;
SELECT COUNT(*) AS n FROM visitas;
SELECT COUNT(*) AS grupos_duplicados FROM (
  SELECT serial_externo FROM sensores
  WHERE proveedor='airgradient' AND serial_externo IS NOT NULL
  GROUP BY serial_externo HAVING COUNT(*) > 1
);
SELECT COUNT(*) AS seriales_ag_invalidos FROM sensores
WHERE proveedor='airgradient' AND
 (serial_externo IS NULL OR typeof(serial_externo)<>'text'
  OR trim(serial_externo)='' OR serial_externo<>trim(serial_externo));
SELECT COUNT(*) AS huerfanas FROM lecturas l
LEFT JOIN sensores s ON s.sensor_index=l.sensor_index
WHERE s.sensor_index IS NULL;
SELECT COUNT(*) AS proveedores_invalidos FROM sensores
WHERE proveedor IS NULL OR proveedor NOT IN ('purpleair','airgradient');
SELECT COUNT(*) AS grupos_lecturas_duplicadas FROM (
 SELECT sensor_index,timestamp FROM lecturas
 GROUP BY sensor_index,timestamp HAVING COUNT(*)>1
);
SELECT name,sql FROM sqlite_schema WHERE name IN
 ('idx_sensores_airgradient_serial','sensores_proveedor_insert_guard',
  'sensores_identidad_update_guard');
```

Exigir integrity_check OK, FK sin filas, cero huérfanas/duplicados y revisión privada de identidades AG válidas contra inventario físico. trim SQL detecta espacios comunes; completar fuera de SQL la validación exacta de string del Worker, incluyendo otros espacios. La PK solo demuestra unicidad de ID, no pureza histórica ni procedencia física. Si hay anomalías, detener y abrir reconciliación independiente, sin DELETE/UPDATE ni reasignación de lecturas por suposición. Si existen objetos 009 completos o parciales, comprobar definiciones y registro previo: no volver a aplicar ni eliminarlos para forzar el paso.

## Ventana final y orden de ejecución

1. Responsable confirma aprobaciones, copia ensayada, plan de recuperación, ausencia de automatismos inesperados y bloqueo de escritores. Registrar versiones anterior/objetivo y captura privada de configuración para restaurar exactamente el estado previo.
2. Repetir respaldo consistente y preflight sobre estado final. Cancelar ante diferencias no explicadas. Aprobar merge solo tras revisar efectos automáticos; el merge puede publicar Pages y no debe usarse como prueba de Worker desplegado.
3. Aplicar una sola vez el archivo 009 exacto de la revisión aprobada. SHA-256 UTF-8/LF: `9a3b81dc5b0140ed6dd68aa6fced44531e3111ffcae9498a02a9a706ca156035`. No aplicar schema completo ni migraciones 001–008 de nuevo. Registrar ejecución, herramienta, resultado y estado de objetos; validar en copia la atomicidad del método elegido, sin asumir que ejecutar un archivo de varias sentencias es atómico. Ante fallo inspeccionar estado parcial y recuperar; no reintentar ciegamente.
4. Confirmar índice y dos triggers con definiciones exactas, integridad y conservación de datos antes de desplegar Worker. La migración no es idempotente. El índice permite NULL; la validación de serial obligatorio depende también del Worker. Los triggers protegen INSERT/UPDATE, no bloquean DELETE general.
5. Con escritores aún bloqueados, desplegar Worker aprobado y verificar versión y binding efectivos. **Migración primero, Worker después**: el nuevo Worker necesita el índice para reservar. Mantener bloqueo mientras corre el Worker anterior con restricciones nuevas; puede fallar en caminos que intentan cambiar identidad.
6. Completar controles posteriores; solo con aprobación restablecer exactamente los escritores antes activos. No activar cron pausado, aumentar frecuencia ni ejecutar backfill. Registrar fin de ventana y observación de los ciclos normales autorizados; una ingesta manual de aceptación necesita permiso específico.

## Controles posteriores y aceptación

Mientras no hay escritores, comparar hash por tabla y conteos con respaldo, incluyendo sensores, lecturas y visitas; SQL de objetos corresponde al objetivo. integrity_check OK y foreign_key_check sin resultados; seriales e IDs previos intactos. Comprobar casos de rechazo únicamente en copia privada, no insertar/borrar datos de prueba en producción. Confirmar versión Worker y binding, errores y resultados por proveedor con logs existentes sanitizados; no exponer tokens.

Al restablecer escritores autorizados, usar comparación de filas preexistentes y manifiesto por corte temporal: los conteos totales ya pueden crecer legítimamente. Vigilar duplicados, huérfanas, reservas sin lectura, errores de identidad, frescura y cobertura por proveedor. Ausencia de error no demuestra ingesta AG: el endpoint automático documentado solo invoca PA; AQ-05 permanece pendiente. Un GET público o healthcheck que registra visitas no es control de solo lectura y requiere autorización.

Criterios para cerrar AQ-02 operativo: copia real restaurada/ensayada, concurrencia D1 aislada aprobada, autorizaciones registradas, migración exacta instalada, datos preexistentes preservados, Worker efectivo aprobado y observación documentada de escritores autorizados. Si falta alguno, mantener estado pendiente; nunca inferir validación productiva del 35/35 integridad o 12/12 AQ-01 offline. No certifica exactitud metrológica ni sanea historia ya mezclada.

## Recuperación y dificultad de reversión

Antes de publicación/merge, descartar la rama documental no altera producción. Tras una aplicación, mantener o volver a bloquear escritores ante cualquier fallo; preservar evidencia y estado recuperable actual antes de una recuperación. Separar fallo de migración, despliegue y datos para no restaurar una base por un problema exclusivamente de código.

No hay down migration aprobada. Revertir Worker con restricciones nuevas puede romper el camino anterior de identidad; retirar índice/triggers reintroduce colisiones. Preferir mantener el bloqueo y preparar corrección compatible revisada. Una retirada de objetos exige plan SQL específico, ensayo y autorización; no incluir ni ejecutar DROP automático.

Si es necesaria restauración completa, acordar explícitamente punto, datos posteriores que se perderían, preservación privada y eventual reconciliación; [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) sobrescribe la base y cancela consultas en vuelo. Confirmar backend, retención y bookmark vigente antes de autorizar. Restaurar respaldo o usar Time Travel solo mediante procedimiento ensayado. No asumir que rollback de Worker restaura D1, ni importar SQL sobre una base parcialmente migrada sin estrategia revisada. Restauración a otra base y cambio de binding son también cambios productivos que requieren aprobación.

Después, confirmar código/esquema compatibles, integridad, huellas del punto elegido e identidades; registrar pérdidas o intervalos pendientes. Reabrir escritores únicamente tras aprobación y restituir configuración previa, sin duplicar llamadas a proveedores. Recuperación de lecturas posteriores o historia mezclada necesita evidencia de origen y tarea separada.
