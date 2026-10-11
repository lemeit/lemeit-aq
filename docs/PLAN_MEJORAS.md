# Plan de mejoras — LEMEIT · AQ

**Referencia:** [AUDITORIA_TECNICA.md](AUDITORIA_TECNICA.md), commit `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`.  
**Fecha inicial:** 2026-10-10. **Estado de todas las tareas:** pendientes; ninguna corrección se considera implementada por este documento.

## Criterios transversales

1. Comparar HEAD de `main` con el commit auditado y revisar código vigente.
2. Reproducir defecto con fixtures/mocks y pruebas locales; registrar evidencia.
3. Un PR por corrección acotada, rama independiente, sin mezclar cambios.
4. Especificar contrato/API, efectos en datos existentes, pruebas, riesgos y rollback.
5. No ejecutar ingestas reales, migraciones, cambios de producción ni despliegues sin autorización explícita.
6. Registrar resultado verificado y enlace de PR antes de marcar una tarea completada.

## Etapa 1 — Seguridad y exactitud

| Orden sugerido | ID | Tema | Chat responsable | Criterios de aceptación |
|---|---|---|---|---|
| 1 | AQ-03 | Límites de API | 03 Backend, API y seguridad | `limit=-1`, cero, texto, fracciones y valores excesivos tratados conforme a contrato; HTTP 400 en inválidos; máximo efectivo probado en historial y visitas |
| 2 | AQ-04 | Sensores inactivos | 03 Backend + 04 Dashboard | Últimas lecturas del dashboard excluyen inactivos; historial accesible según contrato; pruebas con activo/inactivo |
| 3 | AQ-06 | XSS | 04 Dashboard + 03 Seguridad | Campos externos se insertan como texto o escapados por contexto; pruebas de nombres/instituciones/mediciones hostiles |
| 4 | AQ-01 | AQI | 01 Integridad | Metodología y período temporal documentados; valores negativos/NaN rechazados; casos de frontera 12,05 y 35,45 y tramos vecinos correctos |
| 5 | AQ-05 | Cobertura automática | 02 Ingesta + 05 Operación | Evidencia autorizada de disparadores reales y proveedor cubierto; diseño sin duplicación; ninguna activación automática |
| 6 | AQ-02 | Identidad AirGradient | 02 Ingesta + 01 Integridad | Unicidad proveedor/serial, prueba de concurrencia y plan de migración no destructivo que preserve historial; ejecutar migración solo tras autorización |

## Etapa 2 — Integridad y robustez

| ID | Trabajo | Criterio de aceptación |
|---|---|---|
| AQ-07 | Fechas de historial | Intervalos UTC explícitos; `hasta` incluye el día completo según contrato y casos límite |
| AQ-08 | Política de nombres/metadata | Python y Worker se comportan igual con fixtures; no revierten nombres manuales |
| AQ-09 | Frescura | Tarjetas, marcadores y popups envejecen aun si falla la red |
| AQ-10 | Contadores de ingesta | Distinguir procesados, insertados, ignorados y descartados |
| AQ-11 | Errores parciales y timeouts | Resultados por token, fallos visibles, timeouts y validación de payload/timestamps |
| AQ-12 | Filtro AirGradient | Sin lista autorizada de ubicaciones, ingesta falla cerrada |
| AQ-13 | Contrato API/CSV | Métodos HTTP explícitos, campos públicos enumerados, neutralización de fórmulas CSV |
| AQ-14 | Visitas y CARTO | Política de retención/abuso, validación de zoom/coords y control de cuota |

## Etapa 3 — Operación y mantenimiento

| ID | Trabajo | Criterio de aceptación |
|---|---|---|
| AQ-15 | Migraciones y schema | Procedimientos separados para DB nueva/existente; sin borrado de datos |
| AQ-16 | Índices y consultas D1 | Mediciones reales autorizadas antes de optimizar |
| AQ-17 | Pruebas y CI | Pruebas sin proveedores reales, dependencias fijadas y validación automatizada |
| AQ-18 | PWA | No borrar cachés ajenas del origen; alcance de interceptación explícito |
| AQ-19 | Integración visual | Evaluar versionado de assets, CSP/SRI, disponibilidad de jsPDF y cabeceras Pages |
| AQ-20 | Observabilidad/rollback | Configuración documentada, salud de ingesta, frescura y plan de reversión |
| AQ-21 | Modularización | Separar componentes sin alterar comportamiento; pruebas de regresión |

## Etapa 4 — Nuevas funcionalidades (después de estabilizar)

Panel de salud por proveedor, paginación de historial, agregaciones para series largas y exposición controlada de RSSI y promedios PM2.5. Incorporar otros proveedores solo después de estabilizar identidad e integridad.

## Registro de avance

Actualizar cada fila con: estado (`pendiente / en curso / PR abierto / implementado / verificado`), PR, commit, pruebas y fecha. No interpretar la creación de este plan como resolución de defectos.
