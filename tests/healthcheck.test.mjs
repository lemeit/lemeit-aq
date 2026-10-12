import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { pagesUrl, probe, request, runHealthcheck } from '../scripts/healthcheck-lib.mjs';
import { utcTimestamp, validateArray, validateFreshness } from '../scripts/healthcheck-validators.mjs';
const config = JSON.parse(await readFile(new URL('../healthcheck.config.json', import.meta.url)));
const options = { ...config.network, timeoutMs: 10 };
const response = (status = 200, headers = {}) => ({ status, headers: { 'content-type': 'text/html', ...headers }, durationMs: 5, certificateExpires: 'Jan 01 2030 00:00:00 GMT' });
const sensor = (sensor_index = 1, proveedor = 'purpleair', activo = 1) => ({ sensor_index, proveedor, activo, nombre: 'SIMULADO' });
const reading = (sensor_index = 1, timestamp = '2026-10-11 12:00:00', proveedor = 'purpleair') => ({ sensor_index, timestamp, proveedor, id: sensor_index, pm2_5: null });
const now = Date.parse('2026-10-11T12:25:00Z');
test('lista cerrada bloquea API, proveedores, consultas, puertos y downgrade', () => {
  for (const url of ['https://api.lemeit.ar/aq/api/sensores','https://api.purpleair.com/','http://app.lemeit.ar/aq','https://app.lemeit.ar/aq?token=x','https://u:p@app.lemeit.ar/aq','https://app.lemeit.ar:444/aq','https://app.lemeit.ar/aq#x','https://app.lemeit.ar/otro']) assert.throws(() => pagesUrl(url));
});
test('redirección relativa segura y latencia acumulada', async () => {
  const r = await probe(config.endpoints[0], options, async url => url.pathname === '/aq' ? response(302, {location:'/aq/'}) : response());
  assert.equal(r.durationMs,10); assert.equal(r.redirects.length,1);
});
for (const location of ['/aq','https://api.lemeit.ar/aq/api/sensores','http://app.lemeit.ar/aq','/aq?token=PRIVATE','/otro']) test(`redirección prohibida ${location}`, async () => {
  await assert.rejects(probe(config.endpoints[0], options, async () => response(302,{location})));
});
test('límite de redirecciones', async () => assert.rejects(probe(config.endpoints[0], {...options,maxRedirects:0}, async () => response(302,{location:'/aq/'}))));
test('reintentos acotados 503 y timeout', async () => {
  let calls=0; const r=await probe(config.endpoints[0], options, async () => response(++calls===1?503:200));
  assert.equal(r.attempts,2); calls=0;
  await assert.rejects(probe(config.endpoints[0], options, async () => { calls++; throw new Error('TIMEOUT'); })); assert.equal(calls,2);
});
test('timeout antes de conexión y TLS validado', async () => {
  const original=https.get;
  https.get=(_url,opts) => { assert.equal(opts.rejectUnauthorized,true); const req=new EventEmitter(); req.destroy=e=>{req.emit('error',e);req.emit('close');}; return req; };
  try { await assert.rejects(request(new URL(config.endpoints[0].url),10),/TIMEOUT/); } finally { https.get=original; }
});
test('SKIP no provoca HTTP y offline tampoco DNS', async () => {
  const report=await runHealthcheck(config,{offline:true,transport:()=>{throw Error('No debe llamarse');},resolveDns:()=>{throw Error('No debe llamarse');},nodeVersion:'22.0.0'});
  assert.equal(report.counts.FAIL,0); assert.equal(report.checks.find(x=>x.id==='json').status,'SKIP');
});
test('reporte no expone mensajes ni cabeceras ni destinos externos', async () => {
  const report=await runHealthcheck({...config,pagesRoutingConfirmed:true,dns:[]},{nodeVersion:'22.0.0',transport:async()=>{throw Error('PRIVATE token');}});
  assert.equal(report.status,'FAIL'); assert.ok(!JSON.stringify(report).includes('PRIVATE'));
});
for (const [expires,status] of [[null,'WARN'],['Jan 01 2000 00:00:00 GMT','FAIL'],['Jan 01 2030 00:00:00 GMT','PASS']]) test(`expiración ${status}`,async()=>{
  const r=await runHealthcheck({...config,pagesRoutingConfirmed:true,dns:[]},{transport:async()=>({...response(200,{'set-cookie':'PRIVATE'}),certificateExpires:expires}),nodeVersion:'22.0.0'});
  assert.equal(r.checks.find(x=>x.id==='pages:expiry').status,status); assert.ok(!JSON.stringify(r).includes('PRIVATE'));
});
test('HTTP/tipo incorrectos fallan y cabeceras ausentes advierten',async()=>{
  const r=await runHealthcheck({...config,pagesRoutingConfirmed:true,dns:[]},{transport:async()=>response(404,{'content-type':'application/json'}),nodeVersion:'22.0.0'});
  assert.equal(r.checks.find(x=>x.id==='pages').status,'FAIL'); assert.equal(r.checks.find(x=>x.id==='pages:headers').status,'WARN');
});
for (const value of ['2026-02-30 12:00:00','2026-13-01 00:00:00','2026-10-11 24:00:00','2026-10-11T12:00:00Z','2026-10-11 12:00:00Z','2026-10-11 12:00:00-03:00',null]) test(`timestamp inválido ${value}`,()=>assert.equal(utcTimestamp(value),null));
test('UTC estricto acepta fecha real y año bisiesto',()=>{ assert.equal(utcTimestamp('2024-02-29 00:00:00'),Date.parse('2024-02-29T00:00:00Z')); assert.equal(utcTimestamp('2023-02-29 00:00:00'),null); });
test('arrays, objetos e IDs únicos',()=>{
  for(const x of [{},null,[null],[[sensor()]], [sensor(),sensor()], [sensor('1')], [{...sensor(),activo:true}], [{...sensor(),proveedor:'otro'}]]) assert.equal(validateArray(x).status,'FAIL');
  assert.equal(validateArray([]).status,'WARN'); assert.equal(validateArray([sensor()]).status,'PASS');
});
test('lecturas: duplicados, métricas, timestamp y contrato histórico',()=>{
  for(const x of [[reading(),reading()], [{...reading(),pm2_5:'1'}], [reading(1,'2026-02-30 00:00:00')], [{...reading(),id:null}]]) assert.equal(validateArray(x,'ultimas').status,'FAIL');
  assert.equal(validateArray([reading(),{...reading(1,'2026-10-11 12:01:00'),id:2}],'historico').status,'PASS');
});
test('frescura frontera 25 minutos y vieja',()=>{
  assert.ok(validateFreshness([sensor()],[reading()],{now}).some(x=>x.id==='active:reading'&&x.status==='PASS'));
  assert.ok(validateFreshness([sensor()],[reading()],{now:now+1}).some(x=>x.message==='Lectura vieja'));
});
test('sensor activo sin lectura y proveedor sin cobertura',()=>{
  const r=validateFreshness([sensor(),sensor(2,'airgradient')],[reading()],{now});
  assert.equal(r.find(x=>x.id==='coverage:airgradient').status,'WARN'); assert.ok(r.some(x=>x.message==='Sensor activo sin lectura'));
});
test('inactivo no requiere frescura; última fuera de activos advierte AQ-04',()=>{
  const r=validateFreshness([sensor(1,'purpleair',0)],[reading()],{now});
  assert.ok(!r.some(x=>x.id==='active:reading')); assert.ok(r.some(x=>x.id==='reading:outside-active'));
});
test('lectura futura e inconsistencia de proveedor fallan',()=>{
  const r=validateFreshness([sensor()],[reading(1,'2026-10-12 00:00:00','airgradient')],{now});
  assert.ok(r.filter(x=>x.status==='FAIL').length>=2);
});
test('cobertura por proveedor y reportes de fixtures sanitizados',()=>{
  const r=validateFreshness([{...sensor(),nombre:'PRIVATE'},sensor(2,'airgradient')],[reading(),reading(2,'2026-10-11 12:00:00','airgradient')],{now});
  assert.equal(r.filter(x=>x.id.startsWith('coverage:')&&x.status==='PASS').length,2); assert.ok(!JSON.stringify(r).includes('PRIVATE'));
});
test('CLI inválido sale 1 y offline sale 0',()=>{
  const env = { ...process.env }; delete env.NODE_TEST_CONTEXT;
  assert.equal(spawnSync(process.execPath,['scripts/healthcheck.mjs','--desconocido','x'],{env}).status,1);
  assert.equal(spawnSync(process.execPath,['scripts/healthcheck.mjs','--offline','--output','work/test-report.json'],{env}).status,0);
});
