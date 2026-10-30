// AQ-01/AQ-09: pruebas de aceptación de la corrección. Los demás PASS reproducen
// defectos pendientes o controles; no certifican su corrección. Fixtures sintéticos.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';

globalThis.fetch=async()=>{throw Error('HTTP real prohibido en auditoría offline');};

const source = fs.readFileSync('worker/src/index.js', 'utf8');
const mod = await import('data:text/javascript;base64,' + Buffer.from(source +
  '\nexport {ingest, ingestAirGradient, getOrAssignSensorIndex, upsertAirGradientSensor, insertAirGradientLectura};').toString('base64'));
const html = fs.readFileSync('index.html', 'utf8');
function uiFunction(name) {
  let start = html.indexOf('  function ' + name + '(');
  if (start < 0) start = html.indexOf('  async function ' + name + '(');
  assert.ok(start >= 0, name);
  // Las funciones seleccionadas terminan en una llave a dos espacios.
  const end = html.indexOf('\n  }', start) + 4;
  return html.slice(start, end);
}
const ui = vm.createContext({});
vm.runInContext(html.slice(html.indexOf('  const PM25_AQI_BREAKPOINTS ='), html.indexOf('  const AQI_CATEGORIES =')), ui);
vm.runInContext(['pm25ToAqi','toBsAs','minutosSinDato','isStale'].map(uiFunction).join('\n') + '\nconst STALE_MINUTES=25;', ui);
const aqi = ui.pm25ToAqi;
function db() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys=ON');
  sqlite.exec(fs.readFileSync('d1/schema.sql','utf8'));
  const env = {INGEST_KEY:'fixture-only', SENSOR_INDEXES:'101', PURPLEAIR_API_KEY:'fixture-only', DB:{prepare(sql){
    let args=[];
    return {bind(...v){args=v;return this;},async first(){return sqlite.prepare(sql).get(...args)??null;},
      async all(){return {results:sqlite.prepare(sql).all(...args)};},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:r.changes}};}};
  }}};
  return {sqlite,env};
}
const fields=['sensor_index','name','latitude','longitude','last_seen','pm2.5','temperature','humidity','pm2.5_a','pm2.5_b','pm2.5_10minute','pm2.5_60minute'];
const pa = (over={}) => {const v={sensor_index:101,name:'Fixture PA',latitude:-35,longitude:-59,last_seen:1791842400,'pm2.5':12.05,temperature:68,humidity:50,'pm2.5_a':10,'pm2.5_b':14,'pm2.5_10minute':11,'pm2.5_60minute':9,...over};return {fields,data:[fields.map(f=>v[f])]};};
const ag = (over={}) => ({locationId:7,serialno:'fixture-AG-A',locationName:'Fixture AG',timestamp:'2026-10-12T22:00:00.000Z',pm02:8,pm02_corrected:5,pm02Compensated:4,atmp:25,atmpCompensated:23,rhum:60,rhumCompensated:55,rco2:500,tvocIndex:10,noxIndex:2,wifi:-50,...over});
async function fixtureFetch(fn, body) {
  const old=globalThis.fetch;
  globalThis.fetch=async(...args)=> typeof body==='function'?body(...args):new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}});
  try{return await fn();}finally{globalThis.fetch=old;}
}
async function api(env,path) {return mod.default.fetch(new Request('https://fixture.invalid'+path),env);}

