// Aceptación AQ-01: código real de UI en VM, datos sintéticos, HTTP prohibido.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html = fs.readFileSync('index.html', 'utf8');
function fn(name) {
  const start = html.indexOf('  function ' + name + '(');
  assert.ok(start >= 0, name);
  const end = html.indexOf('\n  }', start);
  assert.ok(end > start, name);
  return html.slice(start, end + 4);
}
const legend = { innerHTML: '' };
const styles = { getPropertyValue: name => name === '--text-dim' ? '#neutral' : name };
const ui = vm.createContext({
  t: key => key, document: { documentElement: {}, getElementById: () => legend },
  paramLabel:k=>k, getComputedStyle: () => styles, isStale: () => false, infoIconHtml: () => '',
  formatBsAsFull: () => 'fixture UTC', STALE_MINUTES: 25, PROVIDER_BADGE: {},
  fetch: () => { throw Error('HTTP prohibido'); },
});
const constants = html.slice(html.indexOf('  const PM25_AQI_BREAKPOINTS ='), html.indexOf('  const aqiBandsPlugin ='));
const gauge = html.slice(html.indexOf('  const AQI_GAUGE_BANDS ='), html.indexOf('  function polarToCartesian'));
const params = html.slice(html.indexOf('  const MAPA_PARAMS ='), html.indexOf('  // Una geometría común'));
const mapHelpers = html.slice(html.indexOf('  // Una geometría común'),html.indexOf('  // VOC/NOx'));
vm.runInContext(constants + gauge + params + mapHelpers + [
  'pm25ToAqi', 'pm25FromAqi', 'aqiInfo', 'formatAqi', 'formatPm25',
  'aqiGaugeNeedleAngle', 'polarToCartesian', 'gaugeArcPath', 'aqiGaugeSvg',
  'unitSuffix', 'formatParamValue', 'renderMapaLegend', 'buildSensorCardInner',
].map(fn).join('\n'), ui);
const boundaries = [[0,0],[9,50],[9.1,51],[35.4,100],[35.5,101],[55.4,150],
  [55.5,151],[125.4,200],[125.5,201],[225.4,300],[225.5,301],[325.4,500]];
const invalid = [null,undefined,NaN,Infinity,-Infinity,-1,-Number.MIN_VALUE,'12.05','',true,false,{},[]];

