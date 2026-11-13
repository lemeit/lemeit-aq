"""Vista PBA con Leaflet real, capa local real y API/tiles interceptados."""
from pathlib import Path
import base64, hashlib, json, subprocess
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
js=(root/'work/leaflet-1.9.4/leaflet.min.js').read_text();css=(root/'work/leaflet-1.9.4/leaflet.min.css').read_text()
assert hashlib.sha256(js.encode()).hexdigest()=='5c9aecfc30e4564519dbdcddcc53a418227dcc7568e619e9762ddcec7609ed47'
base='797ce96'
pixel=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for baseline in [True,False]:
  for width in ([390] if baseline else [320,390,1440]):
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
     path=u.split('/assets/')[1]
     file=root/'assets'/path
     if mode['value']=='geo-error':r.abort()
     elif file.is_file():r.fulfill(content_type='text/javascript',body=file.read_text())
     else:r.abort()
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
   page.wait_for_function('mapaInst')
   if baseline:
    assert not page.evaluate('mapaInst.getBounds().contains([[-41.03777,-63.3859],[-33.26185,-56.66499]])')
    assert page.locator('.pba-label').count()==0
    print('REPRODUCIDO 797ce96: encuadre local, sin nombres de partidos PBA')
    c.close();continue
   page.wait_for_timeout(250)
   assert page.evaluate('mapaInst.getBounds().contains(mapaTerritorio.bounds)')
   assert page.locator('#sel-mapa-partido option').count()==136
   assert page.locator('.pba-label').count()==135
   assert page.locator('.mapa-station-icon').count()==2
   def labels_ok():
    return page.evaluate('''() => {
      const labels=[...document.querySelectorAll('.pba-label:not([hidden])')].map(e=>e.getBoundingClientRect());
      const symbols=[...document.querySelectorAll('.mapa-station-icon')].map(e=>e.getBoundingClientRect());
      const intersects=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
      return labels.every((r,i)=>labels.slice(i+1).every(s=>!intersects(r,s))&&symbols.every(s=>!intersects(r,s)));
    }''')
   n=page.locator('.pba-label:not([hidden])').count();assert 0<n<=(10 if width<600 else 22),n
   assert labels_ok()
   for theme in ['light','dark']:
    page.evaluate('(theme)=>document.documentElement.setAttribute("data-theme",theme)',theme)
    page.locator('#tab-mapa > .chart-wrap').screenshot(path=str(root/f'work/pba-{width}-{theme}.png'))
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   assert page.locator('.leaflet-pbaLabels-pane').evaluate('(e)=>getComputedStyle(e).pointerEvents')=='none'
   assert page.locator('.leaflet-pbaBorders-pane').evaluate('(e)=>getComputedStyle(e).pointerEvents')=='none'
   # Cada nombre es consultable por selector; también los distritos pequeños del AMBA.
   options=page.locator('#sel-mapa-partido option').evaluate_all('(es)=>es.slice(1).map(e=>({id:e.value,name:e.textContent}))')
   chosen=options if width==390 else [o for o in options if o['name'] in ['Saladillo','25 de Mayo','La Plata','Lezama','Vicente López']]
   for option in chosen:
    page.select_option('#sel-mapa-partido',option['id']);page.wait_for_timeout(35)
    assert page.evaluate('(id)=>mapaInst.getBounds().contains(L.geoJSON(AQ_PBA.features.find(f=>f.properties.id===id)).getBounds())',option['id'])
    assert page.locator('.pba-label:not([hidden]) > span').get_by_text(option['name'],exact=True).count()==1,option
    assert labels_ok(),option
   for name in ['Saladillo','25 de Mayo']:
    option=next(o for o in options if o['name']==name)
    page.select_option('#sel-mapa-partido',option['id']);page.wait_for_timeout(100)
    page.locator('#tab-mapa > .chart-wrap').screenshot(path=str(root/f'work/pba-{width}-{name.replace(" ","-")}.png'))
   # Vista manual persiste al cambiar capa, refrescar, fallar API, cambiar idioma/tema.
   page.evaluate('mapaInst.setView([-35.63,-59.78],8,{animate:false})');page.wait_for_timeout(80)
   view=page.evaluate('({center:mapaInst.getCenter(),zoom:mapaInst.getZoom()})')
   for layer in ['aqi','pm2_5','temperatura','humedad']:
    page.select_option('#sel-mapa-param',layer);page.wait_for_timeout(70)
    assert page.evaluate('({center:mapaInst.getCenter(),zoom:mapaInst.getZoom()})')==view,(view,page.evaluate('({center:mapaInst.getCenter(),zoom:mapaInst.getZoom()})'))
    assert labels_ok()
   page.evaluate('loadSensors()');page.wait_for_timeout(150)
   assert page.evaluate('({center:mapaInst.getCenter(),zoom:mapaInst.getZoom()})')==view,(view,page.evaluate('({center:mapaInst.getCenter(),zoom:mapaInst.getZoom()})'))
   mode['value']='error';page.evaluate('loadSensors()');page.wait_for_timeout(150)
   assert page.locator('#dot.error').count()==1
   assert page.evaluate('({center:mapaInst.getCenter(),zoom:mapaInst.getZoom()})')==view,(view,page.evaluate('({center:mapaInst.getCenter(),zoom:mapaInst.getZoom()})'))
   assert page.locator('#sel-mapa-partido option').count()==136
   for lang in ['en','es']:
    page.evaluate('(lang)=>setLang(lang)',lang);page.wait_for_timeout(70)
    assert page.evaluate('({center:mapaInst.getCenter(),zoom:mapaInst.getZoom()})')==view,(view,page.evaluate('({center:mapaInst.getCenter(),zoom:mapaInst.getZoom()})'))
   # #38: sensores recientes sobre grises, accesibles y sin interceptación territorial.
   recent=page.locator('.mapa-station-icon[title^="Fixture 1:"]')
   gray=page.locator('.mapa-station-icon[title^="Fixture 2:"]')
   assert recent.evaluate('(e)=>e.parentNode.classList.contains("leaflet-mapaRecent-pane")')
   assert gray.evaluate('(e)=>e.parentNode.classList.contains("leaflet-mapaStale-pane")')
   recent.click();assert page.locator('.leaflet-popup-content').is_visible()
   page.evaluate('mapaInst.closePopup()');gray.focus();gray.press('Enter')
   assert 'Sin datos recientes' in page.locator('.leaflet-popup-content').inner_text()
   page.locator('.leaflet-popup-close-button').focus();page.keyboard.press('Escape')
   assert gray.evaluate('(e)=>e===document.activeElement')
   page.evaluate('fixtureNow+=1;refreshSensorFreshness()');assert recent.locator('[data-state="stale"]').count()==1
   mode['value']='ok';rows[0]['timestamp']='2026-10-30T15:00:00Z';page.evaluate('loadSensors()');page.wait_for_timeout(120)
   assert recent.locator('[data-state="recent"]').count()==1
   # Se puede salir de la provincia: no maxBounds ni recorte rígido.
   page.evaluate('mapaInst.setView([-32,-64],7,{animate:false})')
   assert abs(page.evaluate('mapaInst.getCenter().lat')+32)<.01
   button=page.locator('.mapa-territorio button');button.focus();button.press('Enter');page.wait_for_timeout(100)
   assert page.evaluate('mapaInst.getBounds().contains(mapaTerritorio.bounds)')
   assert page.locator('#sel-mapa-partido').input_value()==''
   if width==1440:
    mode['value']='error'
    page.goto('http://fixture.invalid/?province-test=1',wait_until='networkidle')
    page.wait_for_function('mapaInst && mapaTerritorio')
    assert page.locator('#dot.error').count()==1
    assert page.locator('.pba-label').count()==135
    assert page.evaluate('mapaInst.getBounds().contains(mapaTerritorio.bounds)')
    mode['value']='geo-error'
    page.goto('http://fixture.invalid/?province-test=1',wait_until='networkidle')
    page.wait_for_function('mapaInst && latestSensors.length===2')
    assert page.locator('#sel-mapa-partido').is_disabled()
    assert page.locator('.mapa-station-icon').count()==2
    assert page.evaluate('mapaInst.getBounds().contains([[-41.03777,-63.3859],[-33.26185,-56.66499]])')
   assert not errors,errors
   print(f'PASS PBA {width}px: provincia completa, 135 partidos seleccionables, etiquetas sin colisiones/sensores, Saladillo/25 de Mayo, pan libre, reset teclado, vistas/capas/API fallida, paleta y prioridad/frescura #38')
   c.close()
 b.close()
