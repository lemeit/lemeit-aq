# Visualización: medición y grupos dentro de Leaflet

## Base y reproducción

Rama `codex/mapa-visualizacion-leaflet` desde main
`7b8205c9f829a927f30f1ef9f541a07f3be00b10`, confirmado por GitHub/fetch.
Frente a auditoría `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`: **58 commits
adelante, 0 detrás; 87 archivos, +7063/-454** antes del PR. Se revisaron AGENTS,
README, plan, índice, docs de mapa/#41/#42/#43 y código, Worker, D1 y workflows.
#43 fusionado; cero PR abiertos al comenzar. Sin duplicación encontrada.

La suite carga HTML y assets exactos de main: selector externo con rótulos
«Capa: …», después una franja Provincia/Capas y luego mapa. El mismo término
se usaba para medición y para grupos, con controles repartidos en dos lugares.
Captura de reproducción: `work/display-before-390.png`.

## Corrección y aceptación

Un **L.Control real** en `topright`, creado una sola vez, adopta los nodos
existentes del selector y checkboxes dentro del mapa. Botón cuadrado de **44 px**,
icono simple de ajustes, `title`/`aria-label` **Visualización** (EN **Display**),
`aria-expanded`/`aria-controls`; panel cerrado al iniciar. La cabecera queda
solo con «Mapa de sensores» y el mapa inmediatamente debajo. Sin Provincia,
franja externa, segundo selector o botón duplicado.

El panel distingue:

- **Medición / Measurement:** selector nativo de AQI · EPA, PM2.5, temperatura,
  humedad, presión, VOC, CO2 y NOx. Mismos valores, acceso a MAPA_PARAMS, unidades,
  `onchange=cargarMapa()` y lógica de disponibilidad de VOC/CO2/NOx según datos.
  No se deshabilitan ni eliminan opciones adicionales. Se retira el prefijo
  «Capa/Layer» y se asocia una etiqueta real mediante `aria-labelledby`.
- **Mostrar / Show:** Sensores AQ y Límites de partidos, independientes, ambos
  visibles inicialmente, reutilizando #43. Sin escuelas/EMAS ni relleno.

No se reconstruye el control al refrescar. El selector y los checkboxes son la
única fuente del estado de sesión. Cambiar medición con sensores ocultos guarda
la selección, mantiene puntos/leyenda ocultos y no afecta tarjetas ni datos. Al
mostrar, se utiliza medición y frescura actuales. Refresco, fallo API, recuperación,
idioma, tema y edad no restablecen preferencias ni centro/zoom. Una recarga de
página conserva los valores iniciales de #43 (sin localStorage nuevo).

El botón Provincia y su traducción/handler/CSS desaparecen; el encuadre PBA
inicial/fallback queda en una función interna de inicialización, sin acción
visible de recentrado. Pan/zoom libres. #41 continúa sin etiquetas HTML y #42
conserva las funciones completas de gráficos/fechas idénticas a main por hash.
AQI, prioridad reciente/gris, frescura 40 min, popup, orden e ingesta 30 min
intactos. «Sin datos recientes» no certifica apagado físico.

## Interacción y diseño

El control usa `disableClickPropagation`/`disableScrollPropagation`; teclas de
selector/checkboxes no llegan a navegación Leaflet, pero conservan su conducta
nativa. Apertura con Enter/Espacio/tap y foco en Medición; Escape devuelve foco
al botón. Clic fuera, Tab fuera y cierre mantienen la política de foco de #43:
retorno al botón si se pulsa el fondo, sin robar foco a otro control. El relleno
del panel puede recibir foco programático (`tabIndex=-1`), sin una parada Tab:
evita que un clic en su espacio vacío enfoque el mapa y cierre el panel.

Abrir Visualización cierra popup; abrir popup o iniciar navegación fuera del
control cierra el panel sin robar foco. No se superponen permanentemente menú
y popup. Panel de 210 px, ancho acotado al viewport, tipografía/colores LEMEIT
claro/oscuro. Selector 36 px, etiquetas de checkbox 40 px, botón 44 px. Se comprueban
contención y separación de zoom/leyenda/atribución en 320/390/1440 px.

