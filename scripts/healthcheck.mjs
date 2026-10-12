import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { runHealthcheck, summary } from './healthcheck-lib.mjs';

try {
  const args = process.argv.slice(2);
  let configPath = 'healthcheck.config.json';
  let outputPath = 'healthcheck-results/healthcheck.json';
  const offline = args.includes('--offline');
  if (offline) args.splice(args.indexOf('--offline'), 1);
  for (let i = 0; i < args.length; i += 2) {
    if (!args[i + 1]) throw new Error('ARGUMENT');
    if (args[i] === '--config') configPath = args[i + 1];
    else if (args[i] === '--output') outputPath = args[i + 1];
    else throw new Error('ARGUMENT');
  }
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const network = config.network;
  if (!network || !Number.isInteger(network.timeoutMs) || network.timeoutMs < 1 || network.timeoutMs > 60000 ||
      !Number.isInteger(network.retries) || network.retries < 0 || network.retries > 3 ||
      !Number.isInteger(network.maxRedirects) || network.maxRedirects < 0 || network.maxRedirects > 10 ||
      !Number.isFinite(network.warnResponseMs) || network.warnResponseMs < 0 ||
      !Number.isFinite(network.warnExpiryDays) || network.warnExpiryDays <= 0) throw new Error('CONFIG');
  const report = await runHealthcheck(config, { offline });
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n');
  const markdown = summary(report);
  console.log(markdown);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown);
  process.exitCode = report.counts.FAIL ? 1 : 0;
} catch {
  const report = { schemaVersion: 1, status: 'FAIL', counts: { PASS: 0, WARN: 0, FAIL: 1, SKIP: 0 }, checks: [{ id: 'execution', status: 'FAIL', message: 'Configuración, argumentos o escritura de resultados inválidos; consultar docs/HEALTHCHECK.md' }] };
  console.error(summary(report));
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary(report)).catch(() => {});
  process.exitCode = 1;
}
