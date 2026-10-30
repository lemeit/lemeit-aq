// Funciones reales de UI, reloj fijo, sin transporte.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync('index.html','utf8');
const fn=name=>{const a=html.indexOf('  function '+name+'(');assert.ok(a>=0,name);return html.slice(a,html.indexOf('\n  }',a)+4);};
let now=Date.parse('2026-10-30T15:00:00Z');
class Clock extends Date{static now(){return now;}}
const legend={innerHTML:''};
const ctx=vm.createContext({Date:Clock,t:k=>k,paramLabel:k=>k,document:{getElementById:()=>legend}});
const constants=html.slice(html.indexOf('  const PM25_AQI_BREAKPOINTS'),html.indexOf('  const aqiBandsPlugin'));
const map=html.slice(html.indexOf('  const MAPA_PARAMS'),html.indexOf('  // VOC/NOx'));
vm.runInContext(constants+'const STALE_MINUTES=25;'+['pm25ToAqi','aqiInfo','formatAqi','formatPm25','toBsAs','minutosSinDato','isStale','formatBsAsFull'].map(fn).join('\n')+map+['unitSuffix','formatParamValue','renderMapaLegend'].map(fn).join('\n'),ctx);
const row=(pm2_5=4)=>({nombre:'Fixture',pm2_5,timestamp:'2026-10-30 14:59:00',temperatura:22.3,humedad:48});
test('seis categorías y fronteras: círculo y color idéntico a tarjeta, incluido >500',()=>{
 const cases=[[0,'--good'],[9,'--good'],[9.1,'--moderate'],[35.4,'--moderate'],[35.5,'--unhealthy-sg'],[55.4,'--unhealthy-sg'],[55.5,'--unhealthy'],[125.4,'--unhealthy'],[125.5,'--very-unhealthy'],[225.4,'--very-unhealthy'],[225.5,'--hazardous'],[325.4,'--hazardous'],[400,'--hazardous']];
 for(const [pm,color] of cases){
  const marker=ctx.mapaMarkerState(row(pm),'aqi');
  assert.equal(marker.shape,'circle');assert.equal(marker.color,`var(${color})`,String(pm));
  const card=ctx.aqiInfo(ctx.pm25ToAqi(pm));assert.equal(marker.color,card.color);assert.equal(marker.label,card.label);
 }
 assert.equal(new Set(cases.map(([pm])=>ctx.mapaMarkerState(row(pm),'aqi').color)).size,6);
});
test('PM2.5 y todos los parámetros de medición usan el mismo símbolo sin clasificar',()=>{
 for(const param of ['pm2_5','temperatura','humedad','presion','voc','co2','nox']){
  const s={...row(),presion:1009,voc:30,co2:600,nox:1};
  assert.equal(ctx.mapaMarkerState(s,param).shape,'circle');
 }
 for(const pm of [4,40,400])assert.equal(ctx.mapaMarkerState(row(pm),'pm2_5').color,'var(--text-dim)');
});
test('frescura de #22 tiene precedencia; recuperación y valor ausente distinguibles',()=>{
 const s=row();s.timestamp='2026-10-30 14:35:00';
 assert.equal(ctx.mapaMarkerState(s,'aqi').state,'recent');now+=1;
 assert.equal(ctx.mapaMarkerState(s,'aqi').color,'#C7C7C7');now-=1;
 for(const timestamp of [null,'invalid','2099-01-01 00:00:00'])assert.equal(ctx.mapaMarkerState({...s,timestamp},'pm2_5').color,'#C7C7C7');
 s.timestamp='2026-10-30 14:59:00';assert.equal(ctx.mapaMarkerState(s,'aqi').shape,'circle');
 for(const v of [null,NaN,Infinity,-1,'4'])assert.equal(ctx.mapaMarkerState(row(v),'aqi').state,'missing');
 assert.equal(ctx.mapaMarkerState({...row(),humedad:null},'humedad').state,'missing');
});
test('leyenda segmentada con límites heredados y gris separado; otras capas neutras',()=>{
 ctx.renderMapaLegend('aqi');assert.equal((legend.innerHTML.match(/data-aqi-max=/g)||[]).length,6);
 for(const key of ['aqi_buena','aqi_moderada','aqi_grupos_sensibles','aqi_no_saludable','aqi_muy_no_saludable','aqi_peligrosa','aqi_sin_datos_card'])assert.ok(legend.innerHTML.includes(key));
 for(const color of ['--good','--moderate','--unhealthy-sg','--unhealthy','--very-unhealthy','--hazardous'])assert.ok(legend.innerHTML.includes(`var(${color})`));
 assert.equal((legend.innerHTML.match(/data-shape="circle"/g)||[]).length,1);
 assert.doesNotMatch(legend.innerHTML,/square|triangle|diamond|hexagon|star|--accent/);
 assert.match(legend.innerHTML,/0<\/span>/);for(const v of [50,100,150,200,300])assert.ok(legend.innerHTML.includes(`>${v}</span>`));assert.ok(legend.innerHTML.includes('>500+</span>'));
 assert.match(legend.innerHTML,/aria-describedby="mapa-aqi-ranges"/);assert.match(legend.innerHTML,/mapa-no-data/);assert.match(legend.innerHTML,/0–50/);assert.match(legend.innerHTML,/301–500/);
 ctx.renderMapaLegend('humedad');assert.equal((legend.innerHTML.match(/data-shape=/g)||[]).length,3);assert.doesNotMatch(legend.innerHTML,/aqi_buena|0–|50–/);
});
test('popup muestra la variable elegida/unidad/fecha/estado, escape de metadata',()=>{
 const s={...row(),nombre:'<img src=x onerror=alert(1)>'};
 const popup=ctx.mapaPopupHtml(s,'temperatura');
 assert.match(popup,/22.3 °C/);assert.match(popup,/mapa_dato_reciente/);assert.match(popup,/&lt;img/);assert.doesNotMatch(popup,/<img|AQI 22/);
 assert.match(ctx.mapaPopupHtml(s,'humedad'),/48 %/);
 assert.match(ctx.mapaPopupHtml({...s,timestamp:'2000-01-01 00:00:00'},'aqi'),/aqi_sin_datos_card/);
});
test('una sola geometría SVG decorativa, sin figuras, texto ni acento monocromático',()=>{
 for(const state of ['recent','stale','missing']){
  const icon=ctx.mapaSymbolHtml(state,state==='stale'?'#C7C7C7':'var(--good)');
  assert.match(icon,/aria-hidden="true"/);assert.equal((icon.match(/<circle /g)||[]).length,1);
  assert.doesNotMatch(icon,/<text|<path|<rect|<polygon|undefined|--accent/);
 }
 assert.doesNotMatch(html,/MAPA_AQI_SHAPES/);
});
