/* Partidos de Buenos Aires: capa local no interactiva bajo los sensores.
   Procedencia/licencia: geo/README.md. Sin llamadas de red ni dependencia nueva. */
window.initAqProvince = function (map, data, sensors) {
  const L = window.L;
  const borderPane = map.createPane('pbaBorders');
  borderPane.style.zIndex = 350;
  borderPane.style.pointerEvents = 'none';
  const labelPane = map.createPane('pbaLabels');
  labelPane.style.zIndex = 410;
  labelPane.classList.add('leaflet-zoom-hide');
  labelPane.style.pointerEvents = 'none';
  labelPane.setAttribute('aria-hidden', 'true');
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
  const labels = features.map(feature => {
    const label = document.createElement('span');
    label.className = 'pba-label';
    const kind = document.createElement('small');kind.textContent = 'Partido';
    const name = document.createElement('span');name.textContent = feature.properties.name;
    label.append(kind,name);labelPane.appendChild(label);
    return { feature, label };
  });
  const intersects = (a,b)=>a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  function update() {
    const size = map.getSize(), rect = map.getContainer().getBoundingClientRect();
    const occupied = [];
    // Las etiquetas nunca ocupan el área táctil de sensores o controles.
    for (const sensor of sensors()) {
      if (sensor.latitud == null || sensor.longitud == null) continue;
      const p=map.latLngToContainerPoint([sensor.latitud,sensor.longitud]);
      occupied.push({left:p.x-27,right:p.x+27,top:p.y-27,bottom:p.y+27});
    }
    for (const control of map.getContainer().querySelectorAll('.leaflet-control')) {
      const r=control.getBoundingClientRect();
      occupied.push({left:r.left-rect.left-4,right:r.right-rect.left+4,top:r.top-rect.top-4,bottom:r.bottom-rect.top+4});
    }
    const sorted = [...labels].sort((a,b)=>Number(b.feature.properties.id===selector.value)-Number(a.feature.properties.id===selector.value) || b.feature.properties.area-a.feature.properties.area || a.feature.properties.id.localeCompare(b.feature.properties.id));
    const cap = map.getZoom() <= 6 ? (size.x < 600 ? 10 : 22) : Infinity;
    let count=0;
    for (const {feature,label} of sorted) {
      label.hidden=true;
      if (count >= cap) continue;
      const p=map.latLngToContainerPoint(feature.properties.label);
      if (p.x < 0 || p.y < 0 || p.x > size.x || p.y > size.y) continue;
      label.hidden=false;
      const w=label.offsetWidth,h=label.offsetHeight;
      // Desplazamientos de texto en píxeles; no se desplazan límites ni sensores.
      const candidates=[[0,0],[0,30],[0,-30],[w/2+28,0],[-w/2-28,0]];
      let placed=false;
      for (const [dx,dy] of candidates) {
        const box={left:p.x+dx-w/2-4,right:p.x+dx+w/2+4,top:p.y+dy-h/2-3,bottom:p.y+dy+h/2+3};
        if (box.left<4 || box.right>size.x-4 || box.top<4 || box.bottom>size.y-4 || occupied.some(r=>intersects(box,r))) continue;
        const position=map.containerPointToLayerPoint([p.x+dx-w/2,p.y+dy-h/2]);
        L.DomUtil.setPosition(label,position);
        occupied.push(box);placed=true;count++;break;
      }
      label.hidden=!placed;
    }
  }
  let scheduled=false;
  function schedule() {
    if (scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;update();});
  }
  map.on('moveend zoomend resize',schedule);
  selector.addEventListener('change',()=>{
    const f=features.find(f=>f.properties.id===selector.value);
    if (f) map.fitBounds(L.geoJSON(f).getBounds(),{paddingTopLeft:[30,24],paddingBottomRight:[30,(document.getElementById('mapa-legend')?.offsetHeight || 70)+35],maxZoom:12,animate:false});
    schedule();
  });
  schedule();
  return { update:schedule, bounds:borders.getBounds() };
};
