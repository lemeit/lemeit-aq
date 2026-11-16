# Vista provincial PBA y nombres de partidos

## Base y alcance

Rama `codex/mapa-provincia-partidos`, desde main
`797ce96a2ba8ddace89d2db62dafeaad2413d2be`, confirmado por fetch y GitHub.
Durante la tarea se fusionó #39: la rama se rebasó sin conflictos sobre
**`af80eb22cb903b9d22364b75dec45245f9f65e7c`**. Su `index.html` es idéntico
por SHA de blob al de 797ce96 usado en la reproducción; se conservó la nueva
documentación de instalaciones.
Respecto de auditoría `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`: **52 commits
adelante, 0 detrás; 75 archivos, +6316/-435** antes de este PR. Se leyeron
AGENTS, README, índice, plan, auditoría y documentos de mapa/prioridad/frescura;
se inspeccionaron Worker, D1 y workflows. PR #38 confirmado fusionado, igual que
#37 y los recientes; ningún PR abierto al comenzar. Sin duplicado encontrado. #39 documenta instalaciones y no duplica mapa; ambas secciones de README/índice quedaron conservadas al rebasar.

La etapa aprobada es cartográfica: toda la provincia de Buenos Aires al abrir
el mapa, exploración libre y nombres reales de **partidos**, no cabeceras.
Se conserva AQI, prioridad recientes sobre grises, frescura 40 minutos, ingesta
cada 30 minutos, orden y popups. «Sin datos recientes» no certifica apagado físico.

## Reproducción y comportamiento

La prueba carga primero `index.html` exacto de main `797ce96` con Leaflet real
y sensores ficticios cercanos a Saladillo: el encuadre solo cubre el entorno
local y una referencia de 25 de Mayo; no hay capa con los 135 partidos.

Ahora el encuadre inicial deriva del bbox de la capa provincial local, no de
sensores ni de una estación EMAS. No hay `maxBounds`, recorte o restricción de
pan/zoom: se puede explorar bordes y estaciones. El botón **Provincia** restaura
la vista completa; el selector **Partidos PBA** permite acercarse a cualquiera
de los 135 distritos, incluidos los pequeños del AMBA. Se reserva margen para
la leyenda al seleccionar un partido. Altura móvil de mapa: 400 px.

El fondo CARTO existente se conserva, sin nuevos servicios, estilos no admitidos
por el Worker, claves o planes pagos. Sus rótulos de localidades pertenecen al
fondo: la nueva capa lleva explícitamente **«Partido»** sobre el nombre para no
confundir ciudad con jurisdicción (ej.: General Pueyrredón, no Mar del Plata).
Límites distritales tenues y etiquetas con halo usan colores LEMEIT; EPA y brillo
de sensores intactos.

Paneles territoriales z-index 350/410, sin interacción del puntero ni tabulación;
quedan bajo grises 590 y recientes 610 de #38. No se utilizan marcadores Leaflet
para etiquetas: el refresco de sensores no borra la geografía. Las etiquetas
están ocultas al lector de pantalla; los 135 nombres están en el selector nativo
con nombre accesible. No interceptan clic, arrastre o foco de sensores.

A zoom ≤6 se admiten hasta 10 etiquetas en ventanas <600 px y 22 en escritorio;
a más zoom se eliminan esos topes, manteniendo detección de colisiones. Se
prioriza el partido seleccionado y luego área geográfica descendente con orden
estable. No se intenta mostrar 135 nombres a escala provincial. Se excluyen las
cajas táctiles de sensores, controles y etiquetas ya colocadas. Desplazamientos
cortos del texto en píxeles evitan choques; no se alteran coordenadas ni límites.

Cambiar capa, recibir mediciones, fallar la API o cambiar idioma/tema conserva
el encuadre manual. `invalidateSize` solo se usa cuando cambia el tamaño real,
para evitar el redondeo/recentrado subpíxel de Leaflet al refrescar datos. Leaflet
inicia la vista aun si falla la API al abrir: la geografía no depende de ella.

## Datos, licencia y límites de procedencia

