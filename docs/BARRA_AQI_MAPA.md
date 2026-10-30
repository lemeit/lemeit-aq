# Leyenda AQI en barra segmentada

> Decisión posterior: [leyenda interior compacta y acento](CONTROL_LEYENDA_MAPA.md)
> sustituye la ubicación externa/anchos proporcionales y el gris neutro de otras
> variables. El titular ahora aprueba naranja reciente, vacío naranja faltante
> y gris claro solo sin datos recientes. Las descripciones anteriores se
> conservan como evidencia histórica; AQI/frescura/orden no cambian.

## Estado real verificado — 30/10/2026

[PR #26](https://github.com/lemeit/lemeit-aq/pull/26) fusionado con expected HEAD
`900450c619dca75331b6fe9c370d2923d2b93dee`, sin conflictos/checks pendientes,
mensaje explícito sin skip heredado. Main funcional:
`0f5d5bb305a66d817ca8a3814de5606e243ee920`, árbol
`66dd4f4d9c16d61e86cdcd678ab8fd6c633a808f`, idéntico al checkout probado.

Pages deployment `38ea7eb2-febf-42e5-8459-8f6fb42d1c76`: deploy `success`,
`is_skipped=false`, canónico con el mismo SHA. Configuración sin cambios.
La rama omitió preview por mensaje (registro
`087cd671-3410-4542-b523-0cfbcaccba52`), como estaba previsto.

GET exclusivo del HTML estático de Pages sin ejecutar JS: **190501 bytes**
idénticos al `index.html` probado. SHA256
`362c096d48d4a9e13418cfa469baa67292ca3f81c86920ed66cf9b59c997d198`.
Se verifican barra segmentada y referencia de gris fuera de escala en ese
contenido. Sin `/api/*`, ingestas, migraciones ni escrituras D1.

Este corte documenta el despliegue funcional. El seguimiento exclusivamente
documental posterior conserva HTML/runtime; se revalida su canónico final y se
registra el resultado en el PR. Las secciones siguientes mantienen decisión,
pruebas y procedimiento, no una afirmación de validación de sensores productivos.

## Decisión y base

El titular solicita sustituir la lista de círculos/categorías bajo el mapa
por una **barra horizontal segmentada compacta**, tipo paleta PurpleAir.
Se conservan los círculos coloreados de #24. No se aplica la sugerencia no
aprobada de acento naranja para otras variables ni círculo vacío para faltantes:
los marcadores/colores de otras capas permanecen idénticos.

Base exacta main: `0252c3a06a1bdf0baefee0c4c4e2575400976d30`, rama nueva
`fix/mapa-barra-aqi`. #24 y su seguimiento documental #25 están fusionados.
Antes de esta rama se comprobó #25: Pages
`5a902002-7a98-4ebf-b2fd-cf7cb9d80a28` success, canónico con ese SHA, y HTML
estático idéntico a #24 (188280 bytes, SHA256
`cf7f83e683ad01d9ab7cb04c69dd398321823b91cff6f3c66f03aef3433e584e`).
La nueva autorización de merge/despliegue de correcciones visuales sigue vigente.
No se autoriza D1, migraciones, ingestas ni APIs productivas.

## Representación y aceptación

- Título visible **AQI · EPA**. Seis segmentos toman colores directamente de
  `AQI_CATEGORIES`, los mismos de marcadores y tarjetas en cada tema.
- Marcas **0, 50, 100, 150, 200, 300, 500+**, obtenidas de los máximos de las
  categorías actuales. No se copian límites de una imagen de referencia.
  Anchos proporcionales a esos intervalos: 50/50/50/50/100/200. `500+` indica
  continuación del último tramo; no se modifica la extrapolación ni se crea
  un nuevo umbral sanitario.
- Sin fila visible de seis puntos/formas ni nombres largos. Texto accesible
  oculto describe las categorías 0–50, 51–100, 101–150, 151–200, 201–300,
  301–500 y la continuación superior. Barra con nombre accesible y descripción;
  números visibles sin solaparse. No depende de un tooltip para entenderla.
- **Sin datos recientes** se muestra fuera de la barra, como referencia gris
  separada; no es un segmento ni una categoría AQI. Fecha, estado y categoría
  se mantienen en nombre accesible y popup del marcador.
- Otras capas conservan su leyenda neutra, sin escala sanitaria inventada.
  Sin cambios de color no confirmados, valores, unidades ni popups.
- Marcadores circulares/colores #24, tamaño, teclado/foco, cálculo/tramos,
  gris para antiguos/inválidos/futuros, recuperación #22, tarjetas visibles y
  atenuadas y orden #21 permanecen idénticos. Sin baja administrativa automática.

## Pruebas

- `node --test tests/*.test.mjs`: ocho archivos PASS, sin fallos; controles de
  seis segmentos, colores/límites reales, gris separado y categorías accesibles.
- `python scripts/test-dashboard-map-markers.py`: PASS con HTML y Leaflet 1.9.4
  reales offline, solicitudes interceptadas. Reproduce main con ocho círculos
  de leyenda y nombres largos; prueba la barra a **320/390/1440 px**, ES/EN,
  temas claro/oscuro. Comprueba seis colores iguales a badges/marcadores,
  límites exactos, proporciones y números sin solaparse, descripción accesible
  y gris fuera de la escala. Conserva comprobaciones de popups/otras capas,
  teclado/foco, frescura, red, recuperación y orden.
- Comparación literal con main: `cargarMapa`, estado/SVG de marcadores,
  popups/formato, parser/reloj, tarjetas/orden y cálculo idénticos.
- `node scripts/test-dashboard-format-pm25.cjs`: PASS, sintaxis inline incluida.
- Diff/check y enlaces relativos comprobados antes de publicar.

Las dependencias locales Leaflet y sus hashes están documentados en
[MARCADORES_MAPA.md](MARCADORES_MAPA.md#preparación-y-resultados-de-pruebas).
El script guarda `work/bar-before-390.png`, `work/bar-before-1440.png`,
`work/bar-after-390.png`, `work/bar-after-1440.png`; se mostró la captura móvil
corregida al titular. Tiles transparentes y lecturas sintéticas; no se ejecuta
JavaScript productivo ni se consulta `/api/*`.

## Operación, límites y reversión

Publicar rama con `[CF-Pages-Skip]`, verificando omisión de preview sin cambiar
configuración. Revisar diff/checks/conflictos y merge con expected HEAD y mensaje
explícito **sin skip heredado**, según autorización vigente. Verificar Pages
success y canónico con el mismo SHA de main; GET solo del HTML estático de Pages
con curl, comparando bytes con el commit probado. El resultado real se registra
tras verificarlo; ninguna prueba offline acredita por sí sola producción.

No se cambia configuración, Workers/API, SW, D1, cron, secretos ni ingesta.
Los límites operativos de reloj, datos y sensores se mantienen. No se acredita
WCAG completa, lector de pantalla ni Node 22. Las categorías no describen AQI
diario/NowCast por usar esta barra; sigue siendo indicador de última medición.
Revertir mediante otro PR restauraría la lista visible anterior, sin restaurar
datos; no hacerlo automáticamente.
