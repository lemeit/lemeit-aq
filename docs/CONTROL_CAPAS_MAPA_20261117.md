# Control compacto Capas — 17/11/2026

## Base, reproducción y coordinación

Rama independiente `codex/mapa-control-capas`, desde main
`f2463ef72a615142029f9ebb16dd2f7b34751b3b`, confirmado por GitHub/fetch.
Comparación con auditoría `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`:
**56 commits adelante, 0 detrás; 84 archivos, +6849/-455** antes de este PR.
AGENTS, README, índice, plan y docs de mapa, frescura/prioridad, #41 y #42
revisados, junto con Worker, D1, workflows y scripts. #38/#40/#41/#42 fusionados;
cero PR abiertos al comenzar. No hay duplicado del control propuesto.

La reproducción con el HTML **y assets exactos de main** muestra el selector
con 135 partidos, sin botón de grupos Capas. #41 ya eliminó etiquetas HTML:
no se reintroducen `pbaLabels` ni nombres duplicados. #42 cambió fechas de los
gráficos: sus funciones y callbacks completos se conservan idénticos por hash.
Se sustituyen selector/listado y su lógica de selección, sin crear otro listado.

## Decisión e implementación

La barra conserva **Provincia** y agrega un único botón **Capas**. El selector
de parámetro AQI/PM2.5/etc. sigue independiente. Panel cerrado inicialmente,
con dos checkboxes nativos: **Sensores AQ** y **Límites de partidos**. Ambos
visibles por defecto: no hay motivo para cambiar la referencia territorial
actual. No se agregan controles de escuelas/EMAS ni opciones deshabilitadas de
relleno. El fondo CARTO y sus rótulos no se alteran ni se tratan como una capa
administrativa nueva.

Sensores: se ocultan únicamente los paneles Leaflet `mapaStale` y `mapaRecent`
con `display:none`. Los nodos quedan fuera de la interacción/foco y árbol de
accesibilidad mientras están ocultos; las tarjetas, datos y reloj siguen activos.
Se cierra cualquier popup de sensor al ocultarlos. La leyenda se oculta también,
para no sugerir que hay puntos visibles. Al mostrar, reaparecen la leyenda y los
marcadores en su estado de frescura actualizado, sin pedir mediciones extras.
No se cambia la prioridad 590/610 ni colores/brillo EPA.

Límites: se conserva la misma capa GeoJSON, el panel y los nodos SVG. Se oculta
el panel sin reconstruir geometrías ni recargar assets/tiles/API. Atribución
ARBA/IGN + CC BY 4.0 retirada mientras está oculto y repuesta una sola vez al
mostrarlo. Se conserva OSM/CARTO y el bbox provincial. No se descarga ni cambia
el recurso geográfico ni su procedencia/licencia existente.

Las preferencias se guardan en los checkboxes de esta sesión del dashboard:
persisten en refrescos de datos, cambio de parámetro, idioma/tema, error de API,
envejecimiento y recuperación, sin recentrar. Al recargar la página se vuelve
al estado inicial aprobado (ambos visibles, panel cerrado), sin introducir
persistencia local adicional. Si no carga el recurso geográfico, el checkbox
real de límites queda deshabilitado, manteniendo Provincia y sensores.

## Accesibilidad y móvil

Botón con `aria-expanded`/`aria-controls`, grupo con nombre accesible traducido,
checkboxes con etiquetas asociadas y blanco de etiqueta de 40 px. Al abrir se
enfoca el primer checkbox. Escape o cierre desde botón retorna a Capas. Tabular
fuera cierra sin alterar el destino; un clic fuera cierra, devuelve foco al botón
si se pulsa el fondo y conserva el foco si se pulsa otro control (incluido mapa),
para no interferir con la selección de parámetro o navegación. No se aplica una
trampa de foco propia de un diálogo modal a este pequeño disclosure.

Panel de 224 px, acotado al viewport y anclado a la barra; estilo LEMEIT en ambos
temas, etiquetas ES/EN, sin desborde a 320/390/1440 px. No intercepta el mapa
cuando está cerrado. Se retiró CSS sobrante de etiquetas HTML eliminadas en #41.

## Criterios de aceptación

1. Main reproduce selector/listado y ausencia de Capas; rama elimina selector y
   listado, sin etiquetas duplicadas ni nuevas capas.
2. Panel cerrado al inicio; sensores y límites visibles, PBA completa y pan libre.
3. Dos toggles independientes, sin cambios en tarjetas/datos; leyenda/popup
   coherentes; límites sin recreación ni fetch, atribución correcta sin duplicados.
