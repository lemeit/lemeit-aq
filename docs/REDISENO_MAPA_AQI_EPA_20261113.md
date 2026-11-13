# Mapa AQI · EPA — revisión del 13/11/2026

## Base verificada y coordinación

Rama `codex/mapa-aqi-epa-20261113`, desde main
`54776fdba6f674e583755435b75885c943b3f79f`, confirmado con fetch y GitHub.
Respecto de la auditoría `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`:
46 commits adelante, 0 detrás; 71 archivos, 5830 adiciones y 435 eliminaciones.
La auditoría es evidencia histórica, no descripción del código actual.

Se leyeron AGENTS, README, índice, plan, auditorías y documentación de mapa,
frescura, orden y trazabilidad; se inspeccionaron Worker, D1, workflows y scripts.
GitHub no tenía PR abiertos al comenzar. Se revisaron los 20 PR recientes,
incluido #18 cerrado, y los cambios reales de main:
#21 orden, #22 frescura, #23 formas sustituidas por #24 círculos,
#26 barra, #28 control interior y #32 frescura de 40 minutos, ya fusionados.
No existe actualmente un PR de frescura pendiente: las referencias documentales
a #22 abierto son históricas. Se reutilizan su parser UTC/offset, reloj local,
recuperación, tarjetas atenuadas, selección y actualización sin fetch extra.

La solicitud actual exige **25 minutos**, sustituyendo los 40 de #32 en UI y
validador offline. No revierte el alta AE-04 ni otros cambios de ese PR.
La ingesta sigue cada 30 minutos: habrá intervalos grises entre lecturas aun
con un equipo funcionando. Frescura no diagnostica encendido ni baja.
Coordinación registrada aquí, sin mensajes a terceros.

## Defectos reproducidos y cambio acotado

`scripts/test-dashboard-map-markers.py` carga primero el HTML exacto de
`54776fd` con Leaflet 1.9.4 real, reloj fijo y API ficticia. A 25 minutos + 1 ms
el marcador sigue coloreado en main; el popup AQI omite PM2.5 y sustituye el
nombre por la institución. El main además usa colores LEMEIT dependientes del
tema, en lugar de los RGB oficiales EPA pedidos.

Se conserva la capa «AQI · EPA», círculo compacto sin texto, blanco táctil de
44 × 44 px, leyenda interior de 240 px, controles y fuentes LEMEIT. Solo dentro
del contenedor del mapa se fijan colores EPA: verde #00E400 (0–50), amarillo
#FFFF00 (51–100), naranja #FF7E00 (101–150), rojo #FF0000 (151–200), violeta
#8F3F97 (201–300), granate #7E0023 (301–500 y extensión existente >500).
Fuente: [AirNow, Technical Assistance Document for the Reporting of Daily Air
Quality — the Air Quality Index](https://document.airnow.gov/technical-assistance-document-for-the-reporting-of-daily-air-quailty.pdf).
La categoría sigue derivándose de `pm25ToAqi` y `AQI_CATEGORIES`, intactos.
No se cambia la metodología: estimación desde PM2.5 disponible, no AQI diario
ni NowCast. Las tarjetas conservan su paleta LEMEIT.

PM2.5, temperatura, humedad y las demás mediciones conservan un único acento
LEMEIT sin rangos sanitarios: círculo lleno con valor, vacío sin valor,
gris claro solo cuando falta frescura. No se inventan escalas.

Popup de todas las capas: nombre del sensor, institución adicional, AQI,
PM2.5 con µg/m³, última medición en Argentina (año incluido) y estado;
las otras capas agregan su variable/unidad. Metadata escapada como texto.
Al vencer la lectura se muestran «—» para los valores, manteniendo fecha y
«Sin datos recientes». La tarjeta sigue visible y atenuada; el gauge no
presenta el AQI antiguo vigente. El shell PWA cambia de versión para evitar
servir el HTML previo tras una futura publicación autorizada.

## Criterios de aceptación y pruebas

- Seis categorías y colores oficiales estables en claro/oscuro, sin números ni
  etiquetas sobre puntos. Límites AQI heredados: 50/100/150/200/300/500.
- ≤25 minutos reciente; +1 ms, futuro, NULL y timestamp inválido grises.
  D1 sin zona como UTC; offsets equivalentes; calendarios imposibles rechazados.
- Envejecimiento local en mapa y tarjetas aun con API caída o solicitud pendiente,
  sin fetch adicional; recuperación automática con lectura nueva válida.
- Popup completo en cada capa, con valores antiguos suprimidos; nombres hostiles
  escapados. Cambio de capa sin pérdida de estado ni escalas adicionales.
- Orden AE ascendente, después sin AE y PurpleAir sin AE al final, conservando
  proveedor e identidad; sin reinterpretar AE que ya son PurpleAir.
- Móvil 320/390 px y escritorio 1440, ES/EN, claro/oscuro, sin desborde ni
  solapamiento con atribución/zoom/selector; Enter/Space/Escape, foco devuelto,
  nombre accesible y objetivo táctil de 44 px.

Comandos reproducibles desde la raíz (Chromium `/usr/bin/chromium`, Python con
Playwright; Leaflet local en `work/leaflet-1.9.4`, hashes comprobados por script):

```sh
node --test tests/*.test.mjs
node scripts/test-dashboard-format-pm25.cjs
python scripts/test-dashboard-map-markers.py
python scripts/test-dashboard-freshness.py
python scripts/test-dashboard-card-order.py
python scripts/test-dashboard-latest-measurement.py
node --check sw.js
node --input-type=module --check < worker/src/index.js
node scripts/healthcheck.mjs --offline
git diff --check
```

Resultados: Node 119 PASS; formatPm25 y sintaxis inline PASS; cuatro suites
Chromium PASS. Mapa: reproducción de main actual y aceptación con Leaflet real;
frescura, orden y última medición: sus reproducciones históricas siguen usando
las bases indicadas en cada script, además de comprobar el HTML nuevo.
Pruebas HTTP/red/payload inválido y recuperación con fixtures; ninguna llamada
a API productiva, proveedores ni tiles reales. Healthcheck offline: 0 FAIL,
16 SKIP, 1 WARN por Node 24.19.0 frente a 22 recomendado.
Capturas locales de fixtures: `work/control-after-{320,390,1440}.png`.

## Límites, publicación y reversión

No se certifican lector de pantalla real, WCAG completa, Node 22, cartografía
productiva, frescura efectiva de equipos ni API productiva. Las rutas GET API
pueden escribir visitas en D1: se validan con mocks, no se consultan en vivo.
Depende del reloj del cliente; la suspensión puede demorar la actualización
hasta reanudar. Puntos coincidentes pueden requerir zoom o teclado.

Sin cambios en Worker, D1, cálculos, ingestas, frecuencias, bajas o datos.
Sin migraciones, ingestas reales, merge ni despliegue. Commit con
`[CF-Pages-Skip]` para omitir preview automático; no cambiar configuración
Pages. El PR queda para revisión. Revertir este PR mediante otro PR restaura
40 minutos y el popup/paleta anteriores, sin restaurar datos. No desplegar
la reversión sin autorización.