test('AQ-01 aceptación: todos los extremos de tabla EPA, incluidos 301–500', () => {
  for (const [pm, expected] of boundaries) assert.equal(ui.pm25ToAqi(pm), expected, String(pm));
});
test('AQ-01 aceptación: huecos originales desaparecen por truncamiento, no redondeo de PM', () => {
  for (const [pm, expected] of [[9.0999,50],[12.05,56],[35.45,100],[55.45,150],
    [125.4999,200],[150.45,226],[225.4999,300],[325.4999,500]]) {
    assert.equal(ui.pm25ToAqi(pm), expected, String(pm));
  }
  assert.equal(ui.pm25ToAqi(9.1999), ui.pm25ToAqi(9.1));
  assert.equal(ui.pm25ToAqi(0.0999),0);
  assert.equal(ui.pm25ToAqi(Number.MIN_VALUE),0);
});
test('AQ-01 aceptación: interpolación y redondeo del índice', () => {
  for (const [pm, expected] of [[0.4,2],[0.5,3],[4.5,25],[9.3,51],[9.4,52],[175.4,250],[275.4,400]]) {
    assert.equal(ui.pm25ToAqi(pm), expected, String(pm));
  }
});
test('AQ-01 aceptación: inválidos no se convierten a 300 ni a 0', () => {
  for (const value of invalid) {
    assert.equal(ui.pm25ToAqi(value),null,String(value));
    assert.equal(ui.formatPm25(value),'—');
    assert.equal(ui.aqiInfo(ui.pm25ToAqi(value)).color,'var(--text-dim)');
  }
  assert.equal(ui.pm25ToAqi(-0),0);
});
test('AQ-01 aceptación: extrapolación EPA >500, redondeo y saturación visual', () => {
  for (const [pm,expected] of [[325.5,500],[325.6,500],[325.7,501],[400,649],[425.3,699]]) {
    const aqi=ui.pm25ToAqi(pm);
    assert.equal(aqi,expected); assert.equal(ui.formatAqi(aqi),expected>500?'>500':'500');
    assert.equal(ui.aqiInfo(aqi).label,'aqi_peligrosa');
    assert.equal(ui.aqiGaugeNeedleAngle(aqi),0);
  }
  assert.equal(ui.formatAqi(ui.pm25ToAqi(325.4999)),'500');
  assert.ok(Number.isFinite(ui.pm25ToAqi(1e30)));
  assert.equal(ui.formatAqi(ui.pm25ToAqi(1e30)),'>500');
  assert.equal(ui.pm25ToAqi(Number.MAX_VALUE),null,'overflow no representable, nunca 300');
});
test('AQ-01 aceptación: todas las décimas son monotónicas y enteras dentro de 0–500', () => {
  let previous=-1;
  for (let i=0;i<=3254;i++) {
    const result=ui.pm25ToAqi(i/10);
    assert.ok(Number.isInteger(result)&&result>=previous&&result<=500,`décima ${i}: ${result}`);
    previous=result;
  }
});
test('AQ-01 aceptación: inversa en todos los extremos y errores definidos', () => {
  for (const [pm, aqi] of boundaries) assert.equal(ui.pm25FromAqi(aqi),pm,String(aqi));
  for (const value of [...invalid,500.1,501,50.5]) assert.equal(ui.pm25FromAqi(value),null,String(value));
  for (let aqi=0;aqi<=500;aqi++) {
    assert.ok(Math.abs(ui.pm25ToAqi(ui.pm25FromAqi(aqi))-aqi)<=1,`inversa ${aqi}`);
  }
});
test('AQ-01 aceptación: seis categorías y colores, sin rojo para inválidos', () => {
  for (const [lo,hi,key,color] of [[0,50,'aqi_buena','--good'],[51,100,'aqi_moderada','--moderate'],
    [101,150,'aqi_grupos_sensibles','--unhealthy-sg'],[151,200,'aqi_no_saludable','--unhealthy'],
    [201,300,'aqi_muy_no_saludable','--very-unhealthy'],[301,500,'aqi_peligrosa','--hazardous']]) {
    for (const value of [lo,hi]) { assert.equal(ui.aqiInfo(value).label,key); assert.equal(ui.aqiInfo(value).color,`var(${color})`); }
    assert.match(html,new RegExp(color+':'));
  }
  for (const value of invalid) {
    assert.equal(ui.aqiInfo(value).color,'var(--text-dim)'); assert.equal(ui.aqiInfo(value).bg,'transparent');
    assert.equal(ui.formatAqi(value),'—'); assert.equal(ui.aqiGaugeNeedleAngle(value),180);
  }
});
test('AQ-01 aceptación: gauge completo, numérico y neutro ante inválidos', () => {
  for (const aqi of [0,50,100,150,200,300,500]) {
    const svg=ui.aqiGaugeSvg(aqi,ui.aqiInfo(aqi).color);
    assert.equal((svg.match(/<path /g)||[]).length,6);
    assert.doesNotMatch(svg,/NaN|Infinity/);
  }
  for (const value of invalid) {
    const svg=ui.aqiGaugeSvg(value,'red');
    assert.match(svg,/fill="#neutral">—<\/text>/);assert.doesNotMatch(svg,/NaN|Infinity/);
  }
  assert.match(ui.aqiGaugeSvg(ui.pm25ToAqi(400),'var(--hazardous)'),/>\s*>500<\/text>/);
});
test('AQ-01 aceptación: mapa, etiqueta PM, leyenda y cards usan la misma clasificación', () => {
  for (const value of invalid) {
    const sensor={sensor_index:1,nombre:'Fixture',pm2_5:value,timestamp:'fixture'};
    assert.equal(ui.mapaMarkerState(sensor,'aqi').state,'missing');
    assert.equal(ui.mapaMarkerState(sensor,'pm2_5').state,'missing');
    assert.equal(ui.formatParamValue(sensor,'aqi'),'—');
    assert.equal(ui.formatParamValue(sensor,'pm2_5'),'—');
    const card=ui.buildSensorCardInner(sensor,'fixture-');
    assert.match(card,/aqi_sin_dato/);assert.doesNotMatch(card,/NaN|Infinity|>300<\/text>/);
  }
  const high={sensor_index:1,nombre:'Fixture',pm2_5:400,timestamp:'fixture'};
  assert.equal(ui.formatParamValue(high,'aqi'),'>500');
  assert.match(ui.buildSensorCardInner(high,''),/aqi_peligrosa/);
  ui.renderMapaLegend('aqi',null);
  assert.equal((legend.innerHTML.match(/data-shape=/g)||[]).length,1);
  assert.match(legend.innerHTML,/aqi_muy_no_saludable/);assert.match(legend.innerHTML,/aqi_peligrosa/);
});
test('AQ-01 aceptación: gráfico usa inversa actual, seis bandas y extremo >escala', () => {
  vm.runInContext(html.slice(html.indexOf('  const aqiBandsPlugin ='),html.indexOf('  function pm25FromAqi'))+'\nglobalThis.plugin=aqiBandsPlugin;',ui);
  const bounds=[],colors=[];
  ui.plugin.beforeDraw({chartArea:{left:0,right:100},scales:{y_pm2_5:{max:400,getPixelForValue:n=>{bounds.push(n);return n;}}},
    ctx:{save(){},restore(){},set fillStyle(c){colors.push(c);},fillRect(){}}});
  assert.equal(colors.length,6);assert.ok(bounds.includes(9));assert.ok(bounds.includes(125.4));
  assert.ok(bounds.includes(225.4));assert.ok(bounds.includes(400));assert.ok(bounds.every(Number.isFinite));
});
test('AQ-01 aceptación: aviso breve bilingüe y ayuda explican última medición', () => {
  assert.match(html,/data-i18n="aqi_sample_note"/);
  assert.match(html,/Este valor refleja la última medición del sensor\. No representa el promedio del día\./);
  assert.match(html,/This value reflects the sensor’s latest measurement\. It does not represent the daily average\./);
  assert.match(html,/Indicador calculado a partir de la última medición de PM2\.5 del sensor disponible en el sistema/);
  assert.doesNotMatch(html,/Período de la muestra no verificado|Sample period unverified/);
  assert.doesNotMatch(html,/<strong>No es AQI diario ni NowCast|<strong>This is not daily AQI or NowCast/);
});
