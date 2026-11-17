/* Visualización: único control Leaflet, sin plugins ni estado duplicado. */
window.initAqDisplay = function (map, onSensors, onBorders) {
  const L = window.L;
  const wrapper = document.getElementById('mapa-display');
  const button = document.getElementById('mapa-display-button');
  const panel = document.getElementById('mapa-display-panel');
  const measurement = document.getElementById('sel-mapa-param');
  const sensors = document.getElementById('mapa-sensores');
  const borders = document.getElementById('mapa-limites');
  const control = L.control({ position:'topright' });
  control.onAdd = () => {
    wrapper.hidden = false;
    wrapper.tabIndex = -1; // Clic en el relleno conserva foco dentro del control.
    L.DomEvent.disableClickPropagation(wrapper);
    L.DomEvent.disableScrollPropagation(wrapper);
    return wrapper;
  };
  control.addTo(map);
  function close(restoreFocus = true) {
    if (panel.hidden) return;
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if (restoreFocus) button.focus();
  }
  button.addEventListener('click', () => {
    const opening = panel.hidden;
    panel.hidden = !opening;
    button.setAttribute('aria-expanded', String(opening));
    if (opening) { map.closePopup();measurement.focus(); }
  });
  wrapper.addEventListener('keydown', event => {
    // Conserva el comportamiento nativo del selector/checkboxes, no el del mapa.
    event.stopPropagation();
    if (event.key === 'Escape' && !panel.hidden) {
      event.preventDefault();close();
    }
  });
  document.addEventListener('click', event => {
    if (!wrapper.contains(event.target)) {
      close(!event.target.closest('button,input,select,a,[tabindex]'));
    }
  });
  wrapper.addEventListener('focusout', event => {
    if (event.relatedTarget && !wrapper.contains(event.relatedTarget)) close(false);
  });
  map.on('popupopen movestart', () => close(false));
  sensors.addEventListener('change', onSensors);
  borders.addEventListener('change', () => onBorders(borders.checked));
  return control;
};
