"""HTML y Leaflet 1.9.4 reales; transporte totalmente interceptado.
Preparar JS/CSS locales en work/leaflet-1.9.4 antes de ejecutar (ver docs).
"""
from pathlib import Path
import json, subprocess, base64, hashlib
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
assets=root/'work/leaflet-1.9.4'
js=(assets/'leaflet.min.js').read_text();css=(assets/'leaflet.min.css').read_text()
assert '1.9.4' in js
assert hashlib.sha256(js.encode()).hexdigest()=='5c9aecfc30e4564519dbdcddcc53a418227dcc7568e619e9762ddcec7609ed47'
assert hashlib.sha256(css.encode()).hexdigest()=='b570abbda963c60b4de4b4ff4b26f9326f53fb2ccf1461fdf0955ca094fb2539'
base='d76c6870bdeb70da2ff4be428752136532bee320'
rows=[dict(sensor_index=i+1,nombre=f'AE-{i:02}',institucion=f'Escuela fixture AE-{i:02}',
 timestamp='2026-10-30 14:35:00' if i==0 else '2026-10-30 14:59:00',
 pm2_5=pm,temperatura=22.3,humedad=48,presion=1008,co2=500,voc=20,nox=2,
 proveedor='purpleair',latitud=-35.62+i*.005,longitud=-59.79+i*.005)
 for i,pm in enumerate([4,20,45,80,170,280])]
rows+=[dict(rows[1],sensor_index=900002,nombre='AG',institucion='AG fixture',proveedor='airgradient',timestamp='2000-01-01 00:00:00',latitud=-35.65),
       dict(rows[1],sensor_index=99,nombre='PA',institucion='PA fixture',pm2_5=None,latitud=-35.67)]
