/* Disclosure sencillo: dos checkboxes nativos, sin listado territorial. */
window.initAqLayers = function (onSensors, onBorders) {
  const wrapper = document.getElementById('mapa-capas');
  const button = document.getElementById('mapa-capas-button');
  const panel = document.getElementById('mapa-capas-panel');
  const sensors = document.getElementById('mapa-sensores');
  const borders = document.getElementById('mapa-limites');
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
    if (opening) sensors.focus();
  });
  wrapper.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) {
      event.preventDefault();event.stopPropagation();close();
    }
  });
  document.addEventListener('click', event => {
    if (!wrapper.contains(event.target)) {
      // Un clic en otro control conserva su foco; en el fondo vuelve a Capas.
      close(!event.target.closest('button,input,select,a,[tabindex]'));
    }
  });
  wrapper.addEventListener('focusout', event => {
    if (event.relatedTarget && !wrapper.contains(event.relatedTarget)) close(false);
  });
  sensors.addEventListener('change', onSensors);
  borders.addEventListener('change', () => onBorders(borders.checked));
};
