"""Prioridad real de dibujo con Leaflet 1.9.4 y transporte interceptado."""
from pathlib import Path
import base64, hashlib, json, subprocess
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
assets=root/'work/leaflet-1.9.4'
js=(assets/'leaflet.min.js').read_text();css=(assets/'leaflet.min.css').read_text()
assert hashlib.sha256(js.encode()).hexdigest()=='5c9aecfc30e4564519dbdcddcc53a418227dcc7568e619e9762ddcec7609ed47'
assert hashlib.sha256(css.encode()).hexdigest()=='b570abbda963c60b4de4b4ff4b26f9326f53fb2ccf1461fdf0955ca094fb2539'
base='a541d7c'
now=1793372400000
pixel=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for baseline in [True,False]:
  html=subprocess.check_output(['git','show',base+':index.html'],cwd=root,text=True) if baseline else (root/'index.html').read_text()
  data=[dict(sensor_index=i,nombre=f'AE-0{i}',institucion=f'Fixture {i}',proveedor='purpleair',
    timestamp='2026-10-30T14:20:00Z' if i==1 else '2000-01-01T00:00:00Z',pm2_5=4,
    temperatura=22,humedad=48,latitud=-35.63 if i==1 else -35.631,longitud=-59.78) for i in [1,2]]
  if baseline:data[0]['timestamp']='2026-10-30T14:59:00Z'
  c=b.new_context(service_workers='block',viewport={'width':390,'height':844})
  c.add_init_script(f'window.fixtureNow={now};Date.now=()=>fixtureNow;')
  calls=[];errors=[]
  def route(r):
   u=r.request.url;calls.append(u)
   if u=='http://fixture.invalid/?pwa=1':r.fulfill(content_type='text/html',body=html)
   elif 'leaflet.min.js' in u:r.fulfill(content_type='text/javascript',body=js)
   elif 'leaflet.min.css' in u:r.fulfill(content_type='text/css',body=css)
   elif '/api/ultimas' in u:r.fulfill(content_type='application/json',body=json.dumps(data))
   elif '/api/historico/' in u:r.fulfill(content_type='application/json',body='[]')
   elif '/tiles/' in u:r.fulfill(content_type='image/png',body=pixel)
   else:r.abort()
  c.route('**/*',route);page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://fixture.invalid/?pwa=1',wait_until='networkidle')
  page.wait_for_function('latestSensors.length===2 && window.L')
  page.evaluate('showTab("mapa",document.querySelector(\'.nav-btn[onclick*=mapa]\'))')
  # Consulta el elemento realmente pintado encima, no solo números zIndex.
  top='''() => {const m=Object.values(mapaInst._layers).find(x=>x instanceof L.Marker && x.options.alt.startsWith("Fixture 1:"));
    const r=m.getElement().getBoundingClientRect();return document.elementsFromPoint(r.x+22,r.y+22).filter(e=>e.matches?.(".mapa-symbol"))[0]?.dataset.state}'''
  def center(zoom):
   page.evaluate('(z)=>mapaInst.setView([-35.63,-59.78],z,{animate:false})',zoom)
   page.wait_for_timeout(80)
  def check():
   assert page.locator('.mapa-station-icon').count()==2
   assert page.evaluate(top)=='recent'
   assert page.locator('.mapa-station-icon [data-state="stale"]').count()==1
  center(8)
  if baseline:
   assert page.evaluate(top)=='stale'
   page.locator('#tab-mapa > .chart-wrap').screenshot(path=str(root/'work/priority-before.png'))
   print('REPRODUCIDO a541d7c: gris al sur tapa reciente con zoom 8')
  else:
   for width in [320,390,1440]:
    page.set_viewport_size({'width':width,'height':844})
    # Ambas latitudes relativas, coordenadas coincidentes y ambos órdenes API.
    for latitude in [-35.631,-35.629,-35.63]:
     for reverse in [False,True]:
      for row in data:row['latitud']=latitude if row['sensor_index']==2 else -35.63
      data.sort(key=lambda r:r['sensor_index'],reverse=reverse)
      page.evaluate('loadSensors()');page.wait_for_timeout(100)
      for layer in ['aqi','pm2_5','temperatura','humedad']:
       page.select_option('#sel-mapa-param',layer)
       for zoom in [5,8,12,16]:
        center(zoom);check()
       # Hover de gris no atraviesa panel superior.
       page.evaluate('Object.values(mapaInst._layers).filter(x=>x instanceof L.Marker).forEach(x=>x.fire("mouseover"))')
       check()
    page.evaluate('mapaInst.closePopup()');center(8)
    page.locator('#tab-mapa > .chart-wrap').screenshot(path=str(root/f'work/priority-after-{width}.png'))
   # Teclado: gris coincidente sigue enfocable y abre su popup; Escape devuelve foco.
   gray=page.locator('.mapa-station-icon').filter(has=page.locator('[data-state="stale"]'))
   gray.focus();gray.press('Enter')
   assert 'Sin datos recientes' in page.locator('.leaflet-popup-content').inner_text()
   page.locator('.leaflet-popup-close-button').focus();page.keyboard.press('Escape')
   assert gray.evaluate('(e)=>e===document.activeElement')
   gray.press('Space');assert page.locator('.leaflet-popup-content').is_visible()
   page.evaluate('mapaInst.closePopup()')
   # Envejecimiento sin fetch, mismo nodo y prioridad recalculada.
   page.evaluate('window.saved=Object.values(mapaInst._layers).find(x=>x instanceof L.Marker && x.options.alt.startsWith("Fixture 1:"))')
   page.wait_for_load_state('networkidle')
   before=len([u for u in calls if '/api/' in u or '/tiles/' in u]);page.evaluate('fixtureNow+=1;refreshSensorFreshness()')
   assert page.locator('.mapa-station-icon [data-state="stale"]').count()==2
   assert page.evaluate('saved.options.pane==="mapaStale" && saved.getElement().parentNode===mapaInst.getPane("mapaStale")'),page.evaluate('({pane:saved.options.pane, parent:saved.getElement().parentNode.className, now:fixtureNow, timestamps:latestSensors.map(s=>s.timestamp)})')
   assert len([u for u in calls if '/api/' in u or '/tiles/' in u])==before
   # Recuperación vía API ficticia, refresco repetido y cambio de capa.
   for row in data:
    if row['sensor_index']==1:row['timestamp']='2026-10-30T15:00:00Z'
   for _ in range(2):
    page.evaluate('loadSensors()');page.wait_for_timeout(100);check()
   page.select_option('#sel-mapa-param','aqi');check()
   assert page.locator('#mapa-cards > .card').evaluate_all('(es)=>es.map(e=>e.dataset.sensorIndex)')==['1','2']
   # Recuperación por reevaluación local mueve el mismo marcador de panel.
   page.evaluate('window.saved=Object.values(mapaInst._layers).find(x=>x instanceof L.Marker && x.options.alt.startsWith("Fixture 1:"));fixtureNow+=41*60000;refreshSensorFreshness()')
   assert page.evaluate('saved.options.pane==="mapaStale"')
   page.evaluate('latestSensors.find(s=>s.sensor_index===1).timestamp=new Date(fixtureNow).toISOString();refreshSensorFreshness()')
   assert page.evaluate('saved.options.pane==="mapaRecent" && saved.getElement().parentNode===mapaInst.getPane("mapaRecent")')
   check()
   assert not errors,errors
   print('PASS prioridad: cercanos/coincidentes, latitudes y API invertidas, zoom 5/8/12/16, capas, hover, 320/390/1440, gris por Enter/Space/Escape, envejecimiento sin fetch y recuperación local/API, orden intacto')
  c.close()
 b.close()
