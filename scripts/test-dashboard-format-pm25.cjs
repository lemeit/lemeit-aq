const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
for (const script of scripts) new vm.Script(script);
const dashboard = scripts.find(script => script.includes('function pm25ToAqi('));
assert.ok(dashboard, 'El dashboard debe tener un bloque JavaScript');
assert.match(dashboard, /function formatPm25\(/, 'formatPm25 debe estar en JavaScript');
for (const [, css] of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
  assert.doesNotMatch(css, /function formatPm25\(/, 'formatPm25 no debe estar en CSS');
}
const start = dashboard.indexOf('  function pm25ToAqi(');
const end = dashboard.indexOf('  /* ── MAPA ── */', start);
assert.ok(end > start);
const breakpoints = dashboard.match(/const PM25_AQI_BREAKPOINTS = \[[\s\S]*?\n  \];/);
assert.ok(breakpoints, 'Se deben usar los umbrales reales del dashboard');
const context = vm.createContext({});
vm.runInContext(breakpoints[0], context);
vm.runInContext(dashboard.slice(start, end), context);
for (const value of [0, 0.1, 9, 12.34, 500.4, 600]) {
  assert.equal(context.formatPm25(value), String(value));
}
for (const value of [null, undefined, '', '12.3', true, false, -1, NaN, Infinity, -Infinity]) {
  assert.equal(context.formatPm25(value), '—');
}
assert.match(html, /PM2\.5: \$\{formatPm25\(s\.pm2_5\)\}/);
assert.match(html, /metric-value">\$\{formatPm25\(s\.pm2_5\)\}/);
console.log('Regresión formatPm25: OK (scripts, ubicación, valores y usos en mapa/tarjetas)');
