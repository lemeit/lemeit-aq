# Aclaración general del indicador: última medición, no promedio diario

> Registro histórico de la PR #16. El texto y la prueba descritos debajo fueron
> reemplazados por la aclaración breve y la trazabilidad documentadas en
> [AQI_TRAZABILIDAD.md](AQI_TRAZABILIDAD.md). No usar estas frases históricas como
> descripción de la interfaz propuesta actual. Los textos históricos «Sin datos»
> y la advertencia antigua se sustituyen en la propuesta
> [AQ-09](FRESCURA_SENSORES.md) por «Sin datos recientes», con pruebas offline
> actualizadas; pendiente de merge/despliegue.

Base verificada: main `e42fe013d565ec67898a70609b114ad6abf1dc93`.
Rama correctiva: `fix/aclaracion-general-indicador`.

## Ubicación y semántica final

La aclaración general existente es el párrafo `data-i18n="aqi_sample_note"`
al comienzo de main, debajo de la navegación y antes de las secciones.
La ayuda del indicador se abre desde el ícono de información; utiliza
`info_aqi_body_html`. Este cambio actualiza ambos textos, no agrega bloques.

Texto público general en español:

> Indicador calculado a partir de la última medición de PM2.5 del sensor, en escala EPA. No representa el promedio del día; no es AQI diario ni NowCast. Período de la muestra no verificado.

Inglés:

> Indicator calculated from the sensor’s latest PM2.5 measurement on the EPA scale. It does not represent the daily average; it is not daily AQI or NowCast. Sample period unverified.

El número es derivado de PM2.5 de la última lectura disponible: D1 usa
MAX(timestamp) por sensor y la API entrega esa lectura. No calcula un promedio
del día ni verifica el período efectivo reportado por el proveedor. La ayuda
conserva la distinción EPA/AirNow, AQI diario y NowCast y el tratamiento numérico
existente. No cambian cálculo, umbrales, fecha ni unidad.

## Corrección de ubicación

PR #14 añadió un párrafo en cada tarjeta porque se interpretó que el usuario
se refería al indicador individual. El usuario aclaró que se refería al aviso
general existente y pidió no llenar las tarjetas. Esta propuesta retira ese
`p.card-sub` y las dos traducciones `card_measurement_note` que quedarían huérfanas.
No se reemplaza con otro texto dentro de las tarjetas de Actuales o Mapa.
Las advertencias de datos antiguos, badge, gauge y hora siguen intactos.

Se conserva el párrafo general visible, no aria-hidden y con sus estilos de
ajuste de línea. Se utilizan el mismo mecanismo ES/EN y la misma ayuda; no se
agrega un nuevo mecanismo de accesibilidad, traducción o CSS.

## Reproducción y pruebas reproducibles

`python -B scripts/test-dashboard-latest-measurement.py` compara el HTML completo
de la base e42fe01 con el corregido. Requiere Playwright y /usr/bin/chromium,
disponibles en el entorno; no instala dependencias. API_BASE se reemplaza solo
en memoria por fixture.invalid. Todas las solicitudes se interceptan: documento
y dos sensores sintéticos (uno reciente, otro de hace 120 minutos); otras rutas
y recursos externos abortados y service workers bloqueados. No ejecuta frontend
productivo ni consulta su API.

La base reproduce dos textos en tarjetas y la aclaración general anterior.
La versión corregida verifica:

- Frase general exacta y visible en ES/EN a 390×844 y 1440×844.
- Ausencia de párrafos añadidos en tarjetas, incluidas las generadas con prefijo mapa-.
- Ausencia completa de la clave huérfana card_measurement_note.
- Ayuda en inglés con última medición y no promedio diario; ES también presente en el código.
- Badge Sin datos/No data y advertencia de más de 25 minutos conservados.
- Párrafo general no aria-hidden, sin desbordamiento horizontal ni excepciones JS.

Resultados: smoke Chromium offline PASS; regresión formatPm25 y sintaxis inline
PASS; AQ-01 12/12 PASS; integridad 35/35 PASS; sintaxis Worker/service worker y
git diff --check PASS. Los PASS de otras reproducciones no certifican su corrección.
Captura móvil inspeccionada: aviso general sobre tarjetas y tarjetas compactas,
sin el párrafo retirado. Capturas en /tmp/aq-ultima-{390,1440}.png.

Límites: no se inicia Leaflet/CARTO ni se verifican librerías externas o datos
productivos. No es una auditoría completa WCAG o de lector de pantalla. Se
prueba accesibilidad básica del párrafo y se preservan controles existentes.

## Publicación y reversión

Los previews Pages están expresamente autorizados. No se cambia configuración
ni se abre un preview, que podría consultar la API productiva. No merge,
auto-merge, despliegue Worker, migración D1, ingesta ni escritura productiva.
La confusión reportada era sobre la referencia textual, no un defecto de caché
que deba corregirse en sw.js; no se modifica service worker ni APP_VERSION.

Reversión: retirar este commit en otra PR autorizada; volvería la ubicación
anterior en tarjetas. No hay datos ni esquema que restaurar. Merge/reversión
en main puede desplegar Pages y requiere autorización independiente.
