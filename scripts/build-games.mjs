// Rebuild ignored game outputs before development, tests, and releases; cache source and output hashes.
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gameSourceHash, root } from './game-build-inputs.mjs';
import { promisify } from 'node:util';
const games = join(root, 'games');
const cacheFile = join(games, '.build-cache.json');
const run = promisify(execFile);
if (process.env.GM_SKIP_GAME_BUILD === '1') {
  console.log('Game output generation deferred to the build job.');
  process.exit(0);
}
const source = gameSourceHash();
const frames = join(games, '.render-cache', gameSourceHash(true));
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
      if (id === 'depth') {
        const shards = Array.from({ length: 8 }, (_, i) => i).filter((i) => !existsSync(join(frames, `shard-${i}.json`)));
        async function renderWorker() {
          for (;;) {
            const shard = shards.shift();
            if (shard === undefined) return;
            await run(process.execPath, [join(root, 'node_modules/vite-node/vite-node.mjs'), '../games/depth/tools/renderFrames.ts', `${shard}/8`], {
              cwd: join(root, 'web'),
              env: { ...process.env, DEPTH_FRAME_CACHE: frames },
              timeout: 240_000,
              killSignal: 'SIGKILL',
              maxBuffer: 64 << 20,
            });
          }
        }
        await Promise.all([renderWorker(), renderWorker()]);
      }
      await run(process.execPath, [join(root, 'node_modules/vite-node/vite-node.mjs'), `../games/${id}/build.ts`], {
        cwd: join(root, 'web'),
        maxBuffer: 64 << 20,
        timeout: 240_000,
        killSignal: 'SIGKILL',
        env: { ...process.env, GAME_DISK_OUT: '', TEXT_BOUNDS: '', DEPTH_FRAME_CACHE: frames },
      });
    } catch (error) {
      throw new Error(secret ? 'A game build failed.' : `${id}: game build failed\n${error.stderr ?? error.message}`);
    }
    if (!secret) console.log(`Built ${id}`);
  }
}
await Promise.all([worker(), worker()]);
writeFileSync(cacheFile, JSON.stringify({ source, frames, outputs: Object.fromEntries(ids.map((id) => [id, outputs(id)])) }) + '\n');
console.log('Game build outputs are ready.');
