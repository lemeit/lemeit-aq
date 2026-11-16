# Aire Escolar LEMEIT · AQ — Red de monitoreo de calidad del aire

[![Sitio](https://img.shields.io/badge/sitio-app.lemeit.ar%2Faq-009688?style=flat-square&labelColor=555555)](https://app.lemeit.ar/aq)
[![Documentación](https://img.shields.io/badge/documentaci%C3%B3n-wiki.lemeit.ar-009688?style=flat-square&labelColor=555555)](https://wiki.lemeit.ar/red-ambiental/01-aire-saladillo/)
[![API](https://img.shields.io/badge/API-p%C3%BAblica-FF5722?style=flat-square&labelColor=555555)](https://app.lemeit.ar/aq/api.html)
[![Licencia](https://img.shields.io/badge/licencia-MIT-009688?style=flat-square&labelColor=555555)](#licencia)

LEMEIT · AQ (Aire Saladillo / Aire Escolar) permite adquirir, conservar y visualizar mediciones de calidad del aire de sensores **PurpleAir** y **AirGradient** asociados a escuelas y otras ubicaciones de Saladillo y del partido de 25 de Mayo, provincia de Buenos Aires. Es parte de una iniciativa de ciencia ciudadana y educación ambiental. Incluye mediciones de partículas y, según el equipo, temperatura, humedad, CO₂ e índices VOC/NOx.

- **Portal:** [app.lemeit.ar/aq](https://app.lemeit.ar/aq).
- **Documentación y guías:** [wiki.lemeit.ar](https://wiki.lemeit.ar/red-ambiental/01-aire-saladillo/) y [índice técnico versionado](docs/README.md).
- **Proyectos relacionados:** [EMAS](https://app.lemeit.ar/emas) (meteorología) y [WQ](https://app.lemeit.ar/wq) (agua).

La denominación de la red es **Red de Monitoreo Ambiental**, sin limitarla a un distrito. Se conserva Aire Escolar LEMEIT · AQ como nombre del proyecto.

## Qué ofrece el sistema

El portal presenta tarjetas de estaciones, mapa por parámetro, gráficos históricos, exportación CSV y estado de frescura. Los sensores desconectados pueden conservar sus últimos datos: **última medición** no significa **medición reciente**. Un sensor apagado no equivale a una baja administrativa.

El indicador AQI se calcula en el navegador a partir de la concentración PM2.5 disponible, según la implementación documentada; **no representa un AQI diario o NowCast**. Ver [metodología, unidades, límites y trazabilidad](docs/AQI_TRAZABILIDAD.md), y [tratamiento de frescura](docs/FRESCURA_SENSORES.md).

El mapa «AQI · EPA» usa círculos y seis colores oficiales EPA, con nombre, AQI, PM2.5, fecha y estado en el popup ([#37 fusionado](https://github.com/lemeit/lemeit-aq/pull/37); publicación informada por el titular). La corrección de [prioridad y frescura #38 fusionada](docs/PRIORIDAD_MAPA_FRESCURA.md) mantiene los puntos recientes encima de los grises y fija **40 minutos inclusive**, con ingesta cada 30 minutos y 10 minutos de margen. Un gris indica falta de datos recientes, **no certifica apagado físico**. La [vista provincial y partidos PBA](docs/MAPA_PROVINCIA_PBA.md) se prepara en un nuevo PR sin merge ni despliegue: provincia completa al inicio, exploración libre, etiquetas de partidos según zoom y selector de los 135 distritos. Ver [procedencia ARBA/IGN, espejo y licencia CC BY 4.0](assets/geo/README.md). EMAS queda para una etapa incremental futura; no se importan datos.

Para el mapa, consultar [círculos y categorías AQI](docs/CIRCULOS_AQI_MAPA.md), [leyenda interior vigente](docs/CONTROL_LEYENDA_MAPA.md) y [orden de tarjetas](docs/ORDEN_TARJETAS.md). El historial de decisiones visuales anteriores está en esos documentos, no en esta presentación general.

## Estaciones e inventario

**Estado documental al 13/11/2026:** AE-00 a AE-04 ya estaban registrados y configurados para ingesta según el corte del 12/11. El titular informa la instalación de dos monitores el **13/11/2026**: **Escuela de Educación Agropecuaria de Carlos Casares**, en **Del Valle (partido de 25 de Mayo)**, y **Escuela de Educación Artística Lola Mora**, en **25 de Mayo**. Ambos quedaron conectados al Wi-Fi escolar y transmiten al portal público, según su reporte. El repositorio los asocia previamente con AE-04 y AE-01, respectivamente; no se revalidaron hardware, IDs ni transmisión actual. [Registro y límites de verificación](docs/INSTALACIONES_20261113.md).

| Código | PurpleAir `sensor_index` | Estado operativo comunicado |
| --- | ---: | --- |
| AE-00 | `198617` | Último reporte: apagado e instalación/reubicación pendiente; sin revalidación actual |
| AE-01 | `298687` | Lola Mora: instalado el 13/11/2026, Wi-Fi escolar y transmisión al portal según titular; sin verificación técnica actual |
| AE-02 | `298701` | Instalado en su escuela según titular; conectividad se verifica por última lectura |
| AE-03 | `298691` | Apagado al 01/11; instalación/reubicación pendiente |
| AE-04 | `298873` | Del Valle: instalado el 13/11/2026, Wi-Fi escolar y transmisión al portal según titular; sin verificación técnica actual |

Esta confirmación funcional de los **cinco índices habilitados** procede del titular y **no equivale a haber leído el contenido cifrado** de `SENSOR_INDEXES`. Las fechas de alta en PurpleAir, la instalación física, el estado registrado en D1 y la conectividad actual son asuntos distintos. Los datos de ubicación y evidencia de cada corte están en el [inventario de estaciones](docs/INVENTARIO_ESTACIONES.md) y en el [registro de altas](docs/instalacion/REGISTRO_PURPLEAIR.md).

También se integran sensores AirGradient de la red de Saladillo, con filtro de ubicaciones autorizadas y una identidad técnica por serial físico. No se debe inferir conectividad actual por la existencia de filas históricas. Ver [identidad AirGradient](docs/AQ02_CORRECCION.md).

## Arquitectura y recorrido de datos

```text
PurpleAir / AirGradient
        ↓  consultas del proceso de ingesta
Cloudflare Worker (worker/src/index.js)
        ↓  validación y almacenamiento
Cloudflare D1: sensores + lecturas
        ↓  API pública de lectura
Cloudflare Pages: dashboard LEMEIT · AQ
```

El Worker `purpleair-saladillo-api` atiende la API y el procesamiento; D1 `purpleair-saladillo` conserva metadatos y lecturas; la página principal está en `index.html`. Las mediciones tienen timestamp del proveedor, no necesariamente el instante de consulta. La deduplicación por sensor/timestamp evita duplicar filas, **pero no evita consumo de créditos en solicitudes al proveedor**.

El código relevante está en [`worker/src/index.js`](worker/src/index.js), la [configuración versionada del Worker](worker/wrangler.toml), el [esquema D1](d1/schema.sql) y el [script de ingesta Python](ingest_purpleair.py).

### API

| Endpoint | Función |
| --- | --- |
| `GET /api/sensores` | Metadatos de sensores |
| `GET /api/ultimas` | Últimas lecturas disponibles |
| `GET /api/historico/:sensor_index` | Historial por estación y rango |
| `POST /api/ingest-ahora` | Ingesta PurpleAir autenticada |
| `POST /api/ingest-ahora-airgradient` | Ingesta AirGradient autenticada |

Las rutas de lectura pueden registrar visitas en D1; **no usarlas como comprobación inocua** cuando la revisión exige estrictamente cero escrituras. Para formatos y parámetros, consultar la [documentación pública de API](https://app.lemeit.ar/aq/api.html). La administración y la ingesta requieren credenciales que **no se almacenan en el repositorio**.

## Ingesta y consumo PurpleAir

**Esquema operativo comunicado el 01/11/2026; cambio realizado el 29/10/2026:**

- **cron-job.org:** ingesta PurpleAir observada a los minutos **:27 y :57**, aproximadamente **cada 30 minutos**. El titular decidió mantener esta frecuencia. El historial visible mostró respuestas HTTP 200; no prueba por sí solo nuevas filas D1.
- **GitHub Actions:** su `schedule` automático está comentado en [`.github/workflows/purpleair-ingest.yml`](.github/workflows/purpleair-ingest.yml); queda ejecución manual.
- **Cloudflare:** el titular observó **cero Cron Triggers configurados** en producción. La configuración versionada declara explícitamente `crons = []` para mantener ese estado en futuros despliegues. AirGradient queda sin ingesta automática mientras se mantiene este esquema; revisar su cobertura antes de reconectarlo. Ver [conciliación, validación y reversión](docs/VERIFICACION_CONSUMO_PURPLEAIR_20261101.md#conciliación-de-la-configuración-versionada-02112026).

El endpoint `POST /api/ingest-ahora` ejecuta normalmente **una solicitud HTTP** a PurpleAir `/v1/sensors` con `show_only=SENSOR_INDEXES`, aunque algunos sensores estén apagados. Esto no implica una llamada por sensor. El uso de la API del **02/10 al 01/11** incluye la mayor parte del tiempo **anterior al cambio de frecuencia** del 29/10; no debe utilizarse su promedio mensual para juzgar el ahorro del nuevo esquema.

PurpleAir confirmó por correo una **donación adicional de 20 millones de puntos** para el proyecto. El saldo comunicado en el portal al 01/11 fue **19.992.888 puntos** (dato del momento, no saldo en tiempo real). Ver [verificación, costos, límites y decisiones](docs/VERIFICACION_CONSUMO_PURPLEAIR_20261101.md).

**No cambiar horarios, secretos ni disparadores sin autorización y verificación del deployment activo.** El alta y modificación segura de sensores está detallada en [operación PurpleAir](docs/OPERACION_PURPLEAIR.md). En particular, `SENSOR_INDEXES` es un Secret cifrado: GitHub documenta la lógica, no su contenido actual.

## Desarrollo y operación

- Leer [`AGENTS.md`](AGENTS.md) y las [prioridades versionadas](docs/PLAN_MEJORAS.md) antes de intervenir.
- Trabajar con ramas pequeñas y pull requests. Separar pruebas offline de verificación en producción.
- No ejecutar ingestas reales, migraciones, borrados D1, cambios de Secrets ni despliegues sin autorización explícita.
- No publicar claves ni datos sensibles. La [guía de operación PurpleAir](docs/OPERACION_PURPLEAIR.md) describe activación y reversión; el [índice de documentación](docs/README.md) reúne auditorías y criterios de aceptación.
- Para diagnóstico estático no invasivo, consultar [Healthcheck](docs/HEALTHCHECK.md); **no certifica integridad de datos ni frescura real**.

El código y la documentación en GitHub son la referencia versionada; la configuración efectiva de servicios externos (como cron-job.org y los Secrets Cloudflare) debe contrastarse con sus paneles cuando corresponda.

## Documentación histórica y decisiones

Las explicaciones extensas de incidentes, migraciones, detalles de visitas, consultas D1 y la evolución del diseño que anteriormente estaban mezcladas en este archivo se conservaron **sin pérdida** en [README histórico (corte 01/11/2026)](docs/README_HISTORICO_20261101.md). Ese archivo es evidencia histórica y no un manual de configuración actual.

Las fuentes de seguimiento recomendadas son [índice técnico](docs/README.md), [plan de mejoras](docs/PLAN_MEJORAS.md), [auditoría de integridad](docs/AUDITORIA_INTEGRIDAD_DATOS.md), [operación PurpleAir](docs/OPERACION_PURPLEAIR.md) y [verificación del consumo](docs/VERIFICACION_CONSUMO_PURPLEAIR_20261101.md).

## Proyecto educativo

Aire Escolar LEMEIT impulsa el monitoreo ambiental y la participación de escuelas y ciudadanía en Saladillo, con el objetivo de acompañar actividades de ciencias, análisis de datos y educación ambiental. El proyecto es desarrollado por Luciano Lamaita. La red utiliza aportes de PurpleAir Collective y otros actores de ciencia ciudadana; las posibles ampliaciones y alianzas futuras no deben confundirse con funciones ya desplegadas.

## Licencia

Código: MIT, según la declaración histórica del proyecto. Datos: atribución a los proveedores correspondientes, incluido [PurpleAir](https://www.purpleair.com), para uso educativo e informativo; verificar condiciones específicas de reutilización de cada fuente.

## Frescura compatible con la ingesta

La regla de frescura conserva las lecturas como recientes hasta **40 minutos inclusive**: 30 minutos entre ingestas más margen de envío y actualización del navegador. Superado ese límite se muestra «Sin datos recientes»; no significa equipo físicamente apagado. La ingesta permanece a :27/:57, y el dashboard conserva su consulta de cada 5 minutos. La regla se distribuye con el frontend; ver [registro del cambio](docs/ALTA_AE04_20261112.md).
