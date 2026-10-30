"""AQ-09: HTML real, Chromium, red totalmente interceptada y Leaflet sustituido."""
from pathlib import Path
import json, subprocess
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
base='dc951eca4e509d1898e95f3e9578ab09160ca19b'
now=1793372400000 # 2026-10-30 15:00 UTC
rows=[dict(sensor_index=i,nombre=name,proveedor=provider,timestamp=ts,pm2_5=4,co2=co2,
           institucion='Escuela fixture '+name,latitud=-35.6,longitud=-59.7)
      for i,name,provider,ts,co2 in [(3,'AE-02','purpleair','2026-10-30 14:35:00',None),
       (1,'AE-00','purpleair','2026-10-30 14:36:00',None),
       (2,'AE-01','purpleair','2026-10-29 14:00:00',None),
       (900002,'AirGradient','airgradient','2026-10-30 14:59:00',400)]]
# Ejecuta cargarMapa real con adaptador que retiene estilos, texto y popups.
adapter='''() => {
 window.layers=[];
 class Layer {
  constructor(options){this.options=options;}
  addTo(){layers.push(this);return this;}
  bindPopup(html){this.popup=html;return this;}
  on(){return this;}
  getElement(){return null;}
  setStyle(style){Object.assign(this.options,style);return this;}
  setPopupContent(html){this.popup=html;return this;}
  setIcon(icon){this.options.icon=icon;return this;}
 }
 class CircleMarker extends Layer {};
 class Marker extends Layer {};
 window.L={CircleMarker,Marker,tileLayer:()=>new Layer({}),
  circleMarker:(coords,opts)=>new CircleMarker(opts),marker:(coords,opts)=>new Marker(opts),divIcon:opts=>opts};
 mapaInst={eachLayer(fn){[...layers].forEach(fn)},removeLayer(l){layers=layers.filter(x=>x!==l)},invalidateSize(){}};
 cargarMapa();
}'''
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for baseline in [True,False]:
  html=subprocess.check_output(['git','show',base+':index.html'],cwd=root,text=True) if baseline else (root/'index.html').read_text()
  html=html.replace('const API_BASE = "https://api.lemeit.ar/aq";', 'const API_BASE = "http://fixture.invalid";')
  c=b.new_context(service_workers='block',viewport={'width':390,'height':844})
  c.add_init_script(f'window.fixtureNow={now};Date.now=()=>window.fixtureNow;')
  mode={'value':'ok'};calls=[];pending=[];data=json.loads(json.dumps(rows))
  def route(r):
   u=r.request.url;calls.append(u)
   if u=='http://fixture.invalid/?pwa=1':r.fulfill(content_type='text/html',body=html)
   elif u=='http://fixture.invalid/api/ultimas':
    if mode['value']=='offline':r.abort()
    elif mode['value']=='http':r.fulfill(status=503,content_type='application/json',body='{"error":"fixture"}')
    elif mode['value']=='bad':r.fulfill(content_type='application/json',body='{"error":"fixture"}')
    elif mode['value']=='pending':pending.append(r);return # sin respuesta, no bloqueo del reloj local
    else:r.fulfill(content_type='application/json',body=json.dumps(data))
   elif '/api/historico/' in u:r.fulfill(content_type='application/json',body='[]')
   else:r.abort()
  c.route('**/*',route);page=c.new_page();errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://fixture.invalid/?pwa=1',wait_until='networkidle')
  page.wait_for_function('latestSensors.length===4');page.evaluate(adapter)
  if baseline:
   assert page.evaluate('layers.filter(x=>x instanceof L.CircleMarker)[2].options.fillColor')!='#808080'
   mode['value']='offline';page.evaluate('fixtureNow+=60001;loadSensors()');page.wait_for_timeout(1200)
   assert page.locator('#sensor-grid .card[data-sensor-index="3"] .badge').inner_text()!='Sin datos recientes'
   print('REPRODUCIDO en main: mapa colorea lectura antigua y tarjeta no envejece tras fallo de red')
  else:
   assert page.locator('#sensor-grid .card[data-sensor-index="3"] .badge').inner_text()!='Sin datos recientes' # exactamente 25
   # Reloj cambia sin completar una solicitud: timer debe actualizar ambas vistas.
   selection=page.evaluate('currentSensorIndex');original=page.evaluate('JSON.stringify(latestSensors)')
   page.evaluate('window.savedMarker=layers.find(x=>x instanceof L.Marker);window.savedBack=document.querySelector("#mapa-cards .card-back")');
   before=len([u for u in calls if '/api/' in u or '/tiles/' in u]);page.evaluate('fixtureNow+=1')
   page.wait_for_function('document.querySelector("#sensor-grid .card[data-sensor-index=\\"3\\"] .sensor-stale")')
   assert len([u for u in calls if '/api/' in u or '/tiles/' in u])==before, 'envejecer no debe consultar API ni tiles'
   assert page.evaluate('currentSensorIndex')==selection
   assert page.evaluate('savedMarker===layers.find(x=>x instanceof L.Marker) && savedBack===document.querySelector("#mapa-cards .card-back")')
   assert page.evaluate('JSON.stringify(latestSensors)')==original
   assert 'data-shape="stale"' in page.evaluate('layers.filter(x=>x instanceof L.Marker)[0].options.icon.html')
   popup=page.evaluate('layers.filter(x=>x instanceof L.Marker)[0].popup')
   assert 'Sin datos recientes' in popup and 'Última medición' in popup and '2026' in popup and 'Buena' not in popup
   for selector in ['#sensor-grid','#mapa-cards']:
    assert page.locator(selector+' > .card').evaluate_all('(c)=>c.map(x=>Number(x.dataset.sensorIndex))')==[1,2,3,900002]
   # Red caída, HTTP y payload no-array también deben envejecer con datos retenidos.
   for mode_name in ['offline','http','bad']:
    mode['value']=mode_name;page.evaluate('fixtureNow+=60000;loadSensors()');page.wait_for_timeout(150)
    assert page.locator('#dot').evaluate('(e)=>e.classList.contains("error")')
    assert page.locator('#sensor-grid .card').count()==4
    assert page.locator('#sensor-grid .card[data-sensor-index="1"] .sensor-stale').count()==1
   # Recuperación con lectura nueva; fecha nula, inválida y futura no rompen otras tarjetas.
   mode['value']='ok'
   data[0]['timestamp']='2026-10-30T15:03:00Z';data[1]['timestamp']=None
   data[2]['timestamp']='invalid';data[3]['timestamp']='2099-01-01 00:00:00'
   page.evaluate('loadSensors()');page.wait_for_timeout(150);page.evaluate('cargarMapa()')
   assert page.locator('#sensor-grid .card[data-sensor-index="3"] .sensor-stale').count()==0
   assert 'data-shape="circle"' in page.evaluate('layers.filter(x=>x instanceof L.Marker)[0].options.icon.html')
   assert page.locator('#sensor-grid .sensor-stale').count()==3
   for width in [390,1440]:
    page.set_viewport_size({'width':width,'height':844})
    for lang,label in [('es','Sin datos recientes'),('en','No recent data')]:
     page.evaluate('(lang)=>setLang(lang)',lang);page.evaluate('cargarMapa()')
     for theme in ['dark','light']:
      page.evaluate('(v)=>document.documentElement.setAttribute("data-theme",v)',theme)
      assert page.locator('#sensor-grid .badge').get_by_text(label,exact=True).count()==3
      assert page.locator('#sensor-grid .sensor-stale .badge').first.is_visible()
      assert page.locator('#sensor-grid .sensor-stale .card-sub').last.get_attribute('aria-hidden') is None
      assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,lang)
      assert page.locator('#mapa-legend').inner_text().count(label)==1
     if lang=='es':page.screenshot(path=str(root/'work'/f'freshness-{width}.png'))
   # Resume de pestaña y petición colgada: evento local y timer continúan sin API.
   mode['value']='pending';page.evaluate('loadSensors();fixtureNow+=30*60000;document.dispatchEvent(new Event("visibilitychange"))')
   assert page.locator('#sensor-grid .sensor-stale').count()==4
   assert not errors,errors
   print('PASS: borde 25 min, timer sin fetch, red/HTTP/payload, recuperación, NULL/inválido/futuro, ambas vistas, orden/selección, ES/EN, 390/1440, temas y accesibilidad básica')
  for r in pending:r.abort()
  page.wait_for_timeout(100)
  c.close()
 b.close()
