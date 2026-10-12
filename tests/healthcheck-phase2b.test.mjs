import test from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { readFile } from 'node:fs/promises';
import { request, runHealthcheck } from '../scripts/healthcheck-lib.mjs';
const config = JSON.parse(await readFile(new URL('../healthcheck.config.json', import.meta.url)));

test('308 real hacia /aq/api permanece bloqueado y el JSON identifica solo el destino conocido', async () => {
  const calls = [];
  const report = await runHealthcheck({...config, dns:[], endpoints:[config.endpoints[1]], network:{...config.network,retries:0}}, {
    nodeVersion:'22.23.3', transport:async url => {
      calls.push(url.pathname);
      return {status:308, headers:{location:'/aq/api'}, durationMs:1};
    }
  });
  assert.deepEqual(calls,['/aq/api.html']);
  assert.deepEqual(report.checks.find(c=>c.id==='api-docs'), {id:'api-docs',status:'FAIL',message:'DESTINATION',blockedDestination:'/aq/api',redirectStatus:308});
  assert.equal(report.counts.SKIP,12);
});

test('configuración no habilita /aq/api ni externos y no expone su Location', async () => {
  for (const location of ['/aq/api?token=PRIVATE','https://evil.example/PRIVATE','//api.lemeit.ar/aq/api/sensores']) {
    let calls=0;
    const report=await runHealthcheck({...config,dns:[],endpoints:[config.endpoints[1]], staticGatewayRoutesConfirmed:[...config.staticGatewayRoutesConfirmed,'https://app.lemeit.ar/aq/api'],network:{...config.network,retries:0}}, {
      nodeVersion:'22.23.3',transport:async()=>{calls++;return {status:308,headers:{location},durationMs:1};}
    });
    assert.equal(calls,1);
    assert.equal(report.checks.find(c=>c.id==='api-docs').status,'FAIL');
    assert.ok(!JSON.stringify(report).includes('PRIVATE'));
    assert.ok(!JSON.stringify(report).includes('evil.example'));
    assert.ok(!JSON.stringify(report).includes('blockedDestination'));
  }
});

test('transporte crea un agente sin caché TLS por salto, valida certificado y libera agente', async () => {
  const original=https.get;
  const agents=[];
  let released=0;
  https.get=(_url,opts,callback)=>{
    assert.equal(opts.rejectUnauthorized,true);
    assert.equal(opts.agent.options.maxCachedSessions,0);
    assert.equal(opts.agent.options.keepAlive,false);
    agents.push(opts.agent);
    const destroy=opts.agent.destroy.bind(opts.agent);
    opts.agent.destroy=()=>{released++;destroy();};
    const req=new EventEmitter();
    queueMicrotask(()=>callback({statusCode:200,headers:{},socket:{getPeerCertificate:()=>({valid_to:'Dec 23 16:15:20 2026 GMT'})},destroy:()=>req.emit('close')}));
    return req;
  };
  try {
    for(let i=0;i<2;i++) assert.equal((await request(new URL(config.endpoints[0].url),1000)).certificateExpires,'Dec 23 16:15:20 2026 GMT');
    assert.notEqual(agents[0],agents[1]);assert.equal(released,2);
  } finally {https.get=original;}
});

test('ausencia real de HSTS y CSP conserva WARN y expiración ausente conserva WARN', async () => {
  const report=await runHealthcheck({...config,dns:[],endpoints:[config.endpoints[0]]},{nodeVersion:'22.23.3',transport:async()=>({status:200,headers:{'content-type':'text/html','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin'},durationMs:1,certificateExpires:null})});
  assert.equal(report.checks.find(c=>c.id==='pages:headers').message,'Cabeceras ausentes o distintas: strict-transport-security, content-security-policy');
  assert.equal(report.checks.find(c=>c.id==='pages:expiry').status,'WARN');
});