[Procedencia y regeneración detalladas](../assets/geo/README.md): ARBA vía IGN,
135 partidos, geometrías originales con metadatos `GNA=Partido`, `FNA`, `NAM` y
`SAG=ARBA - Gerencia de Servicios Catastrales`. Fuente primaria verificada:
[catálogo oficial PBA](https://catalogo.datos.gba.gob.ar/dataset/partidos), con
licencia **CC BY 4.0**. Atribución visible y enlace a licencia en el mapa.

La política de red impidió descargar directamente el ZIP oficial (403). Los
bytes proceden de un **espejo público no institucional**, fijado por commit y
SHA-256; no se certifica que sea idéntico a la última versión del catálogo.
Se conserva la anomalía del identificador de origen de La Plata, sin presentarlo
como código oficial ni usarlo para sensores. Se excluyen 15 comunas CABA del
recurso fuente. Fecha de relevamiento no disponible; esta limitación se entrega
al revisor y no se oculta bajo la fecha de actualización del catálogo.

Recurso local 257 KB (≈78 KB gzip), simplificado a 0,0015° con topología por
polígono y cinco decimales; puntos interiores calculados de geometrías reales,
no coordenadas inventadas. Shapely 2.1.2 se usa solo para regeneración offline:
sin nuevas dependencias del navegador. No es límite catastral/legal ni garantiza
encaje topológico perfecto a gran zoom. No hay actualización geográfica remota
en tiempo de uso; revisar una nueva edición mediante otro PR.

## Aceptación y pruebas

- Encuadre PBA completo en 320/390/1440 px, pan fuera de provincia y vuelta por
  botón/teclado, sin overflow horizontal.
- 135 nombres seleccionables y geometrías de partidos (sin comunas CABA),
  incluidos Saladillo, 25 de Mayo, Lezama y General Pueyrredón.
- Densidad provincial limitada, etiquetas sin colisiones entre sí, con controles
  o sensores; consulta por selección y zoom a cada distrito; claro/oscuro.
- Acceso a sensores por clic/Enter/Space/Escape y foco; prioridad de #38,
  envejecimiento/recuperación, EPA, 40 minutos y orden conservados.
- Centro/zoom manual sin cambio de capa, refresco de API, idioma/tema o error;
  la API fallida no elimina mapa/geografía.

```sh
node --test tests/*.test.mjs
node scripts/test-dashboard-format-pm25.cjs
python scripts/test-dashboard-province.py
python scripts/test-dashboard-marker-priority.py
python scripts/test-dashboard-map-markers.py
python scripts/test-dashboard-freshness.py
python scripts/test-dashboard-card-order.py
node --check assets/mapa-pba.js
node --check assets/geo/pba-partidos.js
node --check sw.js
git diff --check
```

Las suites Chromium usan Leaflet 1.9.4 y capa territorial reales, API sintética,
tiles ficticios (transparentes en la suite PBA, blancos en las regresiones previas) y externos abortados; SW bloqueado. La suite PBA reproduce
main actual y selecciona los 135 distritos a 390 px; las suites previas conservan
sus reproducciones históricas identificadas. Capturas locales
`work/pba-{320,390,1440}-{light,dark}.png` y de Saladillo/25 de Mayo son fixtures,
no cartografía o sensores productivos. Resultados: **121 pruebas Node PASS**, formatPm25/sintaxis inline, sintaxis de
assets/SW/Worker y `git diff --check` PASS. Suites Chromium de vista PBA, mapa,
frescura y orden PASS; prioridad #38 verificada con Leaflet real y capa local.
La suite PBA incluye fallo de API al abrir y fallo de recursos geográficos: el
fallback conserva vista provincial/sensores y deshabilita el selector sin datos.
Resultados finales y límites también en el PR.

## EMAS, operación y reversión

**EMAS es una etapa futura incremental**, con revisión de fuentes, contratos e
identidades antes de integrarla. No se consultan/importan estaciones ni datos de
su portal en este PR, ni se simulan estaciones futuras en el producto.

Sin API productiva (GET escribe visitas D1), proveedores ni cambios de Worker,
D1, cálculos, ingestas, cron, frecuencia, secretos, bajas o datos reales.
Sin merge ni despliegue; commit con `[CF-Pages-Skip]` para omitir preview. PWA:
nueva versión del shell y dos recursos locales en precaché. Las librerías CDN
no se incluyen: primera carga sin red sigue dependiendo de Leaflet ya disponible.
No se certifican WCAG completa, lector de pantalla real, datos operativos ni
Node 22 (pruebas Node 24). Healthcheck offline: 0 FAIL, 16 SKIP y 1 WARN por esa versión de Node. El fondo CARTO y sus rótulos se verifican por contrato
con fixtures, no mediante descarga de mosaicos reales. Revertir este PR restaura
encuadre local y quita capa/controles PBA; conserva #38. Cualquier despliegue o
reversión productiva requiere autorización aparte.
