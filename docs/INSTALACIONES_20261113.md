# Instalaciones escolares reportadas el 13/11/2026

## Hecho informado y evidencia disponible

Fuente del nuevo evento: reporte explícito del titular del proyecto en la solicitud del 13/11/2026. No se recibieron en esta revisión fotografías, actas ni resultados técnicos nuevos.

| Institución informada | Localidad / partido | Instalación física reportada | Conexión y transmisión reportadas | Identidad documental previa |
| --- | --- | --- | --- | --- |
| Escuela de Educación Agropecuaria de Carlos Casares | Del Valle / 25 de Mayo | 13/11/2026 | Wi-Fi escolar; datos al portal público | AE-04; PurpleAir 298873 |
| Escuela de Educación Artística Lola Mora | 25 de Mayo / 25 de Mayo | 13/11/2026 | Wi-Fi escolar; datos al portal público | AE-01; PurpleAir 298687 |

Los códigos e índices proceden del [inventario](INVENTARIO_ESTACIONES.md), del [registro de altas](instalacion/REGISTRO_PURPLEAIR.md) y del [alta AE-04](ALTA_AE04_20261112.md), ya versionados; no fueron deducidos de este reporte. El repositorio emplea para Del Valle las denominaciones abreviadas «Esc. Agraria C.M. Casares (EAS Del Valle)» y «EA C.M. Casares (Del Valle)». Se documenta el nombre informado sin cambiar metadatos productivos ni certificar equivalencia administrativa oficial. No se supone modelo de hardware ni se revalidan IDs físicos.

La evidencia técnica previa es del **12/11**, anterior al montaje reportado: el alta AE-04 documenta lectura a las 11:55:40 UTC y siete identidades D1 (cinco PurpleAir y dos AirGradient); no demuestra transmisión desde la escuela el 13/11. AE-01 tenía lectura histórica en el inventario anterior. Una ficha, una coordenada declarada o `activo = 1` no prueba instalación ni conectividad actual.

## Inspección y comparación con la auditoría

HEAD inspeccionado de main: [797ce96a2ba8ddace89d2db62dafeaad2413d2be](https://github.com/lemeit/lemeit-aq/commit/797ce96a2ba8ddace89d2db62dafeaad2413d2be).
[Comparación con c03d7d0dca68772f3d1ea3312d797fe48f038f9c](https://github.com/lemeit/lemeit-aq/compare/c03d7d0dca68772f3d1ea3312d797fe48f038f9c...797ce96a2ba8ddace89d2db62dafeaad2413d2be): **50 commits adelante, 0 detrás**, 74 archivos según respuesta de GitHub. Incluye cambios en AQI/frontend, identidad AirGradient, schema, diagnóstico, documentación y cron versionado. Esta comparación no equivale a nueva auditoría completa ni acredita despliegue o cierre de hallazgos.

Se revisaron AGENTS, README y todos los Markdown de docs/, además de Worker, esquema D1, configuración, workflows y script de ingesta. El roadmap técnico es PLAN_MEJORAS.md; la bitácora general y el roadmap escolar están en la wiki, repositorio separado [lemeit/lemeit-wiki](https://github.com/lemeit/lemeit-wiki), main inspeccionado `28b8aeac059b5fa64fdb88302c99b1487e16b73a`. Se prepara allí una rama/PR documental con página AQ ES/EN y nuevo evento de bitácora, conservando antecedentes.

El entorno Codex Cloud lemeit-aq existe y fue localizado, pero esta sesión no expone un ejecutor para operar en él. Se utilizan el conector GitHub y refs exactas, sin crear otro entorno ni otro chat.

## Restricción de cero escrituras y controles pendientes

En el Worker inspeccionado, `fetch()` llama a `logVisita()` para GET que no sean `/api/admin/`; esa función inserta en `visitas` mediante `ctx.waitUntil`. Por eso no se consultaron los endpoints públicos de sensores, últimas lecturas ni histórico, ni se cargó el dashboard. No son verificaciones de cero escrituras. No se consultaron proveedores ni se ejecutó D1.

**Resultado técnico actual: no verificado.** Quedan pendientes, por una vía de lectura segura disponible o con autorización apropiada: comprobar metadatos por identidad, lecturas posteriores al montaje con timestamp que avance en ciclos existentes, frescura y visualización en el portal. No disparar ingestas para obtener esa evidencia ni afirmar continuidad a partir de una muestra.

## Conteos y pendientes

- Dos instalaciones del 13/11 reportadas; no son dos sensores nuevos.
- AE-01 y AE-04 dejan de figurar como pendientes de montaje en el resumen vigente, con atribución al titular.
- AE-02 conserva su instalación informada anteriormente, sin nueva verificación ni fecha exacta añadida.
- AE-00 y AE-03 conservan sus últimos pendientes documentados; no se afirma que sigan apagados hoy.
- Se conserva el último conteo documentado de siete identidades, no un conteo actual de equipos online. AirGradient no cambia.
- No se cierran AQ-05, AQ-20 ni otros hallazgos por el reporte de instalación.

## Reproducción, aceptación y comprobaciones documentales

Antes del cambio: README marcaba AE-01 «instalación pendiente» y AE-04 «en pruebas, instalación escolar pendiente»; inventario/operación/registro repetían el estado del 12/11. La wiki ES/EN mantenía esos pendientes.

Aceptación: ambas instituciones, localidad y fecha figuran con Wi-Fi/transmisión atribuidos al titular; alta del proveedor separada de montaje; IDs solo de fuentes previas; ningún conteo online inventado; histórico preservado. Diff exclusivamente Markdown, sin runtime ni configuración.

Validación realizada: **107 enlaces relativos en nueve Markdown AQ y 14 en tres Markdown wiki, sin destinos ausentes**; revisión de fechas y atribución entre resúmenes satisfactoria. Se comprueban destinos de enlaces relativos añadidos/modificados contra los árboles GitHub y coherencia de fecha, instituciones y atribución entre resúmenes. Los enlaces externos de evidencia GitHub se contrastan con recursos leídos por el conector; no se prueban enlaces productivos que puedan generar visitas. No corresponde ejecutar suites de runtime para este cambio documental.

## Alcance y reversión

No se modifican PDF editables, DOCX de planificación/especificaciones ni imágenes: son material de referencia y no un inventario vigente; este registro aporta el estado posterior. No se alteran auditorías, TAP, fixtures ni conteos históricos. La ficha de aboutme, portadas de otros repositorios, documentos privados y ejemplares impresos quedan fuera de esta actualización; no se afirma que estén sincronizados.

Commits con `[CF-Pages-Skip]` para omitir previews, siguiendo el procedimiento documental previo; PR sin merge. No se ejecutan despliegues, ingestas, migraciones ni escrituras en producción. Descartar los PR revierte la propuesta; cualquier integración o publicación futura requiere decisión del titular.
