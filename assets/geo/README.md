# Partidos de la provincia de Buenos Aires

Capa cartográfica orientativa local: **135 partidos**, no ciudades ni cabeceras.
Excluye las 15 comunas de CABA. No integra estaciones EMAS ni datos de sensores.

## Procedencia y licencia

Fuente institucional indicada en los atributos originales `SAG`/`FDC`:
**ARBA — Gerencia de Servicios Catastrales**, capa `Departamento` difundida por
IGN. Los atributos `GNA=Partido`, `FNA=Partido de …` y `NAM` distinguen el nivel
administrativo de una localidad. Referencias primarias verificadas:

- [Catálogo oficial PBA, Límites de los partidos](https://catalogo.datos.gba.gob.ar/dataset/partidos): fuente ARBA, licencia **Creative Commons Attribution 4.0**; actualización de catálogo 02/08/2024. No se interpreta esa fecha como fecha del espejo.
- [Recurso de límites ZIP del catálogo](https://catalogo.datos.gba.gob.ar/dataset/627f65de-2510-4bf4-976b-16035828b5ae/resource/2cc73f96-98f7-42fa-a180-e56c755cf59a/download/limite-partidos-pba.zip).
- [IGN, capas SIG](https://www.ign.gob.ar/NuestrasActividades/InformacionGeoespacial/CapasSIG).
- [Licencia CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

La descarga directa de los dominios oficiales está bloqueada por la política de
red de este entorno (HTTP 403). Para los bytes se utiliza **un espejo público,
no institucional**, fijado a commit, sin afirmar equivalencia byte a byte con
la versión actual del catálogo:

- [alejoegarcia/partidos_geoJSON, ign_departamento.json](https://github.com/alejoegarcia/partidos_geoJSON/blob/1c71eb7ebb4cba651e137b69cf15f109193b5f22/ign_departamento.json).
- SHA-256 fuente: `af52fe56c5f28ff87fd96f2e8a44502f3ae63f9afa1b647cbda5e723005bf6c2`.
- Consulta/derivación: 13/11/2026. La fecha efectiva de relevamiento no consta.
- La copia incluye 150 entidades: 135 `Partido` ARBA y 15 `Comuna` CABA. Se
  filtra por tipo, no por prefijo de código: La Plata trae `IN1=60441`, anomalía
  del origen que **se conserva como identificador del recurso**, no se presenta
  como código oficial corregido. No se usa como ID de sensores o datos D1.

La atribución visible del mapa indica ARBA/IGN y CC BY 4.0, enlazando al catálogo.
Este archivo declara el intermediario, la simplificación y sus límites. La
licencia se atribuye a los datos originales ARBA según el catálogo oficial;
no al código ni a una supuesta licencia propia del espejo.

## Derivación reproducible

`pba-partidos.js` contiene un FeatureCollection asignado a `window.AQ_PBA`, para
carga estática local sin fetch geográfico, CORS, claves, servicios nuevos ni
librerías geográficas en el navegador. Tamaño aproximado: 257 KB sin comprimir.

```sh
curl -fL https://raw.githubusercontent.com/alejoegarcia/partidos_geoJSON/1c71eb7ebb4cba651e137b69cf15f109193b5f22/ign_departamento.json -o work/arba-ign-source.geojson
python -m pip install --target work/geo-tools shapely==2.1.2
PYTHONPATH=work/geo-tools python scripts/build-pba-geography.py work/arba-ign-source.geojson
```

El script valida el hash, filtra los 135 partidos, conserva nombres originales,
simplifica geometrías con tolerancia 0,0015° y `preserve_topology=True`, y redondea
coordenadas lon/lat a cinco decimales. La etiqueta usa un punto interior
`representative_point` de la geometría original; no la cabecera ni un punto
inventado. El bbox provincial se deriva del conjunto. No se inventan fronteras.
Shapely 2.1.2 solo se requiere para regenerar, no para servir ni probar el frontend.

La simplificación preserva cada polígono, no garantiza una cobertura topológica
perfecta entre vecinos: pequeñas diferencias pueden aparecer al acercar mucho.
No es cartografía catastral/legal ni certifica vigencia jurídica. No representa
CABA como partido PBA. Para actualizar, verificar nueva fuente primaria,
identificadores y licencia, regenerar con hash nuevo y revisar mediante PR;
no actualizar silenciosamente durante el uso de la app.
