# Instrucciones para agentes — lemeit-aq

## Proyecto
Aire Saladillo: red de monitoreo de calidad del aire con sensores PurpleAir y AirGradient, visualización web y API. Leer `README.md` antes de intervenir. La arquitectura combina Cloudflare Pages, Worker y base D1; los datos se obtienen de proveedores externos. No confundir este proyecto con EMAS (meteorología) ni WQ (agua).

## Flujo de trabajo
- Trabajar en ramas y PR; no modificar `main`, desplegar Workers/Pages ni cambiar disparadores sin aprobación.
- Inspeccionar `worker/`, `d1/`, workflows y scripts antes de editar. Cambios acotados, reversibles y documentados.
- No incluir secretos, tokens PurpleAir/AirGradient, credenciales Cloudflare ni exportaciones privadas en commits o logs.

## Datos, sensores y calidad
- Conservar el historial de lecturas y la distinción entre sensores físicos y mediciones. No eliminar sensores inactivos ni datos históricos por cambios de presentación.
- Respetar la identidad del proveedor, identificadores sintéticos de AirGradient y el filtro de ubicaciones autorizadas; no incluir sensores de otras instituciones o ciudades por accidente.
- Preservar deduplicación de lecturas por sensor y timestamp. No asumir que deduplicar inserciones evita consumir cuota de las API externas.
- Mostrar unidades, periodos, zona horaria, frescura de datos y diferencias entre mediciones, estimaciones e indicadores derivados con precisión. No presentar un sensor desconectado como si estuviera reportando normalmente.
- No modificar umbrales o interpretaciones sanitarias sin una fuente y una justificación explícitas.

## Ingesta y costos
- La programación de ingesta tiene antecedentes de fallos y duplicación de llamadas documentados en `README.md`. Verificar el estado real antes de tocar cron-job.org, Cloudflare Cron o GitHub Actions.
- No reactivar automáticamente programaciones pausadas ni aumentar frecuencias: puede duplicar llamadas a proveedores y consumir cuotas.
- No ejecutar backfills, migraciones D1, borrados, ingestas manuales masivas o escrituras de producción sin autorización y estrategia de recuperación.
- Probar cambios de ingesta con mocks, datos de ejemplo o entorno de prueba cuando sea posible.

## Interfaz y despliegue
- Mantener la identidad visual lemeit y los recursos compartidos de `design.lemeit.ar`; conservar compatibilidad móvil y accesibilidad.
- No romper la API pública ni los formatos consumidos por el dashboard y terceros sin plan de compatibilidad.
- Antes de publicar, validar la sintaxis de JS, las rutas estáticas y la configuración de Worker con comandos disponibles en el repositorio; documentar qué verificaciones requirieron acceso real a Cloudflare o proveedores.
- Al finalizar informar archivos, pruebas ejecutadas, cambios de consumo o frecuencia y limitaciones.
