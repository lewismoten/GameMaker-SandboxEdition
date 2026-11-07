// npm run dev's game step: start serving at once. When every game already has a built disk/, the
// refresh (scripts/build-games.mjs, minutes when any source changed) runs in the background and
// the dev server picks the new disks up as they land; only a fresh clone with no disks waits for it.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './game-build-inputs.mjs';
const games = join(root, 'games');
const script = join(root, 'scripts/build-games.mjs');
const heavy = join(root, 'scripts/heavy.mjs');
const missing = readdirSync(games).some(
  (id) =>
    existsSync(join(games, id, 'build.ts')) && !(existsSync(join(games, id, 'disk')) && readdirSync(join(games, id, 'disk')).some((n) => /\.gam$/i.test(n))),
);
if (missing) {
  console.log('Some games have no disk yet: building them first.');
  process.exit(spawnSync(process.execPath, [heavy, process.execPath, script], { stdio: 'inherit' }).status ?? 1);
}
const dir = join(root, 'node_modules/.cache');
const pidFile = join(dir, 'games-dev.pid');
const log = join(dir, 'games-dev.log');
mkdirSync(dir, { recursive: true });
let running = false;
try {
  process.kill(Number(readFileSync(pidFile, 'utf8')), 0);
  running = true;
} catch {
  /* none running */
}
if (running) console.log('Games are already refreshing in the background.');
else {
  const fd = openSync(log, 'w');
  const child = spawn(process.execPath, [heavy, process.execPath, script], {
    detached: true,
    env: { ...process.env, GM_BUILD_PROGRESS: '1' },
    stdio: ['ignore', fd, 'inherit'],
  });
  writeFileSync(pidFile, String(child.pid));
  child.unref();
  console.log(`Refreshing game disks in the background (progress: ${log}).`);
}
