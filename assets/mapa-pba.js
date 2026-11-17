/* Partidos de Buenos Aires: límites locales no interactivos bajo los sensores.
   Procedencia/licencia: geo/README.md. Sin red ni etiquetas HTML duplicadas. */
window.initAqProvince = function (map, data) {
  const L = window.L;
  const borderPane = map.createPane('pbaBorders');
  borderPane.style.zIndex = 350;
  borderPane.style.pointerEvents = 'none';
  const attribution = '<a href="https://catalogo.datos.gba.gob.ar/dataset/partidos" target="_blank" rel="noopener">Partidos: ARBA/IGN</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>';
  const borders = L.geoJSON(data, { pane: 'pbaBorders', interactive: false,
    style: { color: 'var(--text-dim)', weight: .7, opacity: .28, fillOpacity: .025 }
  }).addTo(map);
  map.attributionControl.addAttribution(attribution);
  let shown = true;
  return {
    bounds: borders.getBounds(),
    setVisible(visible) {
      if (visible === shown) return;
      shown = visible;
      borderPane.style.display = visible ? '' : 'none';
      map.attributionControl[visible ? 'addAttribution' : 'removeAttribution'](attribution);
    }
  };
};
