# Corrección visual: círculos comunes y colores AQI

## Estado verificado — 30/10/2026

[PR #24](https://github.com/lemeit/lemeit-aq/pull/24) fusionado mediante squash
con HEAD esperado `d45887f81b53eabc203e3818ae04727c6655f40d`, sin conflictos ni
checks remotos pendientes. Merge/main funcional:
`a8c21b6131c17242cb9828539621a015d990f392`, árbol
`d89432506f128b39a70ed9fe0d7327f77b87d6e2`, idéntico al checkout probado.
El mensaje de merge se fijó explícitamente sin heredar skip.

Cloudflare Pages confirmó deployment
`745f9447-2ad2-4762-adea-488e82f70e80`, etapa deploy `success`,
`is_skipped=false`; canónico con el mismo SHA de main. Configuración de origen
sin cambios. La rama previa sí omitió preview por `commit_message` (registro
`ab029b78-63f3-4533-916d-cf9956d3598e`), conforme lo previsto.

GET estático a `https://purpleair-saladillo.pages.dev/`, sin ejecutar JS:
**188280 bytes idénticos byte a byte** al `index.html` del commit desplegado.
SHA256 `cf7f83e683ad01d9ab7cb04c69dd398321823b91cff6f3c66f03aef3433e584e`.
Se verificó ausencia de tabla de geometrías y uso del color compartido con
las tarjetas. Sin solicitudes API, visitas D1, ingestas ni migraciones.

Este es el corte funcional verificado. El PR documental posterior incorpora
esta evidencia sin alterar HTML/runtime; su integración y SHA canónico final
se comprueban de nuevo y se registran en la descripción del PR. Las secciones
siguientes conservan decisión, preparación y procedimiento, sin atribuir a
la comprobación estática una validación de sensores o de la API productiva.

## Decisión vigente y base

Corrección explícita del titular tras #23: «la idea no era cambiar geometrías
[...] Usa una sola y los colores para el AQI». Sustituye el esquema de seis
formas y acento único. Todos los marcadores pasan a una **única geometría
circular**, sin cuadrados, triángulos, rombos, hexágonos, estrellas ni símbolos
interiores. La capa AQI utiliza exactamente los seis colores existentes de
las tarjetas; las otras variables usan un círculo neutro sin rangos inventados.

Base GitHub main comprobada el 30/10/2026:
`934f6354bf216876368ba931fd363d32825312db`, #23 fusionado. #21 y #22 también
integrados, sin PRs abiertos ni trabajo equivalente al iniciar. Comparación
con `c03d7d0dca68772f3d1ea3312d797fe48f038f9c`: 23 commits adelante, 0 detrás,
59 archivos. AGENTS, README, docs de marcadores/frescura/orden, índice, plan,
trazabilidad, Worker/D1/workflows y pruebas revisados. Rama nueva desde ese
main exacto: `fix/mapa-circulos-aqi`; no se reutiliza la rama fusionada de #23.

El mensaje posterior «dejar en gris para sensores apagados o fuera de línea»
se aplica conservando la regla temporal: **más de 25 minutos** sin mediciones,
o fecha ausente/inválida/futura, círculo gris claro `#C7C7C7`, estado textual y
popup. No se diagnostica hardware, internet ni proveedor con ese estado. Hasta
25 minutos inclusive mantiene color AQI. El titular autorizó posteriormente
publicar, integrar y desplegar esta corrección sin otra confirmación; esa
instrucción sustituye el «no merge/deploy» previo exclusivamente en esta tarea.
No autoriza D1, migraciones, ingestas reales ni cambios ajenos.

## Implementación y aceptación

- `mapaMarkerState` toma color y etiqueta de `aqiInfo(pm25ToAqi(...))`, el mismo
  camino que las tarjetas. No hay una segunda escala, umbrales ni cambios de
  cálculo. La leyenda itera las categorías existentes con círculos de color.
- Un SVG con un círculo para **todos** los estados/capas. Tamaño visual 26 px,
  objetivo interactivo 44×44 px, sin nombres ni valores sobre los puntos.
  Contorno neutro ayuda a ver el círculo sobre el mapa.
- Otras variables y valor faltante: círculo neutro `var(--text-dim)`;
  antigüedad/fecha inválida/futura: gris claro. Son estados descritos en nombre
  accesible y popup; no se inventa una categoría AQI para PM2.5 u otra variable.
- Se conservan literalmente popup de parámetro/valor/unidad/fecha/estado,
  escape de metadata, selección, foco visible y Enter/Space/Escape con retorno
  de foco de #23. La categoría también se expresa en texto; la leyenda no
  depende únicamente del color para identificarla.
- Reloj, parser, regla inclusiva, error de red, recuperación y atenuación de
  tarjetas de #22, y orden AE ascendente/PurpleAir final de #21, sin cambios.
- Sin cambios en identidad, proveedor, `activo`, historial, D1, Worker/API,
  ingesta, frecuencia, SW ni workflows. «Sin datos recientes» no es baja
  administrativa; una baja requiere decisión explícita futura.

## Pruebas offline y capturas

Se ejecutan HTML y Leaflet 1.9.4 reales con los assets locales verificados de
[la prueba previa](MARCADORES_MAPA.md#preparación-y-resultados-de-pruebas).
Todas las solicitudes se interceptan: documento local, API ficticia y tiles
transparentes; externos abortados y SW bloqueados. Sin GET a APIs productivas.

- `node --test tests/*.test.mjs`: PASS, ocho archivos; seis controles de
  marcadores actualizados. Extremos de los seis tramos, >500, colores idénticos
  a `aqiInfo` de tarjetas, círculo común, leyenda y variables neutras.
- `python scripts/test-dashboard-map-markers.py`: PASS con Leaflet real;
  comparación de color computado con badges reales en claro/oscuro, círculos,
  leyenda, borde 25 min/+1 ms, gris con fechas antiguas/inválidas/futuras/NULL,
  recuperación, fallos de red/HTTP y petición pendiente. Enter/Space/Escape,
  nombre/foco/tamaño, orden, ES/EN y 320/390/1440 px; cero llamadas API/tiles
  por envejecimiento local.
- Regresiones Chromium de frescura, orden y última medición: PASS.
- `node scripts/test-dashboard-format-pm25.cjs`: PASS, incluida sintaxis inline.
- Comprobación de funciones/categorías contra main: cálculo, umbrales, parser,
  reloj, tarjetas, popup y orden idénticos.

El mismo script carga primero main #23 y guarda
`work/circles-before-390.png`, `work/circles-before-1440.png`; luego la
corrección guarda `work/circles-after-390.png` y
`work/circles-after-1440.png`. Se mostraron ambas capturas móviles en el chat.
Son fixtures con cartografía transparente, no capturas de sensores reales.

## Publicación, merge y despliegue autorizados

La rama usa commits `[CF-Pages-Skip]` para omitir previews por mensaje, método
ya verificado, sin modificar configuración Pages. Se comprobará su omisión
por API antes de merge. El PR debe advertir expresamente: **revisar y limpiar
el mensaje del merge para no heredar accidentalmente el skip**. En esta tarea
el merge autorizado se hará con título y cuerpo explícitos sin ese prefijo,
lease de HEAD esperado y revisión previa de checks/conflictos/diff.

Después se verificará que Pages termine `success` y el canónico apunte al
**SHA exacto de main fusionado**. Si Pages lo omitiese, solo se reintentará ese
deployment ya identificado, dentro de la autorización actual. No se cambiarán
branch controls, secrets, D1, cron ni datos para desplegar esta corrección.

Comprobación de contenido: GET al HTML estático de Pages con curl, sin ejecutar
JavaScript. `/index.html` puede redirigir a `/`; solo esas rutas estáticas y
hostname Pages, sin `/api/*` ni proveedor. Se comparará el HTML recibido con el
`index.html` del commit desplegado. El estado operativo realmente observado
se registrará tras la verificación, distinguiendo pruebas offline de producción.

## Límites y reversión

Reloj cliente/ciclo de 1 s y suspensión mantienen límites de #22. Puntos
coincidentes pueden requerir zoom o teclado; no se mueven coordenadas ni se
agrega clustering. No se certifican sensores encendidos/apagados, lector de
pantalla, WCAG completa, Node 22 ni la operación de API/ingesta.

Antes de merge, descartar la rama. Después, revertir mediante otro PR y un
despliegue autorizado, sin restaurar datos/esquema. Revertir solo esta corrección
volvería a las geometrías rechazadas de #23; no hacerlo automáticamente.
