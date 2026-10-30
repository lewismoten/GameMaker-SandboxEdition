// Rebuild ignored game outputs before development, tests, and releases; cache source and output hashes.
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const games = join(root, 'games');
const cacheFile = join(games, '.build-cache.json');
const run = promisify(execFile);
const hash = createHash('sha256');
function tree(dir, consume) {
  if (!existsSync(dir)) return;
  for (const item of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (['disk', 'walkPaths.json', '.build-cache.json', '.DS_Store', '__pycache__'].includes(item.name)) continue;
    const file = join(dir, item.name);
    if (item.isDirectory()) tree(file, consume);
    else if (item.isFile()) consume(file);
  }
}
for (const dir of [games, join(root, 'web/src'), ...['engine', 'tools', 'archives'].map((p) => join(root, 'web/packages', p, 'src'))])
  tree(dir, (file) => hash.update(relative(root, file)).update('\0').update(readFileSync(file)).update('\0'));
hash.update(readFileSync(join(root, 'package-lock.json')));
const source = hash.digest('hex');
let cached;
try {
  cached = JSON.parse(readFileSync(cacheFile, 'utf8'));
} catch {
  /* first build */
}
function outputs(id) {
  const dir = join(games, id, 'disk');
  if (!existsSync(dir)) return '';
  const digest = createHash('sha256');
  const files = readdirSync(dir).sort();
  if (!files.some((name) => /\.gam$/i.test(name))) return '';
  for (const name of files)
    digest
      .update(name)
      .update('\0')
      .update(readFileSync(join(dir, name)))
      .update('\0');
  const paths = join(games, id, 'walkPaths.json');
  if (existsSync(paths)) digest.update(readFileSync(paths));
  return digest.digest('hex');
}
const ids = readdirSync(games)
  .filter((id) => existsSync(join(games, id, 'build.ts')))
  .sort();
const pending = ids.filter((id) => process.argv.includes('--force') || cached?.source !== source || !cached?.outputs[id] || cached.outputs[id] !== outputs(id));
async function worker() {
  for (;;) {
    const id = pending.shift();
    if (!id) return;
    const secret = JSON.parse(readFileSync(join(games, id, 'about.json'), 'utf8')).secret;
    try {
      await run(process.execPath, [join(root, 'node_modules/vite-node/vite-node.mjs'), `../games/${id}/build.ts`], {
        cwd: join(root, 'web'),
        maxBuffer: 64 << 20,
        timeout: 240_000,
        killSignal: 'SIGKILL',
        env: { ...process.env, GAME_DISK_OUT: '', TEXT_BOUNDS: '' },
      });
    } catch (error) {
      throw new Error(secret ? 'A game build failed.' : `${id}: game build failed\n${error.stderr ?? error.message}`);
    }
    if (!secret) console.log(`Built ${id}`);
  }
}
await Promise.all([worker(), worker()]);
writeFileSync(cacheFile, JSON.stringify({ source, outputs: Object.fromEntries(ids.map((id) => [id, outputs(id)])) }) + '\n');
console.log('Game build outputs are ready.');
