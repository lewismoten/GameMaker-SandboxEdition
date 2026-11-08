// npm run release:sizes -- [--dist <site build>] [--packages] [--downloads <folder>]
// Size budgets for what a release distributes (size-budgets.json): the Pages artifact (a vite build), its offline copy
// (offline.json), each npm tarball, and the native downloads. Prints a table with the biggest items; exits 1 over a budget.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const budgets = JSON.parse(readFileSync(join(root, 'scripts/release/size-budgets.json'), 'utf8'));
const args = process.argv.slice(2);
const value = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
const MB = 1024 * 1024;
const mb = (n) => `${(n / MB).toFixed(1)} MB`;
const kb = (n) => `${Math.round(n / 1024)} kB`;
const rows = [];
let failed = false;
function row(what, size, limit, show = mb) {
  const over = size > limit;
  failed ||= over;
  rows.push(`${over ? 'FAIL' : 'ok  '} ${what.padEnd(44)} ${show(size).padStart(10)}  (budget ${show(limit)})`);
}
// [path relative to top, bytes] of every file under top
function walk(top, dir = top, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(top, p, out);
    else if (e.isFile()) out.push([relative(top, p), statSync(p).size]);
  }
  return out;
}

const dist = value('--dist');
if (dist) {
  const b = budgets.pages;
  const files = walk(resolve(dist));
  const total = files.reduce((n, [, s]) => n + s, 0);
  row(`Pages artifact (${files.length} files)`, total, b.totalMB * MB);
  const groups = new Map();
  for (const [p, s] of files) {
    const key = p
      .split('/')
      .slice(0, p.startsWith('games/') ? 2 : 1)
      .join('/');
    groups.set(key, (groups.get(key) ?? 0) + s);
  }
  for (const [key, limit] of Object.entries(b.foldersMB)) row(`  ${key}/`, groups.get(key) ?? 0, limit * MB);
  const biggest = files.reduce((a, f) => (f[1] > a[1] ? f : a), ['', 0]);
  row(`  biggest file ${biggest[0]}`, biggest[1], b.fileMB * MB);
  const zips = files.filter(([p]) => /^games\/[a-z]+\/[^/]+\/[^/]+\.zip$/.test(p));
  const zip = zips.reduce((a, f) => (f[1] > a[1] ? f : a), ['', 0]);
  row(`  biggest game ZIP ${zip[0]}`, zip[1], b.gameZipMB * MB);
  const offline = join(resolve(dist), 'offline.json');
  if (existsSync(offline)) {
    const list = JSON.parse(readFileSync(offline, 'utf8')).files;
    row(
      `Offline copy (${list.length} files, transfer)`,
      list.reduce((n, f) => n + f[1], 0),
      budgets.offline.transferMB * MB,
    );
  }
  console.log('Largest folders:');
  for (const [k, s] of [...groups].sort((x, y) => y[1] - x[1]).slice(0, 8)) console.log(`  ${mb(s).padStart(9)}  ${k}`);
}

if (args.includes('--packages')) {
  for (const [name, b] of Object.entries(budgets.packages)) {
    const cwd = join(root, 'web/packages', name);
    const [pack] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd, encoding: 'utf8' }));
    row(`npm ${name} tarball (${pack.entryCount} files)`, pack.size, b.tarballKB * 1024, kb);
    row(`npm ${name} unpacked`, pack.unpackedSize, b.unpackedKB * 1024, kb);
  }
}

const downloads = value('--downloads');
if (downloads) {
  const files = walk(resolve(downloads));
  const biggest = files.reduce((a, f) => (f[1] > a[1] ? f : a), ['', 0]);
  row(
    `Native downloads (${files.length} files)`,
    files.reduce((n, [, s]) => n + s, 0),
    budgets.downloads.totalMB * MB,
  );
  row(`  biggest download ${biggest[0]}`, biggest[1], budgets.downloads.fileMB * MB);
}

if (!rows.length) {
  console.log('Usage: npm run release:sizes -- [--dist <site build>] [--packages] [--downloads <folder>]');
  process.exit(2);
}
console.log(rows.join('\n'));
process.exit(failed ? 1 : 0);
