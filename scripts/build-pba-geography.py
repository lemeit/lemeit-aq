"""Derivación offline; requiere Shapely 2.1.2 solo para regenerar, no en navegador.
Uso: PYTHONPATH=work/geo-tools python scripts/build-pba-geography.py archivo_fuente
Origen y licencia: assets/geo/README.md. No descarga datos ni llama API.
"""
import hashlib, json, sys
from pathlib import Path
from shapely.geometry import shape, mapping
source=Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(source).hexdigest()=='af52fe56c5f28ff87fd96f2e8a44502f3ae63f9afa1b647cbda5e723005bf6c2'
features=[]
def rounded(obj):
 if isinstance(obj,(list,tuple)):return [rounded(x) for x in obj]
 if isinstance(obj,float):return round(obj,5)
 return obj
for f in json.loads(source)['features']:
 p=f['properties']
 if p['GNA']!='Partido':continue
 assert p['GNA']=='Partido' and p['SAG']=='ARBA - Gerencia de Servicios Catastrales'
 g=shape(f['geometry']);assert g.is_valid
 # Un punto interior real, no la cabecera ni una coordenada inventada.
 anchor=g.representative_point()
 simple=g.simplify(.0015,preserve_topology=True)
 assert simple.is_valid and simple.covers(anchor)
 assert shape({"type":simple.geom_type,"coordinates":rounded(mapping(simple)["coordinates"])}).is_valid
 features.append({'type':'Feature','properties':{'id':p['IN1'],'name':p['NAM'],
  'label':[round(anchor.y,5),round(anchor.x,5)],'area':round(g.area,6)},
  'geometry':{'type':simple.geom_type,'coordinates':rounded(mapping(simple)['coordinates'])}})
features.sort(key=lambda f:f['properties']['id'])
assert len(features)==len({f['properties']['id'] for f in features})==135
bounds=[min(shape(f['geometry']).bounds[0] for f in features),min(shape(f['geometry']).bounds[1] for f in features),max(shape(f['geometry']).bounds[2] for f in features),max(shape(f['geometry']).bounds[3] for f in features)]
data={'type':'FeatureCollection','bbox':bounds,'features':features}
out=Path(__file__).resolve().parents[1]/'assets/geo/pba-partidos.js'
out.write_text('// ARBA vía IGN; CC BY 4.0. Procedencia y derivación: assets/geo/README.md\nwindow.AQ_PBA = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
print(len(features),'partidos;',out.stat().st_size,'bytes; bbox',bounds)
