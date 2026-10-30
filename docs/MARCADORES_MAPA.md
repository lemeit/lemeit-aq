# Marcadores compactos del mapa

> Decisión posterior del titular: [una sola forma circular y colores AQI](CIRCULOS_AQI_MAPA.md)
> sustituye las seis geometrías/acento único de #23, ya fusionado en 934f635.
> Las referencias siguientes a formas o PR pendiente son evidencia histórica,
> no la decisión visual vigente. Frescura #22, orden #21 y cálculo intactos.
> El titular autorizó merge/despliegue de la corrección circular; las restricciones
> operativas anteriores se conservan como registro de sus respectivas tareas.

## Base, coordinación y alcance

Base main verificada en GitHub el 30/10/2026:
`d76c6870bdeb70da2ff4be428752136532bee320`. La comparación con la auditoría
`c03d7d0dca68772f3d1ea3312d797fe48f038f9c` da 22 commits adelante, 0 detrás,
56 archivos. #21 (orden) y #22 (frescura) están fusionados; al iniciar no había
PRs abiertos ni propuesta equivalente. Se revisaron AGENTS, README, índice,
auditorías, plan, orden, frescura, trazabilidad, Worker, D1, workflows y scripts.

Rama independiente `feat/mapa-marcadores-aqi`, basada en el SHA remoto exacto.
El proxy impide Git HTTPS, pero el entorno Cloud sí ejecuta código y navegador.
Se reconstruyeron/verificaron los objetos Git desde el conector y objetos locales;
checkout sparse omite únicamente los PDF de instalación, que no se modifican.
La conversación externa referenciada no pudo recuperarse: no hay herramienta
`read_thread` disponible. Los requisitos explícitos de este pedido constituyen
la especificación aplicada; no se atribuyen detalles a esa conversación.

Se reutiliza #22, sin duplicar reloj, parser ni lógica de recuperación. Se
conservan literalmente cálculo, umbrales, seis categorías, gauge/tarjetas,
orden #21, selección de tarjetas y API. Solo el mapa cambia su representación
y su popup de parámetro. Sin cambios de identidad, proveedor, `activo`, D1,
historial, ingesta, SW ni workflows; no se ocultan sensores por antigüedad.

## Terminología y diseño

El selector decía «Capa: indicador PM2.5 (EPA)» y `param_aqi` decía «Indicador
EPA». Ambos pasan a **AQI · EPA**, con descripción de leyenda **Índice de
calidad del aire (AQI · EPA)**. Se traduce también al inglés. Sigue siendo un
indicador derivado de la última muestra; no se convierte en AQI diario ni
NowCast. Ver [trazabilidad](AQI_TRAZABILIDAD.md).

Cada estación usa un único `L.Marker`/`L.divIcon`, con SVG decorativo de 26 px y
área interactiva de 44×44 px. Se retiran círculo más etiqueta, nombres largos
y cifras superpuestas. No se sustituyen por números de severidad.

| Categoría existente | Forma |
| --- | --- |
| Buena, AQI ≤50 | Círculo |
| Moderada, 51–100 | Cuadrado |
| No saludable para grupos sensibles, 101–150 | Triángulo |
| No saludable, 151–200 | Rombo |
| Muy no saludable, 201–300 | Hexágono |
| Peligrosa, ≥301 (incluye >500) | Estrella |

Son formas propias de presentación, **no símbolos oficiales de EPA**. El
código obtiene la categoría desde `pm25ToAqi` y `AQI_CATEGORIES` existentes,
sin una segunda tabla de umbrales. La leyenda repite cada forma junto a su
categoría textual; no depende solo del color.

Todas las formas AQI usan el único acento ya existente `var(--accent)`:
`#9B3D00` en claro y `#D9691F` en oscuro. No se usan seis colores AQI en los
marcadores ni en la leyenda del mapa. Los colores AQI de tarjetas/gráficos se
conservan. PM2.5, temperatura y humedad usan aro con punto, sin categorías ni
rangos inventados. Presión, VOC, CO2 y NOx siguen el mismo sistema neutro, en
lugar de mantener la anterior escala relativa cromática. No se agregan capas.

## Valor, estado y accesibilidad

Al pulsar, el popup muestra estación, parámetro realmente elegido, valor,
unidad, fecha de medición en Argentina y estado. Para AQI muestra el índice y
la categoría; los índices VOC/NOx se etiquetan como tales, sin unidad física
inventada. Metadata del popup escapada por contexto HTML. Cambiar la capa ya
no deja un popup que siempre hable de PM2.5.

