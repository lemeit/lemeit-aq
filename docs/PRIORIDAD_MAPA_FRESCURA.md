# Prioridad de marcadores y frescura de 40 minutos

## Base y revisión

Rama independiente `codex/mapa-prioridad-frescura` desde main
`a541d7c81e9b5dcda9d7d9f78080ae9ce26a8c1a`, confirmado en GitHub.
Comparación con auditoría `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`:
48 commits adelante, 0 detrás; 72 archivos, +5996/-434 antes de este cambio.
Se revisaron AGENTS, README, índice, plan y documentos de mapa, frescura y orden,
así como Worker, D1, workflows y adaptadores de pruebas. GitHub confirmó #37
fusionado, #32 y demás PR recientes integrados y ningún PR abierto al iniciar.
La publicación de #37 fue informada por el titular; no se consultó producción.
No se encontró corrección duplicada de prioridad de dibujo.

## Reproducción y solución

Leaflet 1.9.4 asigna prioridad de marcadores según su coordenada vertical.
Con fixtures cercanos, reciente al norte y gris al sur, el main citado pinta
el gris encima al alejar a zoom 8. Coincidencias también dependen del orden de
inserción. No basta con ordenar la respuesta API ni asignar un pequeño offset.

Se crean dos paneles Leaflet: `mapaStale` con z-index 590 y `mapaRecent` con
610. Ambos están sobre cartografía y bajo tooltips/popups. La prioridad entre
paneles no depende de la latitud, zoom, orden API ni `riseOnHover`. Al vencer
una lectura se actualiza la opción `pane` y se mueve el nodo existente, porque
`setIcon` puede reutilizarlo; la recuperación aplica el mismo camino. Refrescar
la API y cambiar de capa reconstruyen marcadores con el panel correspondiente.
Una lectura reciente sin valor de la capa sigue en el panel de frescura reciente.

Los grises no se eliminan ni pierden rol, nombre, foco, popup o teclado.
Un gris totalmente coincidente puede quedar cubierto visualmente por el reciente,
pero se puede enfocar por teclado y consultar en su tarjeta. No se desplazan
coordenadas ni se cambia geometría, brillo, paleta EPA, orden de tarjetas o AQI.
El shell PWA cambia de versión para distribuir el HTML en una futura publicación.

## Decisión de frescura autorizada

La instrucción inicial de conservar 25 minutos fue sustituida expresamente por
el titular: este mismo PR fija **40 minutos inclusive** en frontend y diagnóstico
offline. La ingesta continúa cada **30 minutos (:27/:57)** y el navegador consulta
cada **5 minutos**. La medición del proveedor puede ser anterior a su consulta;
10 minutos de margen reducen falsos grises entre ciclos normales sin aumentar
frecuencia, consumo de PurpleAir ni cambiar timestamps almacenados.

30 minutos exactos dejarían menos margen para ese desfase y para el refresco de
pantalla. 40 tolera 10 minutos adicionales, a costa de demorar ese tiempo la
indicación de falta de datos. No garantiza continuidad si el proveedor o la red
se retrasan más. Una edad válida de 0 a 40 minutos es reciente; 40 min + 1 ms,
fechas futuras, inválidas o ausentes no lo son. Se conserva el parser UTC/offset,
el reloj local, la recuperación y la presentación de valores antiguos de #37.

**«Sin datos recientes» no certifica apagado físico**: puede deberse a internet,
proveedor, ingesta o demora de la medición. Tampoco implica baja administrativa.
Los registros de 25 minutos de #22/#37 y decisiones de #32 se mantienen como
históricos, con avisos de seguimiento. README e índice describen esta propuesta.

## Aceptación y validación offline

- Recientes encima de grises con coordenadas cercanas o coincidentes, latitud
  relativa invertida y orden API invertido; zoom 5/8/12/16 y capas AQI, PM2.5,
  temperatura y humedad; hover de gris no atraviesa prioridad.
- Prioridad actualizada en envejecimiento local sin fetch, recuperación local,
  respuesta API nueva y refrescos repetidos. Tarjetas y orden conservados.
- Grises conservados y accesibles por Enter/Space/Escape con retorno de foco;
  ventanas de 320/390/1440 px.
- Borde 40 minutos inclusive y +1 ms, 25/27,7/30/35 minutos recientes, fechas
  inválidas/futuras/NULL, errores de API/red/payload y recuperación.

Comandos desde raíz (Python con Playwright, Chromium `/usr/bin/chromium` y
Leaflet local con hashes fijados, igual que la suite de mapa existente):

```sh
python scripts/test-dashboard-marker-priority.py
python scripts/test-dashboard-map-markers.py
python scripts/test-dashboard-freshness.py
python scripts/test-dashboard-card-order.py
node --test tests/*.test.mjs
node scripts/test-dashboard-format-pm25.cjs
node --check sw.js
node --input-type=module --check < worker/src/index.js
git diff --check
```

La suite de prioridad carga primero el HTML exacto de main `a541d7c` y luego el
HTML de la rama con Leaflet real. `document.elementsFromPoint` comprueba el
símbolo efectivamente pintado encima, además de la pertenencia al panel.
API y tiles son fixtures interceptados; externos abortados y SW bloqueado.
Los adaptadores de las suites históricas de frescura/orden incorporan paneles
mínimos, sin sustituir la nueva prueba real de prioridad.

Resultados: suite de prioridad PASS, reproducción de main y aceptación en los
casos anteriores; suites de frescura, orden y última medición PASS. Node:
119 PASS, 0 FAIL. formatPm25/sintaxis inline, sintaxis SW/Worker y diff-check
PASS. Healthcheck offline: 0 FAIL, 16 SKIP y WARN por Node 24 frente a 22.
La regresión visual de mapa comprueba además colores EPA, ES/EN, claro/oscuro,
contención de leyenda y accesibilidad básica. No se cuentan como ausencia de
consultas las recargas del logo estático al redibujar tarjetas: la comprobación
de envejecimiento sin fetch se refiere a API y tiles.
Capturas locales
`work/priority-before.png` y `work/priority-after-{320,390,1440}.png` son fixtures,
no evidencia de sensores reales.

## Límites y reversión

No se consultaron API productiva (GET registra visitas D1), proveedores ni datos
reales. No se certifican lector de pantalla/WCAG completa ni cartografía real.
Pruebas bajo Node 24; Node 22 recomendado no verificado. Reloj del cliente y
suspensión de pestaña conservan las limitaciones previas.

Sin cambios de Worker, D1, ingestas, cron, proveedores, secretos, bajas, cálculos,
frecuencia ni datos productivos. Sin merge ni despliegue; el titular fusionará.
Commit con `[CF-Pages-Skip]` para omitir preview, sin cambios de configuración.
Revertir este PR mediante otro PR restaura el apilado anterior y 25 minutos,
sin tocar datos. Publicar o revertir en producción requiere autorización aparte.
