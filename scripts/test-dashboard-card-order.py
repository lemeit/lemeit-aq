"""HTML real y Chromium; toda solicitud interceptada, sin transporte externo."""
from pathlib import Path
import json, subprocess
from playwright.sync_api import sync_playwright
root = Path(__file__).resolve().parents[1]
base = '2b3032976e49c5e75f2f4153f6803c522af3ecff'
rows = [dict(sensor_index=i, codigo=code, nombre=name, proveedor=provider,
             institucion='Fixture', timestamp='2026-01-01 00:00:00', pm2_5=None, latitud=-35.6, longitud=-59.7)
        for i,code,name,provider in [(198617,'AE-00','AE-00','purpleair'),(298687,'AE-01','AE-01','purpleair'),(298691,None,'AE-03','purpleair'),(298701,'AE-02','AE-02','purpleair'),(900003,None,'Centro','airgradient'),(900002,None,'Evaluación','airgradient'),(7,None,'Sin AE','purpleair')]]
expected = [198617,298687,298701,298691,900002,900003,7]
with sync_playwright() as p:
 b = p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for baseline in [True,False]:
  html = subprocess.check_output(['git','show',base+':index.html'],cwd=root,text=True) if baseline else (root/'index.html').read_text()
  c = b.new_context(service_workers='block')
  def route(r):
   if r.request.url == 'http://fixture.invalid/?pwa=1': r.fulfill(content_type='text/html',body=html)
   elif r.request.url.endswith('/api/ultimas'): r.fulfill(content_type='application/json',body=json.dumps(rows))
   elif '/api/historico/' in r.request.url: r.fulfill(content_type='application/json',body='[]')
   else: r.abort()
  c.route('**/*',route)
  page = c.new_page()
  errors=[]
  page.on('pageerror', lambda e: errors.append(str(e)))
  page.goto('http://fixture.invalid/?pwa=1',wait_until='networkidle')
  page.wait_for_function('latestSensors.length === 7')
  ids = lambda: page.locator('#sensor-grid > .card').evaluate_all('(cards)=>cards.map(c=>Number(c.dataset.sensorIndex))')
  if baseline:
   assert ids() == [s['sensor_index'] for s in rows], (ids(), errors)
   assert ids() != expected
   selection = page.evaluate('currentSensorIndex')
   print('Reproducido: main muestra AE-03 antes de AE-02 y PurpleAir sin AE antes de AirGradient')
  else:
   for width in [390,1440]:
    page.set_viewport_size({'width':width,'height':844})
    for lang in ['es','en']:
     page.evaluate('(lang)=>setLang(lang)',lang)
     assert ids() == expected
     assert page.evaluate('latestSensors.map(s=>s.sensor_index)') == [s['sensor_index'] for s in rows]
     assert page.evaluate('currentSensorIndex') == selection
     assert page.locator('#sel-sensor-hist option').evaluate_all('(o)=>o.map(x=>Number(x.value))') == [s['sensor_index'] for s in rows]
   # Ejecuta cargarMapa real con adaptador Leaflet offline mínimo.
   page.evaluate('''async () => {
    const layer = {addTo(){return this},bindPopup(){return this},on(){return this},getElement(){return null}};
    window.L={tileLayer:()=>layer,circleMarker:()=>layer,marker:()=>layer,divIcon:()=>({})};
    mapaInst={eachLayer(){},invalidateSize(){}};

 L.control=()=>({getContainer(){return this.panel},addTo(map){this.panel=this.onAdd(map);map.getContainer().appendChild(this.panel);return this}});
 L.DomUtil={create(tag,cls){const el=document.createElement(tag);el.className=cls;return el}};
 L.DomEvent={disableClickPropagation(){},disableScrollPropagation(){}};
 mapaInst.getContainer=()=>document.getElementById("mapa-container");
 mapaInst.on=()=>mapaInst;
    await cargarMapa();
   }''')
   assert page.locator('#mapa-cards > .card').evaluate_all('(c)=>c.map(x=>Number(x.dataset.sensorIndex))') == expected
   print('PASS: HTML real, grilla/mapa, 390/1440, ES/EN, selección/selector e input preservados; lecturas antiguas/PM ausente')
  c.close()
 b.close()
