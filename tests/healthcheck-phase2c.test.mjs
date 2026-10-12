import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pagesUrl, runHealthcheck } from '../scripts/healthcheck-lib.mjs';
const config=JSON.parse(await readFile(new URL('../healthcheck.config.json',import.meta.url)));

test('ruta estática exacta permitida; vecinos, queries, fragmentos y aliases rechazados',()=>{
  assert.equal(pagesUrl('https://app.lemeit.ar/aq/api').pathname,'/aq/api');
  for(const suffix of ['api/','api/sensores','api?','api?token=PRIVATE','api#','api#PRIVATE','%61pi','api.json']) assert.throws(()=>pagesUrl('https://app.lemeit.ar/aq/'+suffix));
  assert.throws(()=>pagesUrl('https://app.lemeit.ar:443/aq/api'));
});

test('cada salto requiere confirmación individual; no basta permitir la ruta en motor',async()=>{
  const calls=[];
  const report=await runHealthcheck({...config,dns:[],endpoints:[config.endpoints[1]],staticGatewayRoutesConfirmed:config.staticGatewayRoutesConfirmed.filter(u=>!u.endsWith('/aq/api')),network:{...config.network,retries:0}}, {nodeVersion:'22.23.3',transport:async u=>{calls.push(u.pathname);return {status:308,headers:{location:'/aq/api'},durationMs:1};}});
  assert.deepEqual(calls,['/aq/api.html']);
  assert.equal(report.checks.find(c=>c.id==='api-docs').message,'UNCONFIRMED_ROUTE');
});

test('configuración ampliada no permite vecinos, Pages directo, externos o downgrade',async()=>{
  for(const location of ['/aq/api/','/aq/api/sensores','/aq/api?token=PRIVATE','https://evil.example/PRIVATE','https://purpleair-saladillo.pages.dev/api','http://app.lemeit.ar/aq/api']){
    let calls=0;
    const report=await runHealthcheck({...config,dns:[],endpoints:[config.endpoints[1]],staticGatewayRoutesConfirmed:[...config.staticGatewayRoutesConfirmed,new URL(location,'https://app.lemeit.ar').href],network:{...config.network,retries:0}},{nodeVersion:'22.23.3',transport:async()=>{calls++;return {status:308,headers:{location},durationMs:1};}});
    assert.equal(calls,1);assert.equal(report.checks.find(c=>c.id==='api-docs').status,'FAIL');
    assert.ok(!JSON.stringify(report).includes('PRIVATE'));assert.ok(!JSON.stringify(report).includes('evil.example'));
  }
});

test('offline no invoca DNS ni transporte y conserva 16 SKIP',async()=>{
  const forbidden=()=>{throw Error('No debe ejecutarse');};
  const report=await runHealthcheck(config,{offline:true,nodeVersion:'22.23.3',transport:forbidden,resolveDns:forbidden});
  assert.deepEqual(report.counts,{PASS:1,WARN:0,FAIL:0,SKIP:16});
});