- Reciente: edad válida de **0 a 25 minutos inclusive**, conforme #22.
- >25 min, fecha inválida/ausente o futura: círculo gris claro `#C7C7C7` con
  barra horizontal, contorno y texto de estado **Sin datos recientes**.
- Lectura reciente sin valor válido para la capa: aro discontinuo y texto
  **Sin valor para este parámetro**, distinto de antigüedad. No se inventa AQI.
- La tarjeta permanece visible y atenuada con última actualización. El reloj
  de #22 actualiza símbolo, nombre accesible y popup aun con red/API fallida o
  pendiente; nuevas lecturas válidas recuperan el símbolo correspondiente.
- Un popup antiguo puede mostrar su valor histórico acompañado del estado y
  fecha explícitos; ese valor nunca determina el símbolo de categoría actual.
- La falta de señal no identifica causa ni implica baja administrativa: puede
  ser apagado, internet o proveedor/API. Una baja requiere decisión futura
  explícita del titular.

Los marcadores tienen `role=button`, foco, nombre accesible con estación,
parámetro/valor/estado/fecha y tooltip equivalente. Leaflet atiende Enter; se
agrega Space evitando scroll. Se completa el cierre Escape desde marcador y popup, devolviendo el foco
al marcador; el clic ya no voltea una tarjeta ni desplaza al usuario fuera
del mapa. Las tarjetas siguen siendo seleccionables directamente. El SVG
interno es decorativo (`aria-hidden`, `focusable=false`), sin controles anidados.
La leyenda y el selector se traducen; el foco tiene contorno visible.

## Reproducción y criterios de aceptación

`python scripts/test-dashboard-map-markers.py` carga primero el HTML exacto
base: comprueba ocho círculos más ocho etiquetas y texto numérico/largo en
puntos. Después prueba el HTML propuesto con **Leaflet 1.9.4 real**, sin
adaptador, y lecturas sintéticas. Documento, JS/CSS de Leaflet, API ficticia y
tiles transparentes se responden localmente; todas las solicitudes se
interceptan y el resto se aborta. Service workers bloqueados. No se consulta
producción ni proveedores; los GET públicos pueden escribir visitas en D1.

Aceptación probada:

1. Seis categorías y extremos de los tramos heredados, incluido >500, seis
   formas diferentes con el mismo acento; sin nombres/números sobre los puntos.
2. PM2.5/temperatura/humedad y las otras capas usan símbolo neutro sin rangos;
   clic muestra el valor/unidad correcto y fecha/estado.
3. Borde inclusivo 25 min y +1 ms; inválidos/futuros; red/HTTP fallidos y
   petición pendiente; recuperación. Reloj local sin solicitudes API/tiles.
4. Capas y dorsos conservados al envejecer; orden AE ascendente y PurpleAir sin
   AE al final intacto; tarjetas visibles.
5. Enter, Space y Escape con Leaflet real, nombres/foco/tamaño; leyenda textual y
   decorativos ocultos; sin overflow a 320, 390 y 1440 px, ES/EN, claro/oscuro.
6. Popup escapa metadata; valor faltante y dato antiguo son estados distintos.

## Preparación y resultados de pruebas

Requiere Node (usado 24.19.0), Python con Playwright y `/usr/bin/chromium`.
Preparar una sola vez los assets de prueba de Leaflet 1.9.4 en
`work/leaflet-1.9.4/leaflet.min.js` y `leaflet.min.css`. No forman parte del
sitio ni se descargan durante las pruebas. Fuentes de dependencia estática:

- [JS 1.9.4](https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js)
- [CSS 1.9.4](https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css)

En Cloud se recuperaron esas mismas rutas mediante el conector GitHub desde
`cdnjs/cdnjs`, `ajax/libs/leaflet/1.9.4/`, por el bloqueo del proxy local.
SHA256 comprobados:

```
JS  5c9aecfc30e4564519dbdcddcc53a418227dcc7568e619e9762ddcec7609ed47
CSS b570abbda963c60b4de4b4ff4b26f9326f53fb2ccf1461fdf0955ca094fb2539
```

Ejecutado:

- `node --test tests/*.test.mjs`: ocho archivos PASS, 0 fallos.
- `node tests/map-markers.test.mjs`: seis pruebas nuevas PASS.
- `python scripts/test-dashboard-map-markers.py`: PASS, Leaflet real y todas
  las comprobaciones indicadas arriba.