Los mismos paneles de sensores y la misma capa/nodos SVG de límites de #43 se
ocultan y reponen; atribución correcta, sin recreaciones ni fetch al alternar.
El fondo CARTO, geometrías, procedencia y rótulos existentes no cambian.

## Verificación reproducible

```sh
node --test tests/*.test.mjs
node scripts/test-dashboard-format-pm25.cjs
python scripts/test-dashboard-display.py
python scripts/test-dashboard-map-markers.py
python scripts/test-dashboard-freshness.py
python scripts/test-dashboard-card-order.py
node --check assets/mapa-capas.js
node --check sw.js
node --input-type=module --check < worker/src/index.js
node scripts/healthcheck.mjs --offline
git diff --check
```

- **121 pruebas Node PASS**, sintaxis inline/control/SW/Worker y diff-check PASS.
- Chromium con Leaflet 1.9.4 real, hashes locales comprobados, geometrías existentes
  reales y transporte completamente interceptado: API ficticia, tiles transparentes
  (Visualización) o blancos (regresión previa), otros externos abortados; SW bloqueado.
- Suite Visualización: reproducción actual y aceptación 320/390/1440; único control
  Leaflet, cabecera/franja eliminadas, ocho mediciones, panel/toggles, ES/EN/temas,
  centro/zoom, API fallida/refresco/recuperación, envejecimiento oculto, prioridad
  reciente/gris en zoom 5/8/12, atribución/identidad/fetch, popup/tarjetas/orden.
  Touch/tap, rueda, arrastre, flechas nativas, Enter/Espacio/Escape/clic fuera/foco.
- Regresiones Chromium de marcadores, frescura y orden PASS; mantienen sus bases
  históricas identificadas y comprueban la rama actual. Las selecciones forzadas
  en la regresión de marcadores evitan abrir el panel repetidamente: la interacción
  nativa real, incluida la medición oculta, se prueba en la suite Visualización.
- Hash de funciones completas idéntico a main: `chartTickLabel`, `renderMiniChart`,
  `renderChart`, `renderChartCompare`, `pm25ToAqi`, `isStale`, `mapaMarkerState`,
  `mapaPopupHtml`, `sortSensorCards`, `aplicarVisibilidadSensores`.
- Healthcheck offline: 0 FAIL, 16 SKIP, WARN por Node 24 frente a 22 recomendado.

Los entrypoints históricos `test-dashboard-layers.py` y `test-dashboard-province.py`
delegan en la suite actual para no exigir controles retirados. Las 135 geometrías
siguen validadas como datos, sin crear un listado en el producto.

Capturas antes/después y de panel abierto/cerrado en `work/display-*.png`, en
320/390/1440 y ambos temas/idiomas: revisadas visualmente para minimalismo,
contenido y ausencia de desbordes. Son fixtures, no capturas de servicios reales.

## Alcance, límites y reversión

README e índice actualizados; #43 queda identificado como registro histórico.
PWA: nueva versión del shell para actualizar HTML y controlador; mismos assets,
sin plugin/dependencias ni descargas. Escuelas opcionales al acercarse y EMAS
siguen siendo etapas futuras sujetas a fuentes/licencias/actualización; sin
controles ni consultas de esos datos.

Sin API productiva (GET escribe visitas D1), proveedores, datos, ingestas,
migraciones, Worker/D1, cron, secretos, bajas ni cálculos/frecuencias modificados.
No se certifican WCAG completa, lector de pantalla, Node 22 o servicios reales;
#42 se verifica por identidad estática, no por nuevo ensayo visual Chart.js.
Conserva limitaciones de reloj/suspensión, CDN Leaflet y cartografía de origen.

Crear PR listo para revisión con `[CF-Pages-Skip]`, sin modificar Pages,
fusionar ni desplegar. Revertir mediante otro PR restaura cabecera/franja y
Capas de #43, conservando #41/#42 y sin restaurar datos. Cualquier publicación
productiva requiere autorización aparte.
