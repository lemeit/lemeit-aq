import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('assets/geo/pba-partidos.js','utf8'),ctx);
const data=ctx.window.AQ_PBA;
test('135 partidos reales, no comunas ni nombres de ciudades sustituidos',()=>{
 assert.equal(data.features.length,135);
 assert.equal(new Set(data.features.map(f=>f.properties.id)).size,135);
 const names=data.features.map(f=>f.properties.name);
 for(const name of ['Saladillo','25 de Mayo','Lezama','La Plata','General Pueyrredón']) assert.ok(names.includes(name),name);
 assert.ok(!names.includes('Mar del Plata'));assert.ok(names.every(n=>!n.startsWith('Comuna')));
 for(const f of data.features){
  assert.ok(['Polygon','MultiPolygon'].includes(f.geometry.type));
  const [lat,lon]=f.properties.label;assert.ok(lon>=data.bbox[0]&&lon<=data.bbox[2]&&lat>=data.bbox[1]&&lat<=data.bbox[3]);
 }
});
test('PBA cubre extremos provinciales y recursos locales están en shell PWA',()=>{
 assert.ok(data.bbox[0]<-63&&data.bbox[1]<-41&&data.bbox[2]>-57&&data.bbox[3]>-33.3);
 const sw=fs.readFileSync('sw.js','utf8');
 for(const path of ['assets/mapa-pba.js','assets/geo/pba-partidos.js'])assert.ok(sw.includes(path));
 assert.ok(fs.statSync('assets/geo/pba-partidos.js').size<300000);
});