- `python scripts/test-dashboard-freshness.py`,
  `python scripts/test-dashboard-card-order.py`,
  `python scripts/test-dashboard-latest-measurement.py`: PASS. Se adaptaron
  controles de marcador a la representación nueva; sus baselines históricos
  siguen reproduciendo los defectos originales.
- `node scripts/test-dashboard-format-pm25.cjs`: PASS, sintaxis inline incluida.
- `python -B tests/data-integrity-python.audit.py`: PASS sin HTTP.
- Sintaxis Worker/SW y `git diff --check`: PASS.
- Healthcheck offline: 0 FAIL, 16 SKIP, WARN solo por Node 24 frente a 22
  recomendado. 47 enlaces relativos válidos en los Markdown del cambio.
- Comparación de funciones contra main: cálculo/categorías, parser/reloj de
  frescura, armado de tarjetas y orden idénticos.

Chromium requiere permisos de proceso ampliados; la red sigue interceptada.
Las pruebas antiguas de escala/color se sustituyen por aceptación de símbolos,
no se conservan funciones de color relativo que ya no usa el mapa.

## Publicación sin despliegue

La configuración Pages se comprobó por GET: previews custom incluyen `*` y
esta rama no está excluida. No se amplía la autorización de exclusión que se
había dado únicamente para la rama #22 y no se modifica configuración.
Se usa el mecanismo documentado de omisión **por commit**, sin configuración:
[Cloudflare GitHub integration, skipping a build](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/#skipping-a-build-via-a-commit-message).
Todos los commits publicados de esta rama llevan prefijo `[CF-Pages-Skip]`.
La documentación oficial confirma que ese prefijo omite el deployment; también
se observó el antecedente real #20 omitido por `commit_message` en Pages.
Antes de crear el PR se comprobará `is_skipped=true` para el SHA publicado;
se revalidará después de abrirlo. No se abre la URL de preview ni el portal.
Los workflows no tienen triggers push/PR. No merge, auto-merge, deploy manual,
migraciones, D1 ni ingestas reales. Main conserva su configuración previa;
un futuro merge pertenece al titular y requiere su decisión operativa.

## Límites y reversión

La frescura conserva el reloj y ciclo nominal de 1 s de #22, con reevaluación
al volver de suspensión, sin garantizar ejecución en segundo plano. La forma
no certifica estado físico ni causa de falta de datos. Sensores muy próximos o
coincidentes pueden superponerse geográficamente; no se agrega clustering ni
se desplazan coordenadas, y se puede acercar el mapa o usar tarjetas/teclado.
La prueba de clic acerca fixtures próximos para separar sus áreas táctiles.

Leaflet y sus controles/popups se prueban realmente; tiles, API y lecturas son
sintéticos. No se comprueban cartografía/CDN productivos, lector de pantalla ni
conformidad WCAG completa. No se valida Node 22 ni operación productiva.
Fuera de alcance: AQ-04, MAX textual y validación backend de timestamps,
metadatos hostiles en superficies preexistentes ajenas al popup.

Antes de merge, descartar la rama revierte la propuesta. Después, una reversión
por PR restaura la representación previa sin restaurar datos ni esquema.


## PR y comprobación de publicación

[PR #23 abierto](https://github.com/lemeit/lemeit-aq/pull/23) hacia main,
sin merge ni auto-merge. Primer HEAD remoto:
`cf86ab005dfe56dd13d83c86b0442d86d47ac07b`, árbol
`8c1179514dbffc07d64f86fed04995a1324306e8`, idéntico al commit local
`cab6c4d`. Publicación por conector GitHub a causa del proxy Git local.

Antes de abrir el PR se verificó el registro Pages
`14d13b9a-840a-406e-a731-c492d167d939` para ese SHA:
`is_skipped=true`, `skip_reason=commit_message`, ninguna etapa ejecutada.
Source completo idéntico al GET previo; no se cambió ninguna exclusión.
El deployment canónico sigue siendo `aa81ba45-2415-4c73-9af3-8eaf2543d407`,
SHA main `d76c6870bdeb70da2ff4be428752136532bee320`.

Se añade este seguimiento en un commit exclusivamente documental, también con
prefijo `[CF-Pages-Skip]`. El SHA final, la comprobación Pages después del PR
y la comparación remota de archivos quedan registrados en la descripción del
[PR #23](https://github.com/lemeit/lemeit-aq/pull/23). No se afirma que el cambio
esté fusionado, desplegado ni verificado contra sensores reales.
