import https from 'node:https';
import { lookup } from 'node:dns/promises';

// Adaptado de lemeit/previa PR #3; no recoge cuerpos ni cabeceras crudas.
export function publicUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.port) {
    throw new Error('URL pública HTTPS sin credenciales ni parámetros requerida');
  }
  return url;
}

// Lista cerrada: ninguna configuración puede convertir el diagnóstico en un GET de API.
export function pagesUrl(value) {
  const url = publicUrl(value);
  if (url.hostname !== 'app.lemeit.ar' || !['/aq', '/aq/', '/aq/api.html', '/aq/api'].includes(url.pathname)) throw new Error('DESTINATION');
  return url;
}

export function request(url, timeoutMs) {
  pagesUrl(url.href);
  return new Promise((resolve, reject) => {
    const started = performance.now();
    // Cada salto requiere certificado propio: una sesión TLS reanudada puede
    // devolver {} en getPeerCertificate(). No compartir sesiones ni sockets.
    const agent = new https.Agent({ keepAlive: false, maxCachedSessions: 0 });
    const req = https.get(url, { agent, rejectUnauthorized: true, headers: { 'user-agent': 'Infrastructure-Healthcheck/1.0' } }, res => {
      const certificate = res.socket?.getPeerCertificate() || {};
      const result = { status: res.statusCode, headers: res.headers,
        durationMs: Math.round(performance.now() - started),
        certificateExpires: certificate.valid_to || null };
      res.destroy(); // No recolectar ni registrar cuerpos.
      resolve(result);
    });
    const timer = setTimeout(() => req.destroy(new Error('TIMEOUT')), timeoutMs);
    req.once('close', () => { clearTimeout(timer); agent.destroy(); });
    req.once('error', reject);
  });
}

export async function probe(endpoint, options, transport = request) {
  const initial = pagesUrl(endpoint.url);
  for (let attempt = 0; attempt <= options.retries; attempt++) {
    let current = initial;
    const redirects = [];
    const visited = new Set();
    let durationMs = 0;
    try {
      for (;;) {
        if (visited.has(current.href)) throw new Error('REDIRECT_LOOP');
        visited.add(current.href);
        const response = await transport(current, options.timeoutMs);
        durationMs += response.durationMs;
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          if (!response.headers.location || redirects.length >= options.maxRedirects) throw new Error('REDIRECT_LIMIT_OR_LOCATION');
          const next = pagesUrl(new URL(response.headers.location, current).href);
          if (next.origin !== initial.origin && !(endpoint.allowedOrigins || []).includes(next.origin)) throw new Error('REDIRECT_ORIGIN');
          redirects.push({ status: response.status, from: current.href, to: next.href });
          current = next;
          continue;
        }
        if ((response.status === 429 || response.status >= 500) && attempt < options.retries) break;
        return { ...response, durationMs, finalUrl: current.href, redirects, attempts: attempt + 1 };
      }
    } catch (error) {
      if (attempt === options.retries) throw error;
    }
  }
}

