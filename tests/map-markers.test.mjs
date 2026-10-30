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
vm.runInContext(constants+'const STALE_MINUTES=25;'+['pm25ToAqi','formatAqi','formatPm25','toBsAs','minutosSinDato','isStale','formatBsAsFull'].map(fn).join('\n')+map+['unitSuffix','formatParamValue','renderMapaLegend'].map(fn).join('\n'),ctx);
const row=(pm2_5=4)=>({nombre:'Fixture',pm2_5,timestamp:'2026-10-30 14:59:00',temperatura:22.3,humedad:48});
test('seis categorías: extremos heredados y >500 conservan su forma',()=>{
 const cases=[[0,'circle'],[9,'circle'],[9.1,'square'],[35.4,'square'],[35.5,'triangle'],[55.4,'triangle'],[55.5,'diamond'],[125.4,'diamond'],[125.5,'hexagon'],[225.4,'hexagon'],[225.5,'star'],[325.4,'star'],[400,'star']];
 for(const [pm,shape] of cases)assert.equal(ctx.mapaMarkerState(row(pm),'aqi').shape,shape,String(pm));
 const shapes=cases.map(([pm])=>ctx.mapaMarkerState(row(pm),'aqi').shape);assert.equal(new Set(shapes).size,6);
});
test('PM2.5 y todos los parámetros de medición usan el mismo símbolo sin clasificar',()=>{
 for(const param of ['pm2_5','temperatura','humedad','presion','voc','co2','nox']){
  const s={...row(),presion:1009,voc:30,co2:600,nox:1};
  assert.equal(ctx.mapaMarkerState(s,param).shape,'measurement');
 }
 for(const pm of [4,40,400])assert.equal(ctx.mapaMarkerState(row(pm),'pm2_5').shape,'measurement');
});
test('frescura de #22 tiene precedencia; recuperación y valor ausente distinguibles',()=>{
 const s=row();s.timestamp='2026-10-30 14:35:00';
 assert.equal(ctx.mapaMarkerState(s,'aqi').state,'recent');now+=1;
 assert.equal(ctx.mapaMarkerState(s,'aqi').shape,'stale');now-=1;
 for(const timestamp of [null,'invalid','2099-01-01 00:00:00'])assert.equal(ctx.mapaMarkerState({...s,timestamp},'pm2_5').shape,'stale');
 s.timestamp='2026-10-30 14:59:00';assert.equal(ctx.mapaMarkerState(s,'aqi').shape,'circle');
 for(const v of [null,NaN,Infinity,-1,'4'])assert.equal(ctx.mapaMarkerState(row(v),'aqi').state,'missing');
 assert.equal(ctx.mapaMarkerState({...row(),humedad:null},'humedad').state,'missing');
});
test('leyenda sin seis colores/rangos relativos, símbolos y categorías textuales',()=>{
 ctx.renderMapaLegend('aqi');assert.equal((legend.innerHTML.match(/data-shape=/g)||[]).length,8);
 for(const key of ['aqi_buena','aqi_moderada','aqi_grupos_sensibles','aqi_no_saludable','aqi_muy_no_saludable','aqi_peligrosa','aqi_sin_datos_card'])assert.ok(legend.innerHTML.includes(key));
 assert.doesNotMatch(legend.innerHTML,/--good|--moderate|gradient|rgb\(/);
 ctx.renderMapaLegend('humedad');assert.equal((legend.innerHTML.match(/data-shape=/g)||[]).length,3);assert.doesNotMatch(legend.innerHTML,/aqi_buena|0–|50–/);
});
test('popup muestra la variable elegida/unidad/fecha/estado, escape de metadata',()=>{
 const s={...row(),nombre:'<img src=x onerror=alert(1)>'};
 const popup=ctx.mapaPopupHtml(s,'temperatura');
 assert.match(popup,/22.3 °C/);assert.match(popup,/mapa_dato_reciente/);assert.match(popup,/&lt;img/);assert.doesNotMatch(popup,/<img|AQI 22/);
 assert.match(ctx.mapaPopupHtml(s,'humedad'),/48 %/);
 assert.match(ctx.mapaPopupHtml({...s,timestamp:'2000-01-01 00:00:00'},'aqi'),/aqi_sin_datos_card/);
});
test('SVG decorativo y acento existente, sin texto/números superpuestos',()=>{
 for(const shape of ['circle','square','triangle','diamond','hexagon','star','measurement','stale','missing']){
  const icon=ctx.mapaSymbolHtml(shape,shape==='stale'?'stale':'recent');assert.match(icon,/aria-hidden="true"/);assert.doesNotMatch(icon,/<text|undefined|--good|#00/);
 }
 assert.match(html,/\.mapa-symbol \{ color: var\(--accent\)/);
 assert.match(html,/--accent: #D9691F/);assert.match(html,/--accent: #9B3D00/);
});
