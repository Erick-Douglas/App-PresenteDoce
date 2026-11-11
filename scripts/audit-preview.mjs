import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

for (const args of [['audit','--json'], ['audit','fix','--package-lock-only','--ignore-scripts','--no-fund','--json']]) {
  const command = spawnSync('npm', args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const output = JSON.parse(command.stdout);
  const data = output.audit || output;
  const summary = Object.fromEntries(Object.entries(data.vulnerabilities || {}).map(([name, value]) => [
    name, { severity: value.severity, range: value.range, fix: value.fixAvailable, via: value.via.map(item => typeof item === 'string' ? item : { title: item.title, url: item.url, range: item.range }) }
  ]));
  console.log('PD_AUDIT ' + args.join(' ') + ' ' + JSON.stringify(summary));
  if (output.error) console.log('PD_AUDIT_ERROR ' + output.error.code);
}
const data = gzipSync(readFileSync('package-lock.json')).toString('base64');
for (let i = 0; i < data.length; i += 600) {
  console.log('PD_LOCK ' + String(i / 600).padStart(3, '0') + ' ' + data.slice(i, i + 600));
}