export async function runHealthcheck(config, { transport = request, resolveDns = lookup, nodeVersion = process.versions.node, offline = false } = {}) {
  const checks = [];
  const add = (id, status, message, details = {}) => checks.push({ id, status, message, ...details });
  const major = Number(nodeVersion.split('.')[0]);
  add('node', major < config.node.minimumMajor ? 'FAIL' : major === config.node.recommendedMajor ? 'PASS' : 'WARN', `Node ${nodeVersion}; recomendado ${config.node.recommendedMajor}`);
  for (const hostname of config.dns || []) {
    if (!['app.lemeit.ar', 'api.lemeit.ar'].includes(hostname)) { add('dns:configuration', 'FAIL', 'Host DNS fuera de la lista autorizada'); continue; }
    if (offline) { add(`dns:${hostname}`, 'SKIP', 'Modo offline: no se consulta DNS'); continue; }
    let timer;
    try {
      await Promise.race([resolveDns(hostname), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('TIMEOUT')), config.network.timeoutMs); })]);
      add(`dns:${hostname}`, 'PASS', 'Resolución DNS disponible');
    } catch { add(`dns:${hostname}`, 'FAIL', 'No se pudo resolver DNS dentro del timeout'); }
    finally { clearTimeout(timer); }
  }
  for (const endpoint of [...(config.endpoints || []), ...(config.services || [])]) {
    if (offline) { add(endpoint.id, 'SKIP', 'Modo offline: no se realiza HTTP'); continue; }
    if (!endpoint.url) { add(endpoint.id, 'SKIP', 'Servicio sin URL configurada'); continue; }
    try {
      const confirmed = config.staticGatewayRoutesConfirmed || [];
      const initial = pagesUrl(endpoint.url);
      if (!Array.isArray(confirmed) || !confirmed.includes(initial.href)) {
        add(endpoint.id, 'SKIP', 'Ruta sin confirmación de gateway estático y origen Pages; no se realiza HTTP'); continue;
      }
      const guardedTransport = (url, timeoutMs) => {
        if (!confirmed.includes(pagesUrl(url.href).href)) throw new Error('UNCONFIRMED_ROUTE');
        return transport(url, timeoutMs);
      };
      const result = await probe(endpoint, config.network, guardedTransport);
      const expected = (endpoint.statuses || [200]).includes(result.status);
      const reachable = (endpoint.reachableStatuses || []).includes(result.status);
      const typeOK = !endpoint.contentType || String(result.headers['content-type'] || '').includes(endpoint.contentType);
      const status = expected && typeOK ? 'PASS' : reachable ? 'WARN' : endpoint.critical ? 'FAIL' : 'WARN';
      const { headers, status: httpStatus } = result;
      const details = { durationMs: result.durationMs, attempts: result.attempts, redirects: result.redirects.length };
      add(endpoint.id, status, reachable ? `HTTP ${result.status}: gateway accesible; salud del servicio no comprobada sin acceso` : `HTTP ${result.status}; HTTPS con validación TLS y hostname`, { ...details, httpStatus });
      add(`${endpoint.id}:latency`, result.durationMs > config.network.warnResponseMs ? 'WARN' : 'PASS', `${result.durationMs} ms hasta cabeceras, incluidas redirecciones; no mide rendimiento del navegador`);
      const expiry = Date.parse(result.certificateExpires);
      const days = (expiry - Date.now()) / 86400000;
      add(`${endpoint.id}:expiry`, !Number.isFinite(expiry) ? 'WARN' : days <= 0 ? 'FAIL' : days < config.network.warnExpiryDays ? 'WARN' : 'PASS', !Number.isFinite(expiry) ? 'Vencimiento TLS no disponible' : days <= 0 ? 'Certificado vencido' : days < config.network.warnExpiryDays ? 'Certificado próximo a vencer' : 'Vencimiento TLS fuera del umbral');
      if (endpoint.security) {
        const missing = Object.entries(config.securityHeaders || {}).filter(([key, value]) => !headers[key] || (value && headers[key] !== value)).map(([key]) => key);
        add(`${endpoint.id}:headers`, missing.length ? 'WARN' : 'PASS', missing.length ? `Cabeceras ausentes o distintas: ${missing.join(', ')}` : 'Cabeceras relevantes presentes');
      }
    } catch (error) {
      const known = ['TIMEOUT', 'REDIRECT_LOOP', 'REDIRECT_LIMIT_OR_LOCATION', 'REDIRECT_ORIGIN', 'DESTINATION', 'UNCONFIRMED_ROUTE'];
      const codes = ['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'CERT_HAS_EXPIRED', 'ERR_TLS_CERT_ALTNAME_INVALID', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'];
      add(endpoint.id, endpoint.critical ? 'FAIL' : 'WARN', known.includes(error.message) ? error.message : codes.includes(error.code) ? `Error de conexión/TLS: ${error.code}` : 'No se pudo validar conexión HTTPS, certificado o configuración');
    }
  }
  for (const id of ['api:sensores', 'api:ultimas', 'api:historico', 'json', 'freshness']) add(id, 'SKIP', 'GET público inserta visitas en D1; prohibido modificar D1. Validadores solo con fixtures');
  for (const id of ['api:tls', 'providers', 'carto', 'admin', 'ingestion', 'cron', 'd1']) add(id, 'SKIP', 'Fuera del diagnóstico autorizado; no se comprueba operación real');
  const counts = Object.fromEntries(['PASS', 'WARN', 'FAIL', 'SKIP'].map(status => [status, checks.filter(check => check.status === status).length]));
  return { schemaVersion: 1, generatedAt: new Date().toISOString(), status: counts.FAIL ? 'FAIL' : counts.WARN ? 'WARN' : 'PASS', counts, checks };
}

export function summary(report) {
  const escape = value => String(value).replaceAll('|', '\\|').replace(/[\r\n]/g, ' ');
  return `## Healthcheck: ${report.status}\n\n${Object.entries(report.counts).map(([key, value]) => `${key}: ${value}`).join(' · ')}\n\n| Comprobación | Estado | Resultado |\n| --- | --- | --- |\n${report.checks.map(check => `| ${escape(check.id)} | ${check.status} | ${escape(check.message)} |`).join('\n')}\n`;
}