test('CONTROL: PurpleAir sintético → SQLite → API → AQI conserva PM/canales y convierte °F',async()=>{
  const {sqlite,env}=db();
  const result=await fixtureFetch(()=>mod.ingest(env),pa());
  assert.equal(result.guardados,1);
  const rows=await (await api(env,'/api/ultimas')).json();
  assert.equal(rows[0].pm2_5,12.05); assert.equal(rows[0].temperatura,20);
  assert.equal(rows[0].pm2_5_a,10);assert.equal(rows[0].pm2_5_b,14);
  assert.equal(rows[0].pm2_5_10min,11);assert.equal(rows[0].pm2_5_60min,9);
  assert.equal(rows[0].timestamp,'2026-10-12 22:00:00');assert.equal(aqi(rows[0].pm2_5),56);
  const csv=await (await api(env,'/api/ultimas?formato=csv')).text();assert.match(csv,/12.05/);
  sqlite.close();
});
test('ACEPTACIÓN AQ-01: décimas, interpolación e inválidos',()=>{
  for(const [pm,expected] of [[12.05,56],[35.45,100],[55.45,150],[150.45,226]]) assert.equal(aqi(pm),expected);
  for(const value of [-1,NaN,Infinity,-Infinity,null,undefined,'12.05',true]) assert.equal(aqi(value),null);
});
test('ACEPTACIÓN AQ-01: extremos EPA vigentes hasta 500',()=>{
  for(const [pm,expected] of [[0,0],[9,50],[9.1,51],[35.4,100],[35.5,101],[55.4,150],[55.5,151],[125.4,200],[125.5,201],[225.4,300],[225.5,301],[325.4,500]]) assert.equal(aqi(pm),expected);
});
test('AQ-10: dedupe conserva primera lectura pero guardados vuelve a ser 1',async()=>{
  const {sqlite,env}=db();await fixtureFetch(()=>mod.ingest(env),pa());
  const r=await fixtureFetch(()=>mod.ingest(env),pa({'pm2.5':99}));
  assert.equal(r.guardados,1);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM lecturas').get().n,1);
  assert.equal(sqlite.prepare('SELECT pm2_5 FROM lecturas').get().pm2_5,12.05);sqlite.close();
});
test('VALIDACIÓN: PurpleAir sin timestamp se ignora y se informa guardado',async()=>{
  const {sqlite,env}=db();const r=await fixtureFetch(()=>mod.ingest(env),pa({last_seen:null}));
  assert.equal(r.ok,true);assert.equal(r.guardados,1);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM lecturas').get().n,0);sqlite.close();
});
test('VALIDACIÓN: PM negativa, texto y humedad fuera de rango entran en D1',async()=>{
  for(const value of [-3,'no-numérico']){
    const {sqlite,env}=db();await fixtureFetch(()=>mod.ingest(env),pa({'pm2.5':value,humidity:150}));
    const r=sqlite.prepare('SELECT pm2_5,humedad FROM lecturas').get();assert.equal(r.pm2_5,value);assert.equal(r.humedad,150);sqlite.close();
  }
});
test('VALIDACIÓN: el Worker no vuelve a aplicar SENSOR_INDEXES al payload',async()=>{
  const {sqlite,env}=db();await fixtureFetch(()=>mod.ingest(env),pa({sensor_index:999}));
  assert.equal(sqlite.prepare('SELECT sensor_index FROM sensores').get().sensor_index,999);sqlite.close();
});
test('CONTROL: orden de fields y campos opcionales faltantes',async()=>{
  const {sqlite,env}=db();const f=pa();f.fields.reverse();f.data[0].reverse();
  await fixtureFetch(()=>mod.ingest(env),f);
  const r=sqlite.prepare('SELECT pm2_5,pm1_0 FROM lecturas').get();assert.equal(r.pm2_5,12.05);assert.equal(r.pm1_0,null);sqlite.close();
});
test('ACEPTACIÓN AQ-02: concurrencia separa seriales y conserva historial',async()=>{
  const {sqlite,env}=db();
  const [a,b,c]=await Promise.all(['fixture-A','fixture-B','fixture-A'].map(s=>mod.getOrAssignSensorIndex(env,s)));
  assert.notEqual(a,b);assert.equal(a,c);
  await mod.insertAirGradientLectura(env,a,ag());
  await mod.insertAirGradientLectura(env,b,ag({pm02:99}));
  assert.equal(sqlite.prepare('SELECT pm2_5 FROM lecturas WHERE sensor_index=?').get(a).pm2_5,8);
  assert.equal(sqlite.prepare('SELECT pm2_5 FROM lecturas WHERE sensor_index=?').get(b).pm2_5,99);
  sqlite.close();
});
test('ACEPTACIÓN AQ-02: base rechaza duplicar serial y cambiar identidad',()=>{
  const {sqlite}=db();sqlite.exec("INSERT INTO sensores(sensor_index,nombre,proveedor,serial_externo) VALUES(1,'a','airgradient','fixture')");
  assert.throws(()=>sqlite.exec("INSERT INTO sensores(sensor_index,nombre,proveedor,serial_externo) VALUES(2,'b','airgradient','fixture')"));
  assert.throws(()=>sqlite.exec("UPDATE sensores SET serial_externo='otro' WHERE sensor_index=1"));
  sqlite.close();
});
test('ACEPTACIÓN AQ-02: cuentas sin serial no escriben identidades ni lecturas',async()=>{
  const {sqlite,env}=db();env.AIRGRADIENT_TOKEN_OPENAQ='fixture-A';env.AIRGRADIENT_TOKEN_SALADILLO='fixture-B';
  const r=await fixtureFetch(()=>mod.ingestAirGradient(env),[ag({serialno:null})]);
  assert.equal(r.ok,false);assert.equal(r.guardados,0);assert.equal(r.errores.length,2);
  assert.match(r.errores[0],/OpenAQ Ambassadors/);assert.match(r.errores[1],/Saladillo/);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM sensores').get().n,0);sqlite.close();
});
test('AQ-12: filtro ausente permite todo; filtro presente descarta ubicación',async()=>{
  const {sqlite,env}=db();env.AIRGRADIENT_TOKEN_OPENAQ='fixture';
  await fixtureFetch(()=>mod.ingestAirGradient(env),[ag()]);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM lecturas').get().n,1);
  env.AIRGRADIENT_LOCATION_IDS='99';const r=await fixtureFetch(()=>mod.ingestAirGradient(env),[ag()]);assert.equal(r.ok,false);sqlite.close();
});
test('NORMALIZACIÓN: AirGradient elige pm02 y temperatura/humedad Compensated',async()=>{
  const {sqlite,env}=db();env.AIRGRADIENT_TOKEN_OPENAQ='fixture';
  await fixtureFetch(()=>mod.ingestAirGradient(env),[ag()]);const r=sqlite.prepare('SELECT * FROM lecturas').get();
  assert.equal(r.pm2_5,8);assert.equal(r.temperatura,23);assert.equal(r.humedad,55);assert.equal(r.co2,500);assert.equal(r.nox,2);
  assert.equal(r.pm2_5_a,null);assert.equal(r.pm2_5_60min,null);sqlite.close();
});
test('AQ-10: AirGradient sin timestamp cuenta guardado sin lectura',async()=>{
  const {sqlite,env}=db();env.AIRGRADIENT_TOKEN_OPENAQ='fixture';
  const r=await fixtureFetch(()=>mod.ingestAirGradient(env),[ag({timestamp:null})]);assert.equal(r.ok,true);assert.equal(r.guardados,1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM lecturas').get().n,0);sqlite.close();
});
test('AQ-11: token fallido queda oculto en ok:true de AirGradient',async()=>{
  const {sqlite,env}=db();env.AIRGRADIENT_TOKEN_OPENAQ='fixture-A';env.AIRGRADIENT_TOKEN_SALADILLO='fixture-B';
  const old=console.error;console.error=()=>{};
  try {const r=await fixtureFetch(()=>mod.ingestAirGradient(env),url=>new Response(String(url).includes('fixture-A')?'[]':JSON.stringify([ag()]),{status:String(url).includes('fixture-A')?500:200}));assert.equal(r.ok,true);assert.deepEqual(r.errores,[]);}finally{console.error=old;sqlite.close();}
});
test('TIMESTAMP: backend aún duplica offsets equivalentes; UI los interpreta en UTC',async()=>{
  const {sqlite,env}=db();await mod.upsertAirGradientSensor(env,900001,'fixture',ag());
  for(const timestamp of ['2026-10-12T22:00:00Z','2026-10-12T19:00:00-03:00'])await mod.insertAirGradientLectura(env,900001,ag({timestamp}));
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM lecturas').get().n,2);
  assert.equal(ui.toBsAs('2026-10-12 19:00:00-03:00').toISOString(),'2026-10-12T22:00:00.000Z');
  assert.equal(ui.isStale('2026-10-12 19:00:00-03:00'),true);sqlite.close();
});
test('TIMESTAMP: texto inválido se persiste y gana MAX(timestamp)',async()=>{
  const {sqlite,env}=db();await mod.upsertAirGradientSensor(env,900001,'fixture',ag());
  for(const timestamp of ['2026-10-12T22:00:00Z','zz-invalid'])await mod.insertAirGradientLectura(env,900001,ag({timestamp}));
  assert.equal(sqlite.prepare('SELECT timestamp FROM v_ultima_lectura').get().timestamp,'zz-invalid');sqlite.close();
});
test('AQ-04: sensores excluye inactivo pero ultimas lo devuelve',async()=>{
  const {sqlite,env}=db();await fixtureFetch(()=>mod.ingest(env),pa());sqlite.exec('UPDATE sensores SET activo=0');
  assert.equal((await (await api(env,'/api/sensores')).json()).length,0);
  assert.equal((await (await api(env,'/api/ultimas')).json()).length,1);sqlite.close();
});
test('AQ-03: limit=-1 devuelve 3001 filas; texto y fracción se aceptan',async()=>{
  const {sqlite,env}=db();sqlite.exec("INSERT INTO sensores(sensor_index,nombre) VALUES(1,'fixture')");
  const q=sqlite.prepare('INSERT INTO lecturas(sensor_index,timestamp) VALUES(1,?)');
  for(let i=0;i<3001;i++)q.run(new Date(Date.UTC(2026,9,12,0,0,i)).toISOString().slice(0,19).replace('T',' '));
  const rows=await (await api(env,'/api/historico/1?desde=2026-10-12&limit=-1')).json();assert.equal(rows.length,3001);
  for(const limit of ['abc','0','1.5','2texto'])assert.equal((await api(env,'/api/historico/1?desde=2026-10-12&limit='+limit)).status,200);sqlite.close();
});
test('AQ-07: hasta fecha excluye incluso medianoche del último día',async()=>{
  const {sqlite,env}=db();sqlite.exec("INSERT INTO sensores(sensor_index,nombre) VALUES(1,'fixture');INSERT INTO lecturas(sensor_index,timestamp) VALUES(1,'2026-10-12 00:00:00'),(1,'2026-10-12 12:00:00')");
  assert.equal((await (await api(env,'/api/historico/1?desde=2026-10-12&hasta=2026-10-12')).json()).length,0);sqlite.close();
});
test('AQ-05: endpoint documentado llama solo a PurpleAir; scheduled a ambos',async()=>{
  const {sqlite,env}=db();env.AIRGRADIENT_TOKEN_OPENAQ='fixture';const hosts=[];
  const fake=url=>{hosts.push(new URL(url).hostname);return new Response(JSON.stringify(String(url).includes('purpleair')?pa():[ag()]));};
  await fixtureFetch(()=>mod.default.fetch(new Request('https://fixture.invalid/api/ingest-ahora',{method:'POST',headers:{'X-Ingest-Key':'fixture-only'}}),env),fake);
  assert.deepEqual(hosts,['api.purpleair.com']);hosts.length=0;const pending=[];
  await fixtureFetch(async()=>{await mod.default.scheduled({},env,{waitUntil(p){pending.push(p);}});await Promise.all(pending);},fake);
  assert.deepEqual(hosts.sort(),['api.airgradient.com','api.purpleair.com']);sqlite.close();
});
test('AQ-11: scheduled no registra resultados ok:false',async()=>{
  const {sqlite,env}=db();env.AIRGRADIENT_TOKEN_OPENAQ='fixture';const pending=[],errors=[];const old=console.error;console.error=(...v)=>errors.push(v);
  try{await fixtureFetch(async()=>{await mod.default.scheduled({},env,{waitUntil(p){pending.push(p);}});await Promise.all(pending);},url=>new Response(JSON.stringify(String(url).includes('purpleair')?{fields,data:[]}:[])));assert.equal(errors.length,0);}finally{console.error=old;sqlite.close();}
});
test('AQ-09: mapa neutraliza lecturas antiguas',()=>{
  const ctx=vm.createContext({pm25ToAqi:aqi,isStale:ui.isStale,t:k=>k});
  vm.runInContext('const MAPA_PARAMS={aqi:{get:s=>pm25ToAqi(s.pm2_5)}};const AQI_CATEGORIES=[{max:50,key:"good"}];const MAPA_AQI_SHAPES=["circle"];'+uiFunction('mapaMarkerState'),ctx);
  assert.equal(ctx.mapaMarkerState({pm2_5:4,timestamp:'2000-01-01 00:00:00'},'aqi').state,'stale');
  assert.equal(ctx.mapaMarkerState({pm2_5:4,timestamp:new Date().toISOString()},'aqi').state,'recent');
});
test('AQ-09: fallo de red reevalúa frescura local',async()=>{
  const elements=new Map();function el(id){if(!elements.has(id))elements.set(id,{style:{},classList:{contains:()=>false,add(){},remove(){}}});return elements.get(id);}
  let renders=0;const ctx=vm.createContext({refreshSensorFreshness:()=>renders++,document:{getElementById:el},API_BASE:'https://fixture.invalid',fetch:async()=>{throw Error('fixture offline');},t:x=>x,renderGrid:()=>renders++,console:{error(){},warn(){},log(){}}});
  vm.runInContext(uiFunction('loadSensors'),ctx);
  await ctx.loadSensors();assert.equal(renders,1);
});
test('AQ-08: Python preserva valores pero sobrescribe nombre manual (HTTP bloqueado)',()=>{
  const p=spawnSync('python',['-B','tests/data-integrity-python.audit.py'],{encoding:'utf8'});assert.equal(p.status,0,p.stdout+p.stderr);assert.match(p.stdout,/PASS/);
});
test('AQ-08: Worker conserva nombre manual frente a nueva ingesta',async()=>{
  const {sqlite,env}=db();await fixtureFetch(()=>mod.ingest(env),pa());sqlite.exec("UPDATE sensores SET nombre='Nombre manual'");
  await fixtureFetch(()=>mod.ingest(env),pa({name:'Nombre nuevo API fixture'}));assert.equal(sqlite.prepare('SELECT nombre FROM sensores').get().nombre,'Nombre manual');sqlite.close();
});
test('FRESCURA: timestamp futuro se considera sin datos recientes',()=>{
  assert.equal(ui.isStale('2999-01-01 00:00:00'),true);
});
test('API/UI: error HTTP de historial se muestra como sin datos',async()=>{
  const elements=new Map();function el(id){if(!elements.has(id))elements.set(id,{innerHTML:'',value:'24h'});return elements.get(id);}
  const ctx=vm.createContext({currentSensorIndex:101,API_BASE:'https://fixture.invalid',histQueryParams:()=> 'range=24h',document:{getElementById:el},t:x=>x,fetch:async()=>new Response(JSON.stringify({error:'fixture D1 error'}),{status:500})});
  vm.runInContext(uiFunction('loadHistorialTable'),ctx);await ctx.loadHistorialTable();assert.match(el('tabla-wrap').innerHTML,/loader_sin_datos/);
});

// Aceptación adicional AQ-02; no cambia las reproducciones de otros hallazgos.
test('AQ-02: IDs existentes, metadata manual e historial permanecen',async()=>{
 const {sqlite,env}=db();
 sqlite.exec("INSERT INTO sensores(sensor_index,nombre,institucion,activo,proveedor,serial_externo) VALUES(900050,'Manual','Escuela fixture',0,'airgradient','fixture-A'); INSERT INTO lecturas(sensor_index,timestamp,pm2_5) VALUES(900050,'2026-10-01 00:00:00',3)");
 const id=await mod.getOrAssignSensorIndex(env,'fixture-A',ag());assert.equal(id,900050);
 await mod.upsertAirGradientSensor(env,id,'fixture-A',ag());
 const row=sqlite.prepare('SELECT * FROM sensores').get();assert.equal(row.nombre,'Manual');assert.equal(row.institucion,'Escuela fixture');assert.equal(row.activo,0);
 assert.equal(sqlite.prepare('SELECT pm2_5 FROM lecturas').get().pm2_5,3);sqlite.close();
});
test('AQ-02: mismo serial en ambas cuentas mantiene una identidad',async()=>{
 const {sqlite,env}=db();env.AIRGRADIENT_TOKEN_OPENAQ='fixture-A';env.AIRGRADIENT_TOKEN_SALADILLO='fixture-B';
 await fixtureFetch(()=>mod.ingestAirGradient(env),[ag()]);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM sensores').get().n,1);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM lecturas').get().n,1);sqlite.close();
});
test('AQ-02: location igual con seriales distintos separa cuentas',async()=>{
 const {sqlite,env}=db();env.AIRGRADIENT_TOKEN_OPENAQ='fixture-A';env.AIRGRADIENT_TOKEN_SALADILLO='fixture-B';
 await fixtureFetch(()=>mod.ingestAirGradient(env),url=>new Response(JSON.stringify([ag({serialno:String(url).includes('fixture-A')?'fixture-A':'fixture-B'})])));
 assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM sensores').get().n,2);sqlite.close();
});
test('AQ-02: reserva evita IDs PurpleAir y ambos upserts rechazan colisión',async()=>{
 const {sqlite,env}=db();sqlite.exec("INSERT INTO sensores(sensor_index,nombre) VALUES(900100,'PA')");
 const id=await mod.getOrAssignSensorIndex(env,'fixture-A');assert.equal(id,900101);
 await assert.rejects(()=>mod.upsertAirGradientSensor(env,900100,'fixture-B',ag()));
 const r=await fixtureFetch(()=>mod.ingest(env),pa({sensor_index:id}));assert.equal(r.ok,false);assert.equal(r.guardados,0);
 assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM lecturas').get().n,0);sqlite.close();
});
test('AQ-02: sin índice obligatorio no reserva ni escribe',async()=>{
 const {sqlite,env}=db();sqlite.exec('DROP INDEX idx_sensores_airgradient_serial');
 await assert.rejects(()=>mod.getOrAssignSensorIndex(env,'fixture-A'));
 assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM sensores').get().n,0);sqlite.close();
});
test('AQ-02: migración conserva filas y se detiene ante duplicados',()=>{
 const migration=fs.readFileSync('d1/migration_009_airgradient_identity.sql','utf8');
 for(const duplicate of [false,true]){
  const sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync('d1/schema.sql','utf8').split('-- AQ-02: aplicar')[0]);
  sqlite.exec("INSERT INTO sensores(sensor_index,nombre,proveedor,serial_externo) VALUES(900010,'Manual','airgradient','fixture-A'); INSERT INTO lecturas(sensor_index,timestamp,pm2_5) VALUES(900010,'2026-10-01 00:00:00',3)");
  if(duplicate)sqlite.exec("INSERT INTO sensores(sensor_index,nombre,proveedor,serial_externo) VALUES(900020,'Otro','airgradient','fixture-A')");
  const before=sqlite.prepare('SELECT * FROM sensores ORDER BY sensor_index').all();
  if(duplicate)assert.throws(()=>sqlite.exec(migration));else sqlite.exec(migration);
  assert.deepEqual(sqlite.prepare('SELECT * FROM sensores ORDER BY sensor_index').all(),before);
  assert.equal(sqlite.prepare('SELECT pm2_5 FROM lecturas').get().pm2_5,3);sqlite.close();
 }
});
test('AQ-02: serial ausente, vacío o con espacios se rechaza',async()=>{
 const {sqlite,env}=db();for(const serial of [undefined,null,'','  ',7,' fixture-A '])await assert.rejects(()=>mod.getOrAssignSensorIndex(env,serial));
 assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM sensores').get().n,0);sqlite.close();
});
