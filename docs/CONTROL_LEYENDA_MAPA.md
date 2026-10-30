# Leyenda interior compacta y acento para otras capas

## Decisión y base

El titular pide que la leyenda deje de ocupar todo el ancho fuera del mapa y
sea un control pequeño en una esquina. También autoriza explícitamente color
para las demás variables: acento real naranja para valores recientes, círculo
vacío con borde naranja para parámetro faltante y gris claro solo para datos
no recientes. Esta decisión sustituye las restricciones previas que mantenían
neutras esas capas; no cambia su interpretación sanitaria.

Rama nueva `fix/mapa-leyenda-interior-acento`, desde main exacto
`f3db674fc3dcbec0d031e807bc2fa80ca2ea8054`. #21, #22 y #24–#27 fusionados;
no había PRs abiertos ni corrección equivalente al iniciar. Contra la auditoría
`c03d7d0dca68772f3d1ea3312d797fe48f038f9c`: 27 commits adelante, 0 detrás,
61 archivos. Revisados AGENTS, README, docs actuales e históricas, Worker/D1,
workflows y pruebas. El entorno Codex Cloud existente se conserva.

## Implementación y aceptación

- Se elimina el bloque externo y su espacio residual. Un único control nativo
  `L.control({position: "bottomleft"})` contiene la leyenda dentro del mapa.
- Ancho máximo 240 px, ajustado al ancho real del mapa menos sus márgenes;
  fondo `--bg-panel`, borde/sombra discretos, texto legible en ambos temas.
  El margen inferior reserva la altura real de la atribución más 8 px y se
  recalcula al redimensionar. No cubre créditos, zoom ni selector.
- Paleta **categórica**, seis segmentos de igual ancho para mantener números
  legibles en el control pequeño. No es una escala numérica proporcional.
  Marcas reales conservadas: **0/50/100/150/200/300/500+**, derivadas de
  `AQI_CATEGORIES`; mismos colores AQI y continuación de último tramo.
  La descripción accesible explica la naturaleza categórica y todos los rangos.
- Gris «Sin datos recientes» separado y miniaturizado, no una categoría AQI.
- PM2.5, temperatura, humedad, presión, VOC, CO2 y NOx: círculo lleno del acento
  existente `var(--accent)` (claro `#9B3D00`, oscuro `#D9691F`) cuando el
  valor es reciente; círculo vacío con borde naranja si falta ese parámetro.
  No se inventan rangos. #C7C7C7 se reserva al estado sin datos recientes.
- Se mantienen regla >25 minutos (exactamente 25 sigue reciente), inválidos/
  futuros en gris, recuperación automática, tarjeta visible atenuada, orden,
  popup valor/unidad/fecha/estado y teclado/foco. Sin baja administrativa.
- `disableClickPropagation` y `disableScrollPropagation` aíslan gestos en el
  control; el pan sigue habilitado alrededor. No se instala un overlay general.
- Cálculo/categorías AQI, coordenadas, identidad/activo, D1, API, ingesta,
  frecuencia, historial, tarjetas, SW y workflows sin cambios.

## Pruebas y evidencia

- `node --test tests/*.test.mjs`: ocho archivos PASS. Extremos/seis colores AQI
  idénticos a tarjetas, otros parámetros con acento y faltantes, SVG vacío,
  leyenda/rangos reales y estados temporalmente seguros.
- `python scripts/test-dashboard-map-markers.py`: PASS, **Leaflet 1.9.4 real**
  offline y HTML real; todas las solicitudes interceptadas, API sintética y
  tiles transparentes. 320/390/1440 px, ES/EN, claro/oscuro.
- Comprueba contención dentro del mapa y esquina bottomleft, control único,
  máximo 240 px y sin espacio externo, atribución/zoom/selector sin solapar,
  ticks con al menos 6 px de separación, segmentos iguales y descripción
  categórica accesible. Naranja/vacío/gris en otras capas por viewport/tema.
- Arrastre/rueda sobre leyenda no altera centro/zoom; arrastre fuera sí mueve
  el mapa. Se conservan Enter/Space/Escape, foco, popups, borde 25 min,
  inválidos/futuros/NULL, fallo HTTP/red/petición pendiente, recuperación y orden.
- Regresiones Chromium de frescura, orden y última medición: PASS. Adaptadores
  históricos de esos smokes admiten controles; el smoke principal usa Leaflet real.
- formatPm25/sintaxis inline, sintaxis Worker/SW, prueba Python de integridad,
  diff/check y enlaces relativos: comprobados antes de publicar.
- Comparación literal contra main: fórmula, categorías, parser/reloj, tarjetas,
  orden, popup y formato de valores idénticos.

Capturas: `work/control-before-390.png`, `work/control-before-1440.png`,
`work/control-after-320.png`, `work/control-after-390.png`,
`work/control-after-1440.png`. Móviles inspeccionadas y mostradas en el chat.
Dependencias locales y hashes de Leaflet: [registro de prueba](MARCADORES_MAPA.md#preparación-y-resultados-de-pruebas).
No se ejecuta la UI productiva ni sus APIs que registran visitas.

## Operación y límites

Autorización vigente de publicar, integrar y desplegar. Rama con commit
`[CF-Pages-Skip]` para evitar previews, sin cambiar configuración. Revisar
checks/conflictos/diff y merge con expected HEAD; título/cuerpo del merge
limpios, sin heredar skip. Verificar Pages success y canónico con el SHA exacto
de main, y HTML estático servido idéntico al probado mediante curl, sin JS ni
`/api/*`. **El resultado real y sus SHAs quedan en la descripción del PR al
cierre**, sin crear otro PR documental solo para cambiar presente a pasado.

La prueba de UI es offline: no acredita sensores encendidos, proveedor/API,
WCAG completa, lector de pantalla ni Node 22. Se mantienen límites del reloj y
coordenadas próximas, sin clustering. Revertir por otro PR restauraría la
leyenda externa y neutros; no revertir ni tocar datos automáticamente.