pixel=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for baseline in [True,False]:
  html=subprocess.check_output(['git','show',base+':index.html'],cwd=root,text=True) if baseline else (root/'index.html').read_text()
  html=html.replace('const API_BASE = "https://api.lemeit.ar/aq";','const API_BASE = "http://fixture.invalid";')
  c=b.new_context(service_workers='block',viewport={'width':390,'height':844})
  c.add_init_script('window.fixtureNow=1793372400000;Date.now=()=>window.fixtureNow;')
  data=json.loads(json.dumps(rows));mode={'value':'ok'};calls=[];pending=[]
  def route(r):
   u=r.request.url;calls.append(u)
   if u=='http://fixture.invalid/?pwa=1':r.fulfill(content_type='text/html',body=html)
   elif 'leaflet.min.js' in u:r.fulfill(content_type='text/javascript',body=js)
   elif 'leaflet.min.css' in u:r.fulfill(content_type='text/css',body=css)
   elif '/api/ultimas' in u:
    if mode['value']=='offline':r.abort()
    elif mode['value']=='pending':pending.append(r)
    elif mode['value']=='http':r.fulfill(status=503,content_type='application/json',body='{"error":"fixture"}')
    else:r.fulfill(content_type='application/json',body=json.dumps(data))
   elif '/api/historico/' in u:r.fulfill(content_type='application/json',body='[]')
   elif '/tiles/' in u:r.fulfill(content_type='image/png',body=pixel)
   else:r.abort()
  c.route('**/*',route);page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://fixture.invalid/?pwa=1',wait_until='networkidle')
  page.wait_for_function('latestSensors.length===8 && window.L && L.version==="1.9.4"')
  page.evaluate('showTab("mapa",document.querySelector(\'.nav-btn[onclick*=mapa]\'));mapaInst.setView([-35.63,-59.78],12)')
  page.wait_for_timeout(250)
  if baseline:
   assert page.locator('.leaflet-marker-icon').count()==8
   assert page.locator('path.leaflet-interactive').count()==8 # círculo más etiqueta
   assert page.locator('.leaflet-marker-icon').first.inner_text()
   print('REPRODUCIDO main: doble capa por estación y etiquetas numéricas/largas; color depende AQI')
  else:
   markers=page.locator('.mapa-station-icon')
   assert markers.count()==8
   assert page.locator('path.leaflet-interactive').count()==0
   assert markers.evaluate_all('(els)=>els.every(e=>!e.textContent.trim())')
   shapes=['circle','square','triangle','diamond','hexagon','star','stale','missing']
   assert markers.locator('[data-shape]').evaluate_all('(els)=>els.map(e=>e.dataset.shape)')==shapes
   assert page.locator('#sel-mapa-param option[value=aqi]').inner_text()=='AQI · EPA'
   assert 'Índice de calidad del aire (AQI · EPA)' in page.locator('#mapa-legend').inner_text()
   for width in [320,390,1440]:
    page.set_viewport_size({'width':width,'height':844})
    for lang in ['es','en']:
     page.evaluate('(v)=>setLang(v)',lang)
     for theme in ['dark','light']:
      page.evaluate('(v)=>document.documentElement.setAttribute("data-theme",v)',theme)
      assert markers.count()==8
      assert markers.nth(0).get_attribute('role')=='button'
      assert markers.nth(0).get_attribute('tabindex')=='0'
      assert '2026' in markers.nth(0).get_attribute('aria-label')
      assert markers.nth(0).evaluate('(e)=>e.offsetWidth===44 && e.offsetHeight===44')
      assert markers.nth(0).locator('.mapa-symbol').evaluate('(e)=>getComputedStyle(e).color')==('rgb(217, 105, 31)' if theme=='dark' else 'rgb(155, 61, 0)')
      assert markers.nth(6).locator('.mapa-symbol').evaluate('(e)=>getComputedStyle(e).color')=='rgb(199, 199, 199)'
      assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,lang,theme)
      assert page.locator('#mapa-legend [data-shape]').count()==8
      assert page.locator('#mapa-cards > .card').evaluate_all('(els)=>els.map(e=>Number(e.dataset.sensorIndex))')==[1,2,3,4,5,6,900002,99]
    page.evaluate('setLang("es");document.documentElement.setAttribute("data-theme","light")')
    page.locator('#mapa-container').screenshot(path=str(root/'work'/f'markers-map-{width}.png'))
   # Leaflet real: Enter y Space abren popup, nombres accesibles no dependen de color.
   markers.nth(1).focus();markers.nth(1).press('Enter')
   assert page.locator('.leaflet-popup-content').last.is_visible()
   assert 'AQI · EPA' in page.locator('.leaflet-popup-content').last.inner_text()
   page.evaluate('mapaInst.closePopup()');markers.nth(1).press('Space')
   assert page.locator('.leaflet-popup-content').last.is_visible()
   page.locator('.leaflet-popup-close-button').last.focus()
   page.keyboard.press('Escape');page.wait_for_timeout(300)
   assert page.locator('.leaflet-popup-content').count()==0
   assert markers.nth(1).evaluate('(e)=>e===document.activeElement')
   # Todas las capas restantes conservan marcadores neutros y valor elegido/unidad real.
   for param,value in [('pm2_5','20 µg/m³'),('temperatura','22.3 °C'),('humedad','48 %'),('presion','1008 hPa'),('voc','20 (índice)'),('co2','500 ppm'),('nox','2 (índice)')]:
    page.select_option('#sel-mapa-param',param);page.wait_for_timeout(50)
    assert markers.nth(1).locator('[data-shape]').get_attribute('data-shape')=='measurement'
    page.evaluate('mapaInst.setView([latestSensors[1].latitud,latestSensors[1].longitud],15,{animate:false})')
    markers.nth(1).click();popup=page.locator('.leaflet-popup-content').last.inner_text()
    assert value in popup,(param,popup)
    assert 'Última medición' in popup and 'Datos recientes' in popup and '2026' in popup
    assert page.locator('#mapa-legend [data-shape]').count()==3
   page.select_option('#sel-mapa-param','aqi');page.evaluate('mapaInst.closePopup()')
   page.evaluate('window.savedMarker=Object.values(mapaInst._layers).find(x=>x instanceof L.Marker);window.savedBack=document.querySelector("#mapa-cards .card-back")')
   before=len([u for u in calls if '/api/' in u or '/tiles/' in u])
   page.evaluate('fixtureNow+=1')
   page.wait_for_function('document.querySelector(".mapa-station-icon .mapa-symbol").dataset.shape==="stale"')
   assert len([u for u in calls if '/api/' in u or '/tiles/' in u])==before
   assert page.evaluate('savedMarker===Object.values(mapaInst._layers).find(x=>x instanceof L.Marker) && savedBack===document.querySelector("#mapa-cards .card-back")')
   assert page.locator('#mapa-cards .card[data-sensor-index="1"] .sensor-stale').count()==1
   markers.nth(0).click();assert 'Sin datos recientes' in page.locator('.leaflet-popup-content').last.inner_text()
   assert '2026' in page.locator('.leaflet-popup-content').last.inner_text()
   for failure in ['offline','http']:
    mode['value']=failure;page.evaluate('fixtureNow+=1000;loadSensors()');page.wait_for_timeout(100)
    assert markers.nth(0).locator('[data-shape]').get_attribute('data-shape')=='stale'
   mode['value']='pending';page.evaluate('loadSensors();fixtureNow+=30*60000;document.dispatchEvent(new Event("visibilitychange"))')
   assert markers.locator('[data-shape="stale"]').count()==8
   for r in pending:r.abort()
   pending.clear();page.wait_for_timeout(50)
   mode['value']='ok';data[0]['timestamp']='2026-10-30T15:30:00Z';page.evaluate('loadSensors()');page.wait_for_timeout(150)
   assert markers.nth(0).locator('[data-shape]').get_attribute('data-shape')=='circle'
   assert page.locator('#mapa-cards .card[data-sensor-index="1"] .sensor-stale').count()==0
   assert not errors,errors
   print('PASS: Leaflet 1.9.4 real, seis categorías, un acento, teclado Enter/Space/Escape, foco/nombre/tamaño, 320/390/1440, ES/EN, temas, parámetros, frescura/red/recuperación, orden y sin fetch al envejecer')
  c.close()
 b.close()
