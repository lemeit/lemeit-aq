/* Partidos de Buenos Aires: capa local no interactiva bajo los sensores.
   Procedencia/licencia: geo/README.md. Sin llamadas de red ni dependencia nueva. */
window.initAqProvince = function (map, data, sensors) {
  const L = window.L;
  const borderPane = map.createPane('pbaBorders');
  borderPane.style.zIndex = 350;
  borderPane.style.pointerEvents = 'none';
  const borders = L.geoJSON(data, { pane: 'pbaBorders', interactive: false,
    style: { color: 'var(--text-dim)', weight: .7, opacity: .28, fillOpacity: .025 }
  }).addTo(map);
  map.attributionControl.addAttribution('<a href="https://catalogo.datos.gba.gob.ar/dataset/partidos" target="_blank" rel="noopener">Partidos: ARBA/IGN</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>');
  const selector = document.getElementById('sel-mapa-partido');
  const features = [...data.features].sort((a,b)=>a.properties.name.localeCompare(b.properties.name, 'es'));
  for (const feature of features) {
    const option = document.createElement('option');
    option.value = feature.properties.id;
    option.textContent = feature.properties.name;
    selector.appendChild(option);
  }
  // CARTO light_all/dark_all ya contiene nombres geográficos: no duplicarlos.
  selector.addEventListener('change',()=>{
    const f=features.find(f=>f.properties.id===selector.value);
    if (f) map.fitBounds(L.geoJSON(f).getBounds(),{paddingTopLeft:[30,24],paddingBottomRight:[30,(document.getElementById('mapa-legend')?.offsetHeight || 70)+35],maxZoom:12,animate:false});
  });
  return { update:() => {}, bounds:borders.getBounds() };
};