4. Estado persistente durante parámetro/refresco/API fallida/recuperación/idioma/
   tema. Lectura exactamente 40 min reciente; +1 ms envejece aun oculta y se
   muestra gris al reactivar; lectura nueva recupera color mientras está oculta.
5. Recientes encima de grises con zoom alejado; popup y foco/Enter/Space/Escape
   de sensores conservados; límites no capturan puntero. Orden AE intacto.
6. Móvil 320/390 y escritorio 1440: panel contenido, teclado y cierres accesibles,
   navegación manual conservada y Provincia operativo.
7. #42 (fechas de gráficos), AQI, timestamps, frescura 40 min, ingesta cada 30 min
   y backend/contratos intactos. «Sin datos recientes» no certifica apagado físico.

## Pruebas y evidencia

```sh
node --test tests/*.test.mjs
node scripts/test-dashboard-format-pm25.cjs
python scripts/test-dashboard-layers.py
python scripts/test-dashboard-map-markers.py
python scripts/test-dashboard-freshness.py
python scripts/test-dashboard-card-order.py
node --check assets/mapa-capas.js
node --check assets/mapa-pba.js
node --check sw.js
node --input-type=module --check < worker/src/index.js
node scripts/healthcheck.mjs --offline
git diff --check
```

Leaflet 1.9.4 JS/CSS locales con SHA-256 comprobado, geometrías existentes reales,
API ficticia y tiles transparentes (PBA/Capas) o blancos (regresión previa).
Toda solicitud interceptada; otros externos abortados y SW bloqueado. No se
consulta el portal productivo ni proveedores. El viejo entrypoint
`test-dashboard-province.py` delega en la suite Capas; se retira la prueba del
selector inexistente. Las 135 geometrías/nombres se siguen validando como datos,
sin mostrarlos como listado. Reproducciones históricas de suites anteriores
mantienen sus bases identificadas, además de comprobar la rama actual.

Capturas `work/layers-before-390.png`, `work/layers-{320,390,1440}-closed.png` y
`work/layers-{ancho}-{es,en}-{light,dark}-open.png`: fixtures sin tiles reales,
revisadas visualmente; no acreditan operación de sensores ni cartografía remota.
Resultados: **121 pruebas Node PASS**, suite Capas PASS con reproducción actual
y aceptación a 320/390/1440, y regresiones Chromium de marcadores, frescura y
orden PASS. formatPm25/sintaxis inline, sintaxis control/PBA/SW/Worker y diff-check
PASS. Healthcheck offline: 0 FAIL, 16 SKIP, 1 WARN por Node 24 frente a 22.
Resultados también en el PR.

Verificación de conservación: `chartTickLabel`, `renderMiniChart`, `renderChart`
y `renderChartCompare` idénticas completas a main, así como `pm25ToAqi`,
`isStale`, `mapaMarkerState`, `mapaPopupHtml` y `sortSensorCards`.

## Etapas siguientes, límites y reversión

[Mapa Escolar ABC](https://mapaescolar.abc.gob.ar/mapaescolar/) se usa únicamente
como inspiración del control sencillo, según la referencia ya revisada por
usuario/asistente. No se abrió ni integró un iframe, no se descargaron sus datos
ni se agregaron servicios/dependencias. Escuelas opcionales al acercarse y EMAS
quedan para etapas posteriores, sujetas a revisar fuentes, licencias, contratos
y actualización antes de importar o mostrar datos. No hay controles de relleno.

PWA: versión nueva del shell y controlador local en precaché. Primera carga
requiere Leaflet CDN disponible, igual que antes. No se certifican lector de
pantalla/WCAG completa, Node 22 ni servicios reales; pruebas en Node 24. No se repite una validación visual de Chart.js: #42 se comprueba por identidad
estática de funciones completas, no como una prueba nueva de gráficas. Se
conservan las limitaciones de reloj/suspensión y de procedencia cartográfica
registradas en `assets/geo/README.md`. Conmutar límites no oculta los rótulos
incluidos en los mosaicos CARTO: son parte del fondo, no etiquetas HTML nuevas.

Sin cambios de cálculos, Worker/D1, ingestas, cron, frecuencia 30 min, secretos,
bajas, migraciones ni producción. Sin merge ni despliegue. Commit con
`[CF-Pages-Skip]`, sin cambiar configuración Pages. Revertir este PR mediante
otro PR restaura selector y visibilidad previa; conserva #41/#42 y no requiere
restaurar datos. Cualquier publicación productiva requiere autorización aparte.
