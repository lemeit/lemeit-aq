// Contrato observado en worker/src/index.js y D1. Funciones puras, sin red.
export function utcTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return null;
  const iso = value.replace(' ', 'T') + 'Z';
  const ms = Date.parse(iso);
  return Number.isFinite(ms) && new Date(ms).toISOString() === iso.replace('Z', '.000Z') ? ms : null;
}
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const id = x => Number.isSafeInteger(x) && x > 0;
const providers = ['purpleair', 'airgradient'];
const metrics = ['pm1_0', 'pm2_5', 'pm10_0', 'temperatura', 'humedad', 'presion', 'voc', 'co2', 'nox'];
export function validateArray(rows, kind = 'sensores') {
  if (!['sensores', 'ultimas', 'historico'].includes(kind)) throw new Error('CONTRACT');
  if (!Array.isArray(rows)) return { status: 'FAIL', message: 'Se esperaba un array JSON' };
  const seen = new Set();
  for (const row of rows) {
    if (!object(row) || !id(row.sensor_index)) return { status: 'FAIL', message: 'Fila o identidad inválida' };
    const key = kind === 'historico' ? `${row.sensor_index}:${row.timestamp}` : row.sensor_index;
    if (seen.has(key)) return { status: 'FAIL', message: 'Identidad duplicada' };
    seen.add(key);
    if (kind === 'sensores' && (typeof row.nombre !== 'string' || ![0, 1].includes(row.activo))) return { status: 'FAIL', message: 'Metadata o estado inválido' };
    if (kind !== 'historico' && !providers.includes(row.proveedor)) return { status: 'FAIL', message: 'Proveedor desconocido' };
    if (kind !== 'sensores' && (!id(row.id) || utcTimestamp(row.timestamp) === null || metrics.some(k => row[k] !== undefined && row[k] !== null && (typeof row[k] !== 'number' || !Number.isFinite(row[k]))))) return { status: 'FAIL', message: 'Lectura o timestamp UTC inválido' };
  }
  if (kind !== 'sensores' && new Set(rows.map(x => x.id)).size !== rows.length) return { status: 'FAIL', message: 'ID de lectura duplicado' };
  return { status: rows.length ? 'PASS' : 'WARN', message: rows.length ? 'Estructura válida' : 'Array vacío' };
}
export function validateFreshness(sensors, readings, { now = Date.now(), staleMinutes = 25 } = {}) {
  if (!Number.isFinite(now) || !Number.isFinite(staleMinutes) || staleMinutes <= 0) throw new Error('CONFIG');
  if (validateArray(sensors).status === 'FAIL' || validateArray(readings, 'ultimas').status === 'FAIL') return [{ id: 'structure', status: 'FAIL', message: 'Estructura inválida; frescura no evaluada' }];
  const checks = [];
  const add = (id, status, message) => checks.push({ id, status, message });
  const active = sensors.filter(x => x.activo === 1);
  const metadata = new Map(sensors.map(x => [x.sensor_index, x]));
  for (const r of readings) {
    if (!metadata.has(r.sensor_index) || metadata.get(r.sensor_index).activo === 0) add('reading:outside-active', 'WARN', 'Última lectura fuera del listado activo; posible AQ-04, no demuestra sensor inexistente');
    if (metadata.has(r.sensor_index) && metadata.get(r.sensor_index).proveedor !== r.proveedor) add('reading:provider', 'FAIL', 'Proveedor inconsistente');
    if (utcTimestamp(r.timestamp) > now) add('reading:future', 'FAIL', 'Lectura futura');
  }
  for (const provider of providers) {
    const expected = active.filter(s => s.proveedor === provider);
    const recent = expected.filter(s => readings.some(r => r.sensor_index === s.sensor_index && r.proveedor === provider && utcTimestamp(r.timestamp) <= now && now - utcTimestamp(r.timestamp) <= staleMinutes * 60000));
    add(`coverage:${provider}`, !expected.length ? 'SKIP' : recent.length === expected.length ? 'PASS' : 'WARN', !expected.length ? 'Sin sensores activos del proveedor en fixture' : `${recent.length}/${expected.length} activos con lectura reciente; no demuestra ejecución de cron`);
  }
  for (const s of active) {
    const r = readings.find(r => r.sensor_index === s.sensor_index);
    add('active:reading', !r ? 'WARN' : utcTimestamp(r.timestamp) > now ? 'FAIL' : now - utcTimestamp(r.timestamp) > staleMinutes * 60000 ? 'WARN' : 'PASS', !r ? 'Sensor activo sin lectura' : utcTimestamp(r.timestamp) > now ? 'Lectura futura' : now - utcTimestamp(r.timestamp) > staleMinutes * 60000 ? 'Lectura vieja' : 'Lectura reciente; sin interpretación sanitaria');
  }
  if (!active.length) add('active', 'WARN', 'Sin sensores activos; cobertura no demostrada');
  return checks;
}
