// Rebuild ignored game outputs before development, tests, and releases; cache source and output hashes.
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { availableParallelism } from 'node:os';
import { gameSourceHash, root } from './game-build-inputs.mjs';
import { gameKeys, logoUsers } from './game-import-keys.mjs';
import { bundleEntry } from './game-bundle.mjs';
import { retrySignal } from './child-signal-retry.mjs';
import { promisify } from 'node:util';
const games = join(root, 'games');
const cacheFile = join(games, '.build-cache.json');
const run = promisify(execFile);
// every child is vite-node with game-build.config.mjs: the site's vite.config.ts (CD scan, SEO and offline plugins) costs each child ~0.7 s of CPU for nothing
const viteNode = [join(root, 'node_modules/vite-node/vite-node.mjs'), '-c', join(root, 'scripts/game-build.config.mjs')];
// a child runs a bundle of its entry under plain node (game-bundle.mjs); GM_VITE_NODE=1, a bundle that can't be made,
// or one that fails (a non-signal exit) means vite-node runs it as before, so a game needing a vite-only feature still builds
const useBundles = process.env.GM_VITE_NODE !== '1';
const fallbacks = [];
async function runEntry(name, entry, viteFile, args, options, label, retryBefore = Infinity) {
  const runOnce = async () => {
    const bundle = useBundles ? await bundleEntry(name, entry) : undefined;
    if (bundle) {
      try {
        return await run(process.execPath, ['--enable-source-maps', bundle, ...args], options);
      } catch (error) {
        if (error.signal) throw error;
        fallbacks.push(label);
      }
    }
    return run(process.execPath, [...viteNode, viteFile, ...args], options);
  };
  // One signal retry, including a timed-out extra stage. Disk builds keep their early-signal cutoff.
  // Numeric failures retain the bundle -> vite-node fallback, never a signal retry.
  return retrySignal(runOnce, label, retryBefore);
}
// Join running siblings before propagating failure; never orphan them via Promise.all's early rejection.
async function joined(work) {
  const results = await Promise.allSettled(
    work.map((job) =>
      job.catch((error) => {
        stop();
        throw error;
      }),
    ),
  );
  const failed = results.find((result) => result.status === 'rejected');
  if (failed) throw failed.reason;
}
let stopped = false;
function stop() {
  if (!stopped) console.error('Build failed; draining active work. Queued game builds will not be started.');
  stopped = true;
}
if (process.env.GM_SKIP_GAME_BUILD === '1') {
  console.log('Game output generation deferred to the build job.');
  process.exit(0);
}
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
// each game is keyed by the files its build really imports (game-import-keys.mjs), so a game rebuilds only when its own inputs change
const keys = await gameKeys(ids);
// --game <id> (repeatable) builds only those games
const only = process.argv.flatMap((arg, i) => (process.argv[i - 1] === '--game' ? [arg] : []));
const stale = ids.filter(
  (id) =>
    (!only.length || only.includes(id)) &&
    (process.argv.includes('--force') ||
      process.argv.includes('--force-all') ||
      cached?.keys?.[id] !== keys[id] ||
      !cached?.outputs?.[id] ||
      cached.outputs[id] !== outputs(id)),
);
// slowest first keeps the last workers busy; GM_BUILD_JOBS sets the worker count (CI uses every core, a desk keeps two)
const slowFirst = ['depth', 'realm', 'blaster', 'maximus'];
const pending = [
  ...stale.filter((id) => slowFirst.includes(id)).sort((a, b) => slowFirst.indexOf(a) - slowFirst.indexOf(b)),
  ...stale.filter((id) => !slowFirst.includes(id)),
];
// the Sand logo sting is the same in the 17 games that use it and takes about 7 s of ray tracing, so it is
// rendered once per run (in step with the depth frame shards) and the games read the file
const logoFile = join(frames, `sandlogo-${gameSourceHash('games/kit/sandlogo.ts').slice(0, 16)}.fli`);
let logoReady;
function logo() {
  logoReady ??= existsSync(logoFile)
    ? Promise.resolve()
    : (mkdirSync(frames, { recursive: true }),
      runEntry(
        'logo',
        { file: join(root, 'scripts/logo-build-entry.mjs') },
        '../scripts/logo-build-entry.mjs',
        [logoFile],
        {
          cwd: join(root, 'web'),
          maxBuffer: 64 << 20,
          timeout: 240_000,
          killSignal: 'SIGKILL',
        },
        'logo',
        -1, // Optional shared renders keep their existing no-retry behavior.
      ).then(
        () => undefined,
        () => undefined, // a failed shared render only means each game renders its own
      ));
  return logoReady;
}
const jobs = Math.max(1, Math.floor(Number(process.env.GM_BUILD_JOBS)) || (process.env.CI ? availableParallelism() : 2));
const timing = process.argv.includes('--timing') || process.env.GM_BUILD_TIMING === '1';
// --force rebuilds every game; the trinkets and nickels keep their own source keys (manifest.json) and are re-made only when those change, or with --force-all
const forceExtras = process.argv.includes('--force-all');
const times = [];
const scriptBegan = Date.now();
// GM_BUILD_TIMING=1 / --timing: every stage after the games, with its seconds
const stage = (label, since) => {
  if (timing) console.log(`stage ${label}: ${((Date.now() - since) / 1000).toFixed(1)} s (at ${((Date.now() - scriptBegan) / 1000).toFixed(1)} s)`);
};
// the cache records a game as built only once it is; written after every game, so a build stopped
// partway (a CI step timeout) keeps what it finished and the next run picks up from there
const built = new Set();
function save(all = false) {
  // at the end every game counts (as before); partway, only the games built so far
  const fresh = (id) => (all ? !(only.length && !only.includes(id)) : built.has(id));
  writeFileSync(
    cacheFile,
    JSON.stringify({
      keys: Object.fromEntries(ids.map((id) => [id, fresh(id) ? keys[id] : cached?.keys?.[id]])),
      frames,
      outputs: Object.fromEntries(ids.map((id) => [id, all || fresh(id) ? outputs(id) : cached?.outputs?.[id]])),
    }) + '\n',
  );
}
async function worker() {
  for (; !stopped;) {
    // a game that needs the logo waits for it only if no game that doesn't is queued
    const next = pending.findIndex((id) => !logoUsers.has(id));
    const id = pending.splice(logoReady && next >= 0 && !existsSync(logoFile) ? next : 0, 1)[0];
    if (!id) return;
    const secret = JSON.parse(readFileSync(join(games, id, 'about.json'), 'utf8')).secret;
    const started = Date.now();
    try {
      if (id === 'depth') {
        const shards = Array.from({ length: 8 }, (_, i) => i).filter((i) => !existsSync(join(frames, `shard-${i}.json`)));
        async function renderWorker() {
          for (; !stopped;) {
            const shard = shards.shift();
            if (shard === undefined) return;
            await runEntry(
              'depth-frames',
              { file: join(root, 'games/depth/tools/renderFrames.ts') },
              '../games/depth/tools/renderFrames.ts',
              [`${shard}/8`],
              {
                cwd: join(root, 'web'),
                env: { ...process.env, DEPTH_FRAME_CACHE: frames },
                timeout: 240_000,
                killSignal: 'SIGKILL',
                maxBuffer: 64 << 20,
              },
              'depth frames',
              -1,
            );
          }
        }
        // the shards are independent, so a local build with no cached frames uses the cores it has
        await joined(Array.from({ length: Math.min(shards.length, Math.max(2, availableParallelism())) }, renderWorker));
      }
      if (logoUsers.has(id)) await logo();
      if (stopped) return;
      await runEntry(
        id,
        {
          contents: `import ${JSON.stringify(join(games, id, 'build.ts'))};\nawait new Promise((done) => process.stdout.write('', done));\nprocess.exit(0);\n`,
        },
        '../scripts/game-build-entry.mjs',
        [id],
        {
          cwd: join(root, 'web'),
          maxBuffer: 64 << 20,
          timeout: 240_000,
          killSignal: 'SIGKILL',
          env: { ...process.env, GAME_DISK_OUT: '', TEXT_BOUNDS: '', DEPTH_FRAME_CACHE: frames, SANDLOGO_FLI: logoFile },
        },
        secret ? 'a game' : id,
        230_000, // Preserve the existing disk policy: retry only an early signal.
      );
    } catch (error) {
      stop();
      throw new Error(
        secret
          ? 'A game build failed.'
          : `${id}: game build failed (code ${error.code}, signal ${error.signal}, killed ${error.killed}, after ${((Date.now() - started) / 1000).toFixed(0)} s; last step logged: ${
              String(error.stdout ?? '')
                .trim()
                .split('\n')
                .at(-1) || 'none'
            })\n${error.stderr || error.stdout?.slice(-2000) || error.message}`,
      );
    }
    built.add(id);
    save();
    times.push([secret ? 'a game' : id, (Date.now() - started) / 1000]);
    if (!secret) console.log(`Built ${id}${timing ? ` in ${times.at(-1)[1].toFixed(1)} s` : ''}`);
  }
}
// The phone kit's 3D parts (games/year2000/phone/viewer, committed) reach the site beside the trinkets, where the box viewer's
// phone viewer loads them (web/src/desk/boxes/phone/). Copied on every run (about 1.8 MB).
// Two builds: the cheap one (Junior Lab Edition) in phone/, the deluxe one in phone/deluxe/.
for (const [from, to] of [
  ['viewer', 'phone'],
  ['deluxe/viewer', 'phone/deluxe'],
]) {
  const src = join(root, 'games/year2000/phone', from);
  if (!existsSync(join(src, 'parts.json'))) continue;
  const out = join(root, 'web/public/trinkets', to);
  mkdirSync(out, { recursive: true });
  for (const f of ['parts.json', 'parts.bin']) copyFileSync(join(src, f), join(out, f));
}
// The kit's downloads (ZIPs of the printer parts and of the circuit board files, the parts lists, the README the box reads as
// its instructions book) are made beside them (games/kit/phoneDownloads.ts).
if (existsSync(join(root, 'games/year2000/phone/kicad')) && (!only.length || only.includes('year2000'))) {
  const phoneStarted = Date.now();
  await runEntry(
    'phone-downloads',
    { file: join(root, 'games/kit/phoneDownloads.ts') },
    '../games/kit/phoneDownloads.ts',
    [],
    { cwd: join(root, 'web'), maxBuffer: 16 << 20, timeout: 240_000 },
    'phone downloads',
  );
  stage('phone downloads', phoneStarted);
}
const began = Date.now();
// The plastic trinkets of the games that mesh them from distance fields (STL, 3MF and support files the site serves from
// web/public/trinkets/<game>): Depth's from its models, Realm's from its coins and tags. Each is made beside the games
// rather than after them: worker threads of one bundle (games/<game>/tools/trinkets.ts, the shared pipeline of
// web/packages/tools/src/mesh/trinketTool.ts), skipped when already made from the same sources (a key in manifest.json).
// Depth's takes about 15 s of CPU, which the games' own workers share.
const fieldTrinketGames = [
  ['depth', 'Depth'],
  ['realm', 'Realm'],
  ['remote', 'Remote'],
  ['reckoning', 'Reckoning'],
  ['goat', 'Goat'],
  ['teddy3', 'Teddy3'],
  ['sleuth', 'Sleuth'],
  ['smirked', 'Smirked'],
  ['sandcast', 'Sandcast'],
  ['tickle', 'Tickle'],
  ['maximus', 'Maximus'],
  ['year2000', 'Year2000'],
  ['tuneup', 'TuneUp'],
  ['snowbound', 'Snowbound'],
  ['blaster', 'Blaster'],
];
// GM_SKIP_FIELD_TRINKETS=1 leaves them out (the Mac, Windows and Linux download jobs only need the disks).
const trinkets = joined(
  (process.env.GM_SKIP_FIELD_TRINKETS ? [] : fieldTrinketGames)
    .filter(([id]) => ids.includes(id) && (!only.length || only.includes(id)))
    .map(async ([id, name]) => {
      const started = Date.now();
      const made = await runEntry(
        `${id}-trinkets`,
        { file: join(root, `games/${id}/tools/trinkets.ts`) },
        `../games/${id}/tools/trinkets.ts`,
        ['--workers', String(Math.min(3, jobs)), ...(forceExtras ? ['--force'] : [])],
        { cwd: join(root, 'web'), maxBuffer: 16 << 20, timeout: 240_000 },
        `${id}-trinkets`,
      );
      if (timing) console.log(`${name} trinkets: ${made.stdout.trim().split('\n').at(-1)} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
    }),
);
if (pending.some((id) => logoUsers.has(id))) void logo();
const gamesStarted = Date.now();
await joined([trinkets, ...Array.from({ length: Math.min(jobs, pending.length) }, worker), ...(logoReady ? [logoReady] : [])]);
stage('games + field trinkets', gamesStarted);
// The pixel-figure trinkets of the other games (games/kit/pixelTrinkets.ts: web/public/trinkets/<game>/) are meshed from the
// built disks, so they run after the games; each game is skipped when its figures and the mesh code are unchanged (a key
// in its manifest.json), which makes an up-to-date tree cost one process start. A secret game has none.
if (!process.env.GM_SKIP_PIXEL_TRINKETS && (!only.length || only.some((id) => ids.includes(id)))) {
  const started = Date.now();
  const made = await runEntry(
    'pixel-trinkets',
    { file: join(root, 'games/kit/pixelTrinkets.ts') },
    '../games/kit/pixelTrinkets.ts',
    [...(only.length ? ['--game', only.join(',')] : []), ...(forceExtras ? ['--force'] : [])],
    { cwd: join(root, 'web'), maxBuffer: 16 << 20, timeout: 240_000 },
    'pixel trinkets',
  );
  stage('pixel trinkets', started);
  if (timing) console.log(`Pixel trinkets: ${made.stdout.trim().split('\n').length} lines (${((Date.now() - started) / 1000).toFixed(1)} s)`);
}
// The laser wooden nickels (games/kit/laserNickels.ts: SVGs and PNG previews in web/public/laser/<game>/) are drawn from the
// built disks too; a game whose figures, words and builder code are unchanged (a key in its manifest.json) is skipped. A
// secret game has none.
if (!process.env.GM_SKIP_LASER_NICKELS && (!only.length || only.some((id) => ids.includes(id)))) {
  const started = Date.now();
  const made = await runEntry(
    'laser-nickels',
    { file: join(root, 'games/kit/laserNickels.ts') },
    '../games/kit/laserNickels.ts',
    [...(only.length ? ['--game', only.join(',')] : []), ...(forceExtras ? ['--force'] : [])],
    { cwd: join(root, 'web'), maxBuffer: 16 << 20, timeout: 240_000 },
    'laser nickels',
  );
  stage('laser nickels', started);
  if (timing) console.log(`Laser nickels: ${made.stdout.trim().split('\n').length} lines (${((Date.now() - started) / 1000).toFixed(1)} s)`);
}
// Final Curtain's laser Stage Box (games/sleuth/laser/stageBox.ts) writes web/public/laser/sleuth/stage-box/; it is cheap, so it
// is redrawn whenever its game is built.
if (!process.env.GM_SKIP_LASER_NICKELS && (!only.length || only.includes('sleuth')) && ids.includes('sleuth')) {
  await runEntry(
    'laser-stage-box',
    { file: join(root, 'games/sleuth/laser/stageBox.ts') },
    '../games/sleuth/laser/stageBox.ts',
    [],
    { cwd: join(root, 'web'), maxBuffer: 16 << 20, timeout: 240_000 },
    'laser stage box',
  );
}
// Maximus's embroidered patch (games/maximus/patch/build.ts: stitch files, thread list and stitch simulation in
// web/public/laser/maximus/patch/); a few seconds, so it is redone whenever its game is built.
if (!process.env.GM_SKIP_LASER_NICKELS && (!only.length || only.includes('maximus')) && ids.includes('maximus')) {
  await runEntry(
    'maximus-patch',
    { file: join(root, 'games/maximus/patch/build.ts') },
    '../games/maximus/patch/build.ts',
    [],
    { cwd: join(root, 'web'), maxBuffer: 16 << 20, timeout: 240_000 },
    'maximus patch',
  );
}
if (timing)
  console.log(
    `${times.length} games built with ${jobs} workers in ${((Date.now() - began) / 1000).toFixed(1)} s (sum of builds ${times.reduce((n, [, t]) => n + t, 0).toFixed(1)} s)`,
  );
if (fallbacks.length) console.log(`Ran under vite-node (bundle failed): ${fallbacks.join(', ')}`);
save(true);
console.log('Game build outputs are ready.');
