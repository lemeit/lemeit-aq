# AQ-02 — Validación local de migración 009

Fecha: 13 de octubre de 2026, Argentina. Resultado: **aceptación offline satisfactoria; validación sobre copia productiva pendiente**.

## Estado comprobado

GitHub consultado mediante conector: main `8638fe671c9590c3715fca496ed562035637ee82`; PR #11 abierta, sin merge, HEAD `7dfb0425a1efe4cc72a21c0719bfb265df669e5e`. La copia local coincide con el HEAD de la PR. Se consultaron AGENTS.md del proyecto y de main y README.md. Frente a la auditoría `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`, main cambia 25 archivos, 2187 inserciones y 64 eliminaciones; incluye documentación/pruebas y corrección AQ-01, no la migración 009 de esta PR.

No se modificó código de la PR ni main. Fuente aislada extraída del commit de la PR mediante archivo Git; el acceso Git HTTPS no estaba disponible en esta sesión. La consulta de main se verificó por el conector GitHub.

## Exportación y alcance

Se inspeccionó el esquema oficial de API Cloudflare para `POST /accounts/{account_id}/d1/database/{database_id}/export`. Su descripción advierte: "during which your D1 will be unavailable to serve queries". La exportación puede afectar la disponibilidad de producción. Por la condición de exportar únicamente si es seguro y mediante lectura, **no se inició una exportación**. Esto es una decisión por impacto operativo documentado, no un error de autenticación ni un rechazo automático. No se hicieron consultas de datos remotos ni llamadas a la API pública (que puede registrar visitas).

Referencia de API: https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/export/

El inventario aportado por el usuario (5 sensores, 13641 lecturas, 0 duplicados AG, 0 huérfanas, IDs AG 900002 y 900003) es antecedente, no medición actual de esta sesión. Se creó un fixture con esas cantidades e IDs, tres sensores PurpleAir y dos AirGradient, valores y seriales enteramente sintéticos. No representa las filas, timestamps, esquema efectivo ni estado actual de D1 productivo.

## Prueba de migración

`validate_migration.py` usa SQLite 3.45.1, esquema versionado de main y el archivo exacto `d1/migration_009_airgradient_identity.sql` de la PR. Produce `fixture-before.sqlite`, `fixture-local.sqlite` y `validation-results.json` en la carpeta aislada. No tiene red ni credenciales. Para repetir desde cero usar otra carpeta y nombres nuevos para los fixtures; no reutilizar una base ya creada.

SHA-256 de migración: `9a3b81dc5b0140ed6dd68aa6fced44531e3111ffcae9498a02a9a706ca156035`.

- Se conservan todas las filas y valores de sensores, lecturas y visitas: huellas SHA-256 antes/después idénticas, además de conteos 5 y 13641.
- `PRAGMA integrity_check`: ok; `PRAGMA foreign_key_check`: sin resultados.
- Índice único rechaza serial AirGradient duplicado.
- Triggers rechazan colisión entre proveedores y cambio de serial AG en el mismo ID, incluso mediante IGNORE, REPLACE y UPSERT.
- Trigger de UPDATE rechaza cambio de ID, proveedor y serial AG, incluido pasar serial a NULL.
- Metadata y UPSERT de la misma identidad siguen funcionando.
- Fixture separado con duplicados previos: la migración falla en el primer índice, conserva filas y no instala triggers. Exige reconciliación independiente.
- Segunda aplicación falla por índice ya existente: ejecución única y registro de aplicación necesarios.

## Verificación de aplicación

Node 22.23.3, pruebas offline con HTTP bloqueado/mocks: 35/35 pruebas de integridad, incluidas las 10 de aceptación AQ-02, y 12/12 de aceptación AQ-01. Python de integridad pasó. Registros `integrity-local.tap` y `aq01-local.tap` en la carpeta aislada. Los PASS de defectos ajenos a AQ-02 son reproducciones, no correcciones. SQLite y mocks no certifican comportamiento del binding D1 remoto ni concurrencia distribuida real.

## Hallazgos y aceptación

La migración satisface los controles offline de preservación e identidad probados. El índice excluye NULL: SQL permite varias identidades AG sin serial; el Worker de la PR rechaza serial ausente, vacío y con espacios, según sus pruebas. Los triggers protegen INSERT/UPDATE, no constituyen un mecanismo general contra DELETE de identidades. No reparan historia previamente mezclada ni detectan que dos equipos físicos compartan un serial mal informado. No se observó un bloqueo en los caminos de aplicación probados.

Para considerar verificada la migración sobre datos reales aún se requiere una copia privada consistente con el esquema efectivo y ejecutar estos controles sobre ella. No se solicitó ninguna acción al usuario ni se inició una operación con riesgo de interrupción para obtenerla. La alternativa offline queda preparada y ejecutada, pero no reemplaza esa evidencia.

No hubo escrituras productivas, creación de recursos cloud, ingestas, despliegues, merge ni publicación de seriales/secretos. Ningún cambio de frecuencia o consumo de proveedores. Los artefactos son locales y no se publicaron ni se añadieron a una PR. El informe se mantiene bajo docs en la copia aislada para revisión futura.

## Cierre documental de esta sesión

Los resultados anteriores corresponden al ensayo offline del 13 de octubre; en este cierre se revisaron los registros existentes, sin repetir ni ampliar las pruebas. GitHub volvió a confirmar main y HEAD de PR #11 indicados arriba; sigue abierta y sin merge. El JSON y los TAP locales coinciden con los resultados informados. El SHA-256 indicado corresponde al SQL en UTF-8 con finales LF; la copia Windows con CRLF tiene hash distinto. Sensores en pruebas, no oficiales. El inventario D1 previo fue de lectura y es un antecedente, no una medición actual.

La frase anterior sobre artefactos no publicados describe el ensayo inicial. Este informe se publica ahora en la rama documental independiente `docs/aq-02-cierre-20261013`; no incluye bases, exportaciones privadas ni seriales reales. Ver [plan de despliegue](AQ02_PLAN_DESPLIEGUE.md). El titular confirmó el 13 de octubre de 2026 que guardó su exclusión de previews en Cloudflare Pages, conservando la exclusión de `fix/aq-02-airgradient-identity`. Es confirmación del usuario, no verificación mediante API. Se autoriza publicar rama y PR hacia main, sin merge. No hay ejecutor del entorno Codex Cloud existente expuesto en esta sesión; se utiliza el conector GitHub para publicar los artefactos preparados localmente.
