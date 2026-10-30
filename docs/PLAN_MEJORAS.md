# Plan de mejoras — LEMEIT · AQ

> Seguimiento 28/10/2026: [inventario y corte de producción](INVENTARIO_ESTACIONES.md), [incidente AE-03 y operación segura](OPERACION_PURPLEAIR.md). El alta de AE-03 no cierra AQ-05; código de estación vacío en D1 pendiente de corrección autorizada. Mantener separados los estados históricos de esta planificación y la evidencia de cada PR.

**Referencia:** [AUDITORIA_TECNICA.md](AUDITORIA_TECNICA.md), commit `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`.  
**Fecha inicial:** 2026-10-10. **Estado inicial histórico:** todas las tareas pendientes. Consultar el registro de avance para las propuestas posteriores; no equiparar pruebas offline con despliegue o verificación productiva.

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
| AQ-09 | Frescura | Propuesta probada en rama: ≤25 min reciente; >25 min/inválido/futuro neutro; tarjetas, marcadores y popups envejecen aun sin respuestas. [Aceptación y operación](FRESCURA_SENSORES.md). Pendiente de merge/despliegue |
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


### AQ-09 — seguimiento 30/10/2026

Corrección y pruebas offline preparadas en `fix/aq09-frescura-sensores`, commit
funcional local `0e14a2558331c3bf2cff076a56ff65addfebe04c`, base main
`dc951eca4e509d1898e95f3e9578ab09160ca19b`. Siete archivos Node PASS y Chromium
real con fixtures offline (mapa adaptado, ES/EN, 390/1440 px), borde 25 min,
inválidos/futuros, red, recuperación y orden #21. [Informe](FRESCURA_SENSORES.md).
Exclusión exacta de previews autorizada y verificada por API antes de publicar;
no marca AQ-09 fusionado, desplegado ni verificado en producción. AQ-04 y
normalización backend de fechas siguen pendientes. El titular hará el merge.


Estado de publicación: [PR #22 abierto](https://github.com/lemeit/lemeit-aq/pull/22),
pendiente del merge del titular. Main avanzó concurrentemente por #20 a
`a9d2acd4d9f6f0e4e154b7dfc3a1e3f5849ecb21`; la rama AQ-09 conserva esos
cambios y su resolución documental. Pages omitió el primer HEAD por
`branch_config`, sin ejecutar preview. [Evidencia y límites](FRESCURA_SENSORES.md#publicación-comprobada-y-avance-concurrente-de-main).


### Seguimiento de interfaz y frescura — 30/10/2026

#22 fusionado en `d76c6870bdeb70da2ff4be428752136532bee320`; el estado abierto
anterior es histórico. El nuevo cambio [Marcadores compactos](MARCADORES_MAPA.md)
se prepara en rama independiente, sin rehacer AQ-09 ni declarar validación
productiva: formas para seis categorías existentes, un acento del sitio,
parámetros neutros y popups de la capa elegida. Sin cambios de orden #21,
identidad/activo/D1 ni ingesta. Criterios y pruebas offline con Leaflet real en
el informe; [PR #23 abierto](https://github.com/lemeit/lemeit-aq/pull/23), pendiente de merge. Resto de hallazgos conserva su alcance.
