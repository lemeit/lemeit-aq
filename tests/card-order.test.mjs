import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('  function sortSensorCards(');
const end = html.indexOf('  function renderGrid(', start);
const ctx = vm.createContext({});
vm.runInContext(html.slice(start, end), ctx);
const sort = rows => Array.from(ctx.sortSensorCards(rows));
const row = (sensor_index, codigo, proveedor, nombre) => ({sensor_index, codigo, proveedor, nombre});
test('AE-03 por nombre, proveedor conservado, regresión del orden recibido', () => {
 const rows = [row(198617,'AE-00','purpleair'),row(298687,'AE-01','purpleair'),row(298691,null,'purpleair','AE-03'),row(298701,'AE-02','purpleair'),row(900002,null,'airgradient'),row(900003,null,'airgradient')];
 assert.deepEqual(sort(rows).map(s=>s.sensor_index),[198617,298687,298701,298691,900002,900003]);
});
test('números, campos ausentes, código inválido explícito, grupos y desempates estables', () => {
 const rows = [row(40,null,'purpleair'),row(30,'AE-100'),row(20,'AE-10','airgradient'),row(10,'AE-2','purpleair'),row(9,'AE-02',null),row(3,undefined,undefined),row(2,'mal','airgradient','Sin AE'),row(1,'',null,'AE-01'),row(4,null,'otro'),row(35,'AE-','purpleair'),row(5,42),row(6,null,null,'AE-3 texto')];
 assert.deepEqual(sort(rows).map(s=>s.sensor_index),[1,9,10,20,30,2,3,4,5,6,35,40]);
 assert.deepEqual(sort([...rows].reverse()).map(s=>s.sensor_index),sort(rows).map(s=>s.sensor_index));
 const a=row(7,'AE-02'),b=row(7,'AE-2');
 assert.deepEqual(sort([a,b]),[a,b]);
 assert.deepEqual(sort([b,a]),[b,a]);
 assert.deepEqual(sort([]),[]);
});
test('sin mutación, sin dependencia de lecturas ni etiquetas institucionales', () => {
 const rows = Object.freeze([Object.freeze({...row(20,'AE-10','purpleair'),timestamp:null,pm2_5:null}),Object.freeze({...row(10,'AE-2'),institucion:'Z'})]);
 const before=JSON.stringify(rows);const result=sort(rows);
 assert.equal(JSON.stringify(rows),before);assert.notEqual(result,rows);assert.equal(result[0],rows[1]);
 assert.deepEqual(sort(rows.map(s=>({...s,timestamp:'2099-01-01',pm2_5:100,institucion:'A'}))).map(s=>s.sensor_index),[10,20]);
});

test('nombre visible tiene prioridad ante código contradictorio; código es fallback', () => {
 assert.deepEqual(sort([row(1,'AE-99','purpleair','AE-02'),row(2,'AE-03',null,'Otro'),row(3,'AE-01',null,'AE-10')]).map(s=>s.sensor_index),[1,2,3]);
});
