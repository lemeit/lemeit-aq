# Aclaración pública sobre la última medición

Fecha: 13 de octubre de 2026, Argentina.
Rama: `fix/ultima-medicion-aclaracion`.
Base: main remoto `8d85f9eeac3f2955ebde4f4c5885dab3eb0637dc`, verificado antes de editar.
Referencia auditada: `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`.

## Inspección y semántica

Se leyeron AGENTS.md, README.md y el recorrido D1→API→UI. Main tiene 14 commits posteriores a la referencia, 34 archivos cambiados, 2870 líneas añadidas y 78 eliminadas. Incluye auditorías/healthcheck, AQ-01 y la restauración de formatPm25 en JavaScript por PR #13. PR #11 fusionó la corrección de identidad AirGradient en Worker, schema y migración 009; la vista de última lectura conserva su semántica. Python de ingesta no cambió; no se presume que main esté desplegada ni se consulta producción.

`v_ultima_lectura` usa MAX(timestamp) por sensor; `/api/ultimas` entrega esa lectura y el frontend calcula el indicador desde `s.pm2_5`. No calcula un promedio del día. El número destacado es un indicador derivado, no la concentración cruda ni una medición física de AQI.

Por esa distinción se ajusta mínimamente la frase solicitada:

> Este indicador se calcula a partir de la última medición de PM2.5 del sensor. No representa el promedio del día.

Inglés:

> This indicator is calculated from the sensor’s latest PM2.5 measurement. It does not represent the daily average.

No se atribuye un período horario, instantáneo o diario a la muestra del proveedor. Se conserva la aclaración ya existente de que no es AQI diario ni NowCast.

## Cambio

Tres líneas añadidas en index.html: una traducción por idioma y un párrafo con clase card-sub directamente debajo de la etiqueta del indicador. `buildSensorCardInner` se comparte entre Actuales y Mapa. El texto se vuelve a renderizar con el idioma existente; no se agrega un mecanismo de traducción paralelo.

El párrafo es texto visible y no aria-hidden, no depende de tooltip ni interacción. Reutiliza estilos y ajuste de línea existentes. No modifica valor, cálculo, colores, fecha, umbral de frescura, badge ni advertencia de datos desactualizados. No hay cambios de CSS, API, Worker, D1, ingesta, workflows o sources/. Se incorpora un harness reproducible offline, además de esta documentación.

## Reproducción y aceptación

En Chromium offline se cargó el HTML completo de main obtenido con git show 8d85f9eeac3f2955ebde4f4c5885dab3eb0637dc:index.html: la frase no existe. Se cargó después el HTML modificado. Todas las solicitudes fueron interceptadas: solo se respondieron el documento y `/api/ultimas` con dos sensores sintéticos (PM2.5=8, uno reciente y otro de hace 120 minutos). Recursos externos y otras rutas abortados; service workers bloqueados. El HTML de la prueba sustituye API_BASE solo en memoria por fixture.invalid. No hubo transporte real a producción.

Criterios verificados:

1. El texto aparece en las dos tarjetas, próximo al indicador y antes de las métricas.
2. Cambiar ES→EN→ES actualiza la frase mediante setLang.
3. La lectura antigua conserva badge Sin datos/No data y advertencia de más de 25 minutos.
4. A 390×844 y 1440×844 el párrafo es visible, ajusta líneas y no añade desbordamiento horizontal.
5. El generador con prefijo mapa- incluye la misma aclaración. No se inició Leaflet ni se descargaron mosaicos.
6. No hubo excepciones JavaScript durante el recorrido probado.

La captura móvil fue inspeccionada visualmente: texto visible entre gauge y métricas, advertencia de antigüedad conservada. Se verificó que el párrafo no esté oculto a accesibilidad; esto no equivale a una auditoría completa con lector de pantalla.

## Validación

- Smoke offline Chromium/Playwright: PASS. La primera ejecución restringida falló al iniciar Chromium por setsockopt no permitido; la ejecución autorizada fuera de esa restricción completó la prueba con todas las solicitudes interceptadas. No se desactivó TLS.
- `node scripts/test-dashboard-format-pm25.cjs`: PASS, incluida sintaxis de scripts inline y ubicación del helper.
- `node tests/aq-01.acceptance.test.mjs`: 12/12 PASS.
- `node tests/data-integrity.audit.test.mjs`: 35/35 PASS. Los otros hallazgos siguen como reproducciones, no correcciones.
- Sintaxis Worker y service worker: PASS.
- `git diff --check`: PASS.
- Diff de Worker, D1, scripts, workflows y sources/ respecto de la base: vacío.

Prueba reproducible: `python -B scripts/test-dashboard-latest-measurement.py` desde cualquier directorio del checkout. Requiere Python, el paquete Playwright y Chromium instalado en /usr/bin/chromium; este entorno ya los proporciona. No instala nada ni descarga navegadores. Compara el HTML completo del commit base fijo con el actual, intercepta todo HTTP y no depende de main futura. Si la restricción de sockets impide iniciar Chromium, ejecutar mediante el mecanismo de permisos del entorno; no relajar TLS ni contactar producción. Capturas temporales: /tmp/aq-ultima-390.png y /tmp/aq-ultima-1440.png.

La prueba cubre renderizado y semántica básica del párrafo; no se verifican servicios externos ni una auditoría completa WCAG. No se agregan dependencias a la aplicación.

## Publicación y reversión

Los workflows versionados solo se ejecutan por schedule/workflow_dispatch; no disparan por push/PR. GitHub muestra un check Cloudflare Pages exitoso en main. La documentación de Branch control indica previews incluidos con `*` salvo exclusiones exactas.

El usuario autorizó expresamente los previews automáticos de Pages al publicar esta PR y la documental AQ-02 independiente. La exclusión de estas ramas deja de ser requisito. No se cambia configuración de Pages ni se abre el preview, que podría consultar la API productiva. La autorización no cubre merge, auto-merge, despliegue Worker, D1, ingestas ni escrituras productivas. La publicación se registra en la descripción de la PR.

Antes de merge, descartar la PR no afecta producción. Una reversión posterior consiste en retirar esas tres líneas mediante otra PR autorizada; no requiere restaurar datos. Fusionar o revertir en main puede desplegar Pages y requiere autorización independiente. Este encargo no autoriza merge ni despliegue.
