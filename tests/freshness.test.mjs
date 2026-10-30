// AQ-09: funciones reales; reloj fijo, sin HTTP.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8');
const now=Date.parse('2026-10-30T15:00:00Z');
class Clock extends Date { static now(){return now;} }
const ctx=vm.createContext({Date:Clock,t:k=>k,aqiInfo:()=>({label:"good",color:"var(--good)"})});
const fn=name=>{const a=html.indexOf('  function '+name+'(');return html.slice(a,html.indexOf('\n  }',a)+4);};
vm.runInContext('const STALE_MINUTES=25;'+['toBsAs','minutosSinDato','isStale','formatBsAsFull','mapaMarkerState'].map(fn).join('\n'),ctx);
vm.runInContext('const MAPA_PARAMS={aqi:{get:()=>1},pm2_5:{get:()=>1},co2:{get:()=>1},nox:{get:()=>1},voc:{get:()=>1},temperatura:{get:()=>1}};const AQI_CATEGORIES=[{max:50,key:"good"}];',ctx);
test('borde inclusivo 25 min y 1 ms a cada lado',()=>{
 for(const [age,stale] of [[0,false],[1499999,false],[1500000,false],[1500001,true],[-1,true]]){
  assert.equal(ctx.isStale(new Date(now-age).toISOString()),stale,String(age));
 }
});
test('D1 UTC y offsets ISO equivalentes; formatos/calendario inválidos fallan seguros',()=>{
 for(const ts of ['2026-10-30 14:35:00','2026-10-30T14:35:00Z','2026-10-30T11:35:00-03:00','2026-10-30 11:35:00-03:00']) assert.equal(ctx.isStale(ts),false,ts);
 for(const ts of [null,undefined,'','invalid',123,'2026-02-30 14:59:00','2026-10-30 24:00:00','2026-10-30T14:59:00+99:00']){
  assert.equal(ctx.isStale(ts),true,String(ts));assert.equal(ctx.formatBsAsFull(ts),'timestamp_unknown');
 }
 assert.equal(ctx.isStale('2099-01-01 00:00:00'),true);
});
test('todas las capas neutralizan timestamp antiguo, inválido y futuro',()=>{
 for(const param of ['aqi','pm2_5','co2','nox','voc','temperatura']){
  for(const timestamp of ['2000-01-01 00:00:00',null,'invalid','2099-01-01 00:00:00'])
   assert.equal(ctx.mapaMarkerState({timestamp},param).state,'stale');
 }
});
test('una lectura reciente recupera su estado sin cambiar timestamp almacenado',()=>{
 const s={timestamp:'2000-01-01 00:00:00'};
 assert.equal(ctx.mapaMarkerState(s,'aqi').state,'stale');
 s.timestamp='2026-10-30 14:59:00';
 assert.equal(ctx.mapaMarkerState(s,'aqi').state,'recent');
 assert.equal(s.timestamp,'2026-10-30 14:59:00');
});
