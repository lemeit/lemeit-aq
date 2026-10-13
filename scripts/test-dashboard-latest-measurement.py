"""Prueba offline del HTML real; requiere Playwright y Chromium locales.
Todas las solicitudes están interceptadas; no inicia servicios ni ingestas.
"""
from pathlib import Path
from datetime import datetime,timedelta,timezone
import json,subprocess
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
now=datetime.now(timezone.utc)
rows=[{'sensor_index':990001+i,'nombre':'Fixture '+str(i),'institucion':'Datos sintéticos','proveedor':'purpleair','pm2_5':8,'timestamp':(now-timedelta(minutes=m)).strftime('%Y-%m-%d %H:%M:%S')} for i,m in enumerate([0,120])]
text_es='Este indicador se calcula a partir de la última medición de PM2.5 del sensor. No representa el promedio del día.'
text_en='This indicator is calculated from the sensor’s latest PM2.5 measurement. It does not represent the daily average.'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],headless=True)
 for baseline in [True,False]:
  html=subprocess.run(['git','show','8d85f9eeac3f2955ebde4f4c5885dab3eb0637dc:index.html'],cwd=root,capture_output=True,text=True,check=True).stdout if baseline else root.joinpath('index.html').read_text()
  html=html.replace('const API_BASE = "https://api.lemeit.ar/aq";', 'const API_BASE = "http://fixture.invalid";')
  c=b.new_context(service_workers='block',viewport={'width':390,'height':844})
  requests=[]
  def route(r):
   url=r.request.url;requests.append(url)
   if url=='http://fixture.invalid/?pwa=1':r.fulfill(status=200,content_type='text/html',body=html)
   elif url=='http://fixture.invalid/api/ultimas':r.fulfill(status=200,content_type='application/json',body=json.dumps(rows))
   else:r.abort()
  c.route('**/*',route)
  page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://fixture.invalid/?pwa=1',wait_until='networkidle')
  page.wait_for_function('latestSensors.length===2')
  if baseline:
   assert page.get_by_text(text_es,exact=True).count()==0
   print('Reproducción main: aclaración ausente')
  else:
   for width in [390,1440]:
    page.set_viewport_size({'width':width,'height':844})
    page.evaluate("setLang('es')")
    assert page.locator('#sensor-grid').get_by_text(text_es,exact=True).count()==2
    assert page.locator('#sensor-grid').get_by_text('Sin datos',exact=True).count()==1
    assert 'Sin datos nuevos hace más de 25 min' in page.locator('#sensor-grid').inner_text()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert page.locator('#sensor-grid p.card-sub').first.is_visible()
    assert page.locator('#sensor-grid p.card-sub').first.get_attribute('aria-hidden') is None
    page.screenshot(path=str(Path('/tmp')/f'aq-ultima-{width}.png'))
    page.evaluate("setLang('en')")
    assert page.locator('#sensor-grid').get_by_text(text_en,exact=True).count()==2
    assert page.locator('#sensor-grid').get_by_text('No data',exact=True).count()==1
   page.evaluate("document.querySelector('#mapa-cards').innerHTML=latestSensors.map(s=>buildSensorCardInner(s,'mapa-')).join('')")
   assert page.locator('#mapa-cards').get_by_text(text_en,exact=True).count()==2
   assert not errors,errors
   print('PASS: ES/EN, fresco/antiguo, prefix mapa, 390/1440px, párrafo accesible, sin errores JS')
  print('Sin transporte real: solo documento y API sintética respondidos mediante interceptación; externos abortados')
  c.close()
 b.close()
