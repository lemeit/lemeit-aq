"""Control Capas y vista PBA: Leaflet real, datos locales y transporte interceptado."""
from pathlib import Path
import base64, hashlib, json, subprocess
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
base='f2463ef72a615142029f9ebb16dd2f7b34751b3b'
js=(root/'work/leaflet-1.9.4/leaflet.min.js').read_text();css=(root/'work/leaflet-1.9.4/leaflet.min.css').read_text()
assert hashlib.sha256(js.encode()).hexdigest()=='5c9aecfc30e4564519dbdcddcc53a418227dcc7568e619e9762ddcec7609ed47'
assert hashlib.sha256(css.encode()).hexdigest()=='b570abbda963c60b4de4b4ff4b26f9326f53fb2ccf1461fdf0955ca094fb2539'
pixel=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for baseline,width in [(True,390),(False,320),(False,390),(False,1440)]:
  html=subprocess.check_output(['git','show',base+':index.html'],cwd=root,text=True) if baseline else (root/'index.html').read_text()
  rows=[dict(sensor_index=i,nombre=f'AE-0{i}',institucion=f'Fixture {i}',proveedor='purpleair',
   timestamp='2026-10-30T14:20:00Z' if i==1 else '2000-01-01T00:00:00Z',pm2_5=4,
   temperatura=22,humedad=48,latitud=-35.63 if i==1 else -35.631,longitud=-59.78) for i in [1,2]]
  c=b.new_context(service_workers='block',viewport={'width':width,'height':900})
  c.add_init_script('window.fixtureNow=1793372400000;Date.now=()=>fixtureNow;')
  calls=[];errors=[];mode={'value':'ok'}
  def route(r):
   u=r.request.url;calls.append(u)
   if u.startswith('http://fixture.invalid/?'):r.fulfill(content_type='text/html',body=html)
   elif '/assets/' in u:
    path='assets/'+u.split('/assets/')[1]
    content=subprocess.check_output(['git','show',base+':'+path],cwd=root,text=True) if baseline else (root/path).read_text()
    r.fulfill(content_type='text/javascript',body=content)
   elif 'leaflet.min.js' in u:r.fulfill(content_type='text/javascript',body=js)
   elif 'leaflet.min.css' in u:r.fulfill(content_type='text/css',body=css)
   elif '/api/ultimas' in u:
    if mode['value']=='error':r.fulfill(status=503,body='{}',content_type='application/json')
    else:r.fulfill(content_type='application/json',body=json.dumps(rows))
   elif '/api/historico/' in u:r.fulfill(content_type='application/json',body='[]')
   elif '/tiles/' in u:r.fulfill(content_type='image/png',body=pixel)
   else:r.abort()
  c.route('**/*',route);page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://fixture.invalid/?pwa=1',wait_until='networkidle')
  page.wait_for_function('latestSensors.length===2 && window.L')
  page.evaluate("showTab('mapa',document.querySelector('.nav-btn[onclick*=mapa]'))")
  page.wait_for_timeout(150)
  if baseline:
   assert page.locator('#sel-mapa-partido option').count()==136
   assert page.locator('#mapa-capas-button').count()==0
   assert page.locator('.pba-label').count()==0
   page.locator('#tab-mapa > .chart-wrap').screenshot(path=str(root/'work/layers-before-390.png'))
   print('REPRODUCIDO main f2463ef: listado de 135 partidos; no existe control de grupos Capas',flush=True)
   c.close();continue
  button=page.locator('#mapa-capas-button');panel=page.locator('#mapa-capas-panel')
  sensors=page.locator('#mapa-sensores');borders=page.locator('#mapa-limites')
  assert page.locator('#sel-mapa-partido,.pba-label,.leaflet-pbaLabels-pane').count()==0
  assert panel.is_hidden() and button.get_attribute('aria-expanded')=='false'
  assert sensors.is_checked() and borders.is_checked()
  assert page.evaluate('mapaInst.getBounds().contains(mapaTerritorio.bounds)')
  page.evaluate('mapaInst.setView([-35.63,-59.78],8,{animate:false});window.savedBorder=document.querySelector(".leaflet-pbaBorders-pane path")')
  page.wait_for_load_state('networkidle')
  original=page.evaluate('JSON.stringify(latestSensors)')
  view=page.evaluate('({center:mapaInst.getCenter(),zoom:mapaInst.getZoom()})')
  def open_panel():
   if panel.is_hidden():button.click()
   assert button.get_attribute('aria-expanded')=='true'
  def visible(selector):return page.locator(selector).evaluate('(e)=>getComputedStyle(e).display!="none"')
  def no_recreation():
   assert page.evaluate('savedBorder===document.querySelector(".leaflet-pbaBorders-pane path")')
  before=len([u for u in calls if '/api/' in u or '/tiles/' in u or '/assets/' in u])
  open_panel();assert sensors.evaluate('(e)=>e===document.activeElement')
  sensors.uncheck()
  assert not visible('.leaflet-mapaRecent-pane') and not visible('.leaflet-mapaStale-pane')
  assert page.locator('#mapa-legend').is_hidden()
  assert page.locator('#mapa-cards > .card').count()==2
  assert visible('.leaflet-pbaBorders-pane')
  borders.uncheck();assert not visible('.leaflet-pbaBorders-pane')
  assert 'ARBA/IGN' not in page.locator('.leaflet-control-attribution').inner_text()
  borders.check();assert visible('.leaflet-pbaBorders-pane');no_recreation()
  assert page.locator('.leaflet-control-attribution').inner_text().count('ARBA/IGN')==1
  assert 'CC BY 4.0' in page.locator('.leaflet-control-attribution').inner_text()
  assert len([u for u in calls if '/api/' in u or '/tiles/' in u or '/assets/' in u])==before
  assert page.evaluate('JSON.stringify(latestSensors)')==original
  # Persistencia: ambos ocultos atraviesan capa, refresco, idioma/tema y fallo API.
  borders.uncheck();panel.press('Escape')
  assert button.evaluate('(e)=>e===document.activeElement') and panel.is_hidden()
  for lang in ['es','en']:
   page.evaluate('(v)=>setLang(v)',lang)
   for theme in ['light','dark']:
    page.evaluate('(v)=>document.documentElement.setAttribute("data-theme",v)',theme)
    for layer in ['aqi','pm2_5','temperatura','humedad']:
     page.select_option('#sel-mapa-param',layer);page.wait_for_timeout(40)
     assert not sensors.is_checked() and not borders.is_checked()
     assert not visible('.leaflet-mapaRecent-pane') and not visible('.leaflet-pbaBorders-pane')
     assert page.locator('#mapa-legend').is_hidden()
     assert page.evaluate('({center:mapaInst.getCenter(),zoom:mapaInst.getZoom()})')==view
    open_panel()
    r=panel.bounding_box();assert r['x']>=0 and r['x']+r['width']<=width
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.locator('#tab-mapa > .chart-wrap').screenshot(path=str(root/f'work/layers-{width}-{lang}-{theme}-open.png'))
    sensors.press('Escape');assert panel.is_hidden()
  for state in ['ok','error','ok']:
   mode['value']=state;page.evaluate('loadSensors()');page.wait_for_timeout(120)
   assert not visible('.leaflet-mapaRecent-pane') and not visible('.leaflet-pbaBorders-pane')
   assert page.locator('#mapa-cards > .card').count()==2
   no_recreation()
  # Envejece mientras está oculto y vuelve gris al mostrarlo; luego recupera.
  page.evaluate('fixtureNow+=1;refreshSensorFreshness()')
  assert page.locator('.mapa-station-icon[title^="Fixture 1:"] [data-state="stale"]').count()==1
  open_panel();sensors.check();assert not visible('.leaflet-pbaBorders-pane')
  assert visible('.leaflet-mapaStale-pane') and page.locator('#mapa-legend').is_visible()
  sensors.uncheck();rows[0]['timestamp']='2026-10-30T15:00:00Z'
  page.evaluate('loadSensors()');page.wait_for_timeout(120)
  assert not visible('.leaflet-mapaRecent-pane')
  sensors.check();borders.check();no_recreation();panel.press('Escape')
  page.evaluate('setLang("es")');page.select_option('#sel-mapa-param','aqi')
  # Prioridad real #38 sobre coordenadas casi coincidentes y varios zooms.
  for zoom in [5,8,12]:
   page.evaluate('(z)=>mapaInst.setView([-35.63,-59.78],z,{animate:false})',zoom);page.wait_for_timeout(60)
   assert page.evaluate('''() => {const e=document.querySelector('.mapa-station-icon[title^="Fixture 1:"]');const r=e.getBoundingClientRect();return document.elementsFromPoint(r.x+22,r.y+22).filter(e=>e.matches?.('.mapa-symbol'))[0]?.dataset.state}''')=='recent'
  page.evaluate('mapaInst.setView([-35.63,-59.78],8,{animate:false})')
  recent=page.locator('.mapa-station-icon[title^="Fixture 1:"]');recent.click()
  assert 'AQI · EPA' in page.locator('.leaflet-popup-content').inner_text()
  open_panel();sensors.uncheck();page.locator('.leaflet-popup-content').wait_for(state='detached')
  sensors.check();panel.press('Escape')
  gray=page.locator('.mapa-station-icon[title^="Fixture 2:"]');gray.focus();gray.press('Enter')
  assert 'Sin datos recientes' in page.locator('.leaflet-popup-content').inner_text()
  page.locator('.leaflet-popup-close-button').focus();page.keyboard.press('Escape')
  assert gray.evaluate('(e)=>e===document.activeElement')
  gray.press('Space');assert page.locator('.leaflet-popup-content').is_visible();page.evaluate('mapaInst.closePopup()')
  # Toggle y cierres del disclosure por teclado, clic fuera y foco.
  button.focus();button.press('Space');assert panel.is_visible()
  sensors.press('Escape');assert button.evaluate('(e)=>e===document.activeElement')
  button.press('Enter');assert panel.is_visible()
  page.locator('#mapa-container').click(position={'x':260 if width>320 else 250,'y':300})
  assert panel.is_hidden()
  button.click();page.locator('#tab-mapa .chart-hdr h2').click()
  assert panel.is_hidden() and button.evaluate('(e)=>e===document.activeElement')
  button.click();button.click();assert panel.is_hidden()
  page.locator('#tab-mapa > .chart-wrap').screenshot(path=str(root/f'work/layers-{width}-closed.png'))
  page.evaluate('mapaInst.setView([-32,-64],7,{animate:false})')
  page.locator('.mapa-territorio > button').click()
  assert page.evaluate('mapaInst.getBounds().contains(mapaTerritorio.bounds)')
  assert page.locator('#mapa-cards > .card').evaluate_all('(es)=>es.map(e=>e.dataset.sensorIndex)')==['1','2']
  assert not errors,errors
  print(f'PASS {width}px: panel/toggles independientes, identidad/fetch/atribución, persistencia, ocultos envejecen/recuperan, #38, foco/teclado, ES/EN/temas y vista PBA',flush=True)
  c.close()
 b.close()
