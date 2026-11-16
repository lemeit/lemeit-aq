# Corrección: etiquetas duplicadas de partidos PBA (16/11/2026)

## Defecto y reproducción
En la pestaña **Mapa** del portal, con la vista sobre Saladillo y partidos vecinos, aparecen nombres geográficos del mapa base CARTO y etiquetas superpuestas creadas por `assets/mapa-pba.js` (incluyendo el prefijo «Partido»). Captura aportada por el titular el 16/11/2026.

## Causa
`index.html` utiliza tiles CARTO `light_all` / `dark_all`, que contienen rótulos geográficos. `initAqProvince` agregaba un segundo conjunto de 135 etiquetas HTML sobre la misma vista.

## Corrección
Se elimina solamente la capa HTML `pbaLabels` y su lógica de colocación/actualización. Se conservan la capa GeoJSON de límites ARBA/IGN, su atribución, el selector de partidos y el ajuste de zoom al seleccionar uno, así como los sensores y la leyenda AQI. No se cambian tiles, API, ingesta ni D1.

## Criterios de aceptación y verificación pendiente
1. Abrir Mapa en tema claro y oscuro: no aparecen etiquetas HTML «Partido» duplicadas sobre los rótulos CARTO.
2. Se siguen viendo límites de partidos y atribución ARBA/IGN.
3. Seleccionar Saladillo y 25 de Mayo: el mapa enfoca el partido correspondiente.
4. Cambiar parámetro AQI/PM2.5 y navegar/zoom: marcadores y leyenda permanecen operativos.
5. Verificar en escritorio y móvil. Comprobar que los nombres mostrados por CARTO son geográficos y no necesariamente nombres administrativos de todos los partidos.

La revisión del código confirma que se retira la capa redundante. **Pruebas visuales y ejecución del sitio pendientes**; no equivale a despliegue. Reversión: revertir el commit de `assets/mapa-pba.js`.
