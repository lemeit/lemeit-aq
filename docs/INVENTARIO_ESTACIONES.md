# Inventario y verificación de estaciones

Corte: 28 de octubre de 2026, 23:17 ART (29 de octubre, 02:17 UTC). Este documento distingue confirmación del titular, estado registrado y conectividad. `activo = 1` no demuestra que un equipo esté online.

| Código | Proveedor / sensor_index | Institución | Estado y evidencia |
| --- | --- | --- | --- |
| AE-00 | PurpleAir 198617 | Colegio Secundario Madre Teresa | Registrado en D1; última lectura 2026-10-14 09:49:11 UTC. Sin evidencia de conexión reciente. |
| AE-01 | PurpleAir 298687 | EEA N°1 Lola Mora | Pendiente de instalación física según última información del titular. Registrado; última lectura 2026-10-06 02:25:18 UTC. |
| AE-02 | PurpleAir 298701 | ES N°2 Manuel Pardal | Operativo según titular; D1 confirma lectura 2026-10-29 02:10:53 UTC. |
| AE-03 | PurpleAir 298691 | Instituto Niño Jesús | PA-II-FLEX; device ID `fc:f5:c4:ae:ca:d6` según titular. Online y visible en portal según titular; D1 confirma lectura 2026-10-29 02:10:34 UTC. |
| AE-04 | PurpleAir, sin sensor_index asignado | Del Valle | Código reservado según titular; no hay fila correspondiente en la consulta D1. No inventar un índice. |
| Sin código | AirGradient 900002 | A definir (En proceso de colocación) | D1: nombre “Instalación en evaluación”; última lectura 2026-09-16 22:09:01 UTC. No acreditar instalación definitiva ni conexión actual. |
| Sin código | AirGradient 900003 | Saladillo Centro | D1: última lectura 2026-10-07 16:22:32 UTC. No acreditar conexión actual. |

Los seis sensores registrados tienen `activo = 1`. AE-03 tiene `nombre = 'AE-03'`, institución correcta y **`codigo IS NULL`**. La asignación del código queda pendiente de una operación autorizada; esta actualización documental no la realiza. El modelo y device ID no se verificaron contra PurpleAir ni contra hardware.

## Evidencia de solo lectura

Se consultó directamente D1 mediante la API de Cloudflare con este SELECT, sin pasar por la API pública:

```sql
SELECT s.sensor_index, s.codigo, s.nombre, s.institucion, s.proveedor,
       s.activo, MAX(l.timestamp) AS ultima_lectura
FROM sensores s
LEFT JOIN lecturas l ON l.sensor_index = s.sensor_index
GROUP BY s.sensor_index
ORDER BY s.sensor_index;
```

Resultado: 6 sensores; `changes = 0`, `rows_written = 0`, `changed_db = false`. Los timestamps se transcriben como almacenados; no se validó su origen temporal contra proveedores.

GET de metadatos de deployments: deployment activo `b82c65e8-f712-4cdc-823f-5bff93d092d4`, creado 2026-10-29 02:08:33.872433 UTC (28/10, 23:08 ART), versión `1d5cdc90-bd86-449d-a82a-96d8f886f9a5` al 100 %. Esto acredita una versión activa, no su correspondencia con un commit ni el contenido del secreto.

No se leyeron valores de secretos. No se ejecutaron ingestas, exportaciones D1, migraciones, despliegues ni escrituras de datos. No se abrió el portal ni se consultaron endpoints públicos: el Worker registra visitas en D1 para GET públicos. La visibilidad de AE-03 en el portal y la causa histórica del incidente son confirmaciones del titular, no verificaciones visuales independientes.

## Base documental y alcance

Se inspeccionaron AGENTS.md, README, los Markdown de docs/, Worker, schema D1, configuración, workflow y script Python en `main` = `1e426885a643629938a78b8f66fbe10b517010be`. Frente a la auditoría `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`, GitHub informa 18 commits adelante y 0 detrás. Hay cambios en AQI/frontend, identidad AirGradient, schema y diagnóstico; esto no certifica su despliegue ni cierra los hallazgos restantes.

Las auditorías, resultados TAP y fixtures históricos conservan sus cantidades originales. En particular los cinco sensores de AQ02_VALIDACION_LOCAL_D1.md pertenecen a un fixture anterior; no describen este inventario de seis filas. Los DOCX/PPTX son material de referencia histórico, no inventario operativo vigente.

El entorno Codex Cloud existente no está expuesto por las herramientas de esta sesión; la revisión y el PR documental se realizan mediante el conector GitHub sobre refs exactas, sin crear otro entorno cloud.

Ver [incidente, alta segura y reversión](OPERACION_PURPLEAIR.md).

## Altas PurpleAir documentadas el 29/10/2026

Los correos aportados por el titular respaldan AE-01 (298687) y AE-02 (298701): **05/10/2026**; AE-03 (298691): **28/10/2026**. Ver [Device ID, coordenadas declaradas y criterios de fecha](instalacion/REGISTRO_PURPLEAIR.md). Esta actualización no revalida conectividad ni altera el corte D1 anterior. El alta en PurpleAir no es la fecha de instalación física, que sigue registrándose por separado.

AE-00 (198617, Device ID `c8:c9:a3:f:93:af`): correo de primera configuración como `saladillo_home` del 28/11/2023; confirmación posterior como `Madre Teresa High School` del 03/12/2024, tras el traslado informado por el titular. Ese registro escolar declara -35.66630, -59.80716; no prueba ubicación actual ni fecha exacta del montaje. La futura instalación/reubicación queda pendiente. Se omiten coordenadas del domicilio y contactos personales. Historial y evidencia en el [registro documental](instalacion/REGISTRO_PURPLEAIR.md).

Confirmación posterior aportada por el titular, **29/10/2026, 12:27**: AE-00 cambia su nombre PurpleAir a `AE-00 | app.lemeit.ar`. Conserva sensor index 198617, Device ID `c8:c9:a3:f:93:af` y coordenadas -35.6663, -59.80716, con elevación declarada 42.3987 m. No se cambia el código AE-00 ni se actualizan D1, institución o fecha de instalación desde esta documentación. La conexión declarada en el correo es puntual, no una verificación actual independiente.
