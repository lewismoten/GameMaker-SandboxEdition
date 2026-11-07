// Builds and runs the Pocket Player's touch-controls test (hardware/pocket-player/host/controlstest.cpp):
// scripted touch events (sliding fingers, two fingers, stylus taps, palm contacts, left-handed layout, the
// key menu) go into src/controls.h and the keys it presses are checked. No board needed.
//   cd web && npx vite-node scripts/pocketControlsCheck.ts
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const here = new URL('../../hardware/pocket-player/', import.meta.url).pathname;
// Check pad drawing snapshots, hands and turns, plus card redraws, bounded bands and palette-0 clearing.
for (const flags of [[], ['-DPOCKET_CYD28']]) {
  const padExe = join(mkdtempSync(join(tmpdir(), 'pocket-paddraw-')), 'paddrawtest');
  execFileSync('c++', ['-std=c++17', '-O1', '-Wall', ...flags, '-I', here + 'src', here + 'host/paddrawtest.cpp', '-o', padExe], { stdio: 'inherit' });
  execFileSync(padExe, { stdio: 'inherit' });
  const cardExe = join(mkdtempSync(join(tmpdir(), 'pocket-carddraw-')), 'carddrawtest');
  execFileSync('c++', ['-std=c++17', '-O1', '-Wall', ...flags, '-I', here + 'src', here + 'host/carddrawtest.cpp', '-o', cardExe], { stdio: 'inherit' });
  execFileSync(cardExe, { stdio: 'inherit' });
}
// Real play frames (a Starter's level through gmcore.h) with the overlay the board draws (src/overlaydraw.h): both hands,
// three pad sizes, Smaller picture on and off, and the pause menu, at 480x320 and 320x240 (host/playshots.cpp). The
// snapshot is a hash of every cell's picture; PNGs go to GM_PLAYSHOTS_OUT (default: a temp folder). After a deliberate
// change to the overlay or to those Starters, look at the PNGs, then paste the printed hashes here.
const playHashes: Record<string, string> = { '480': '2882dc1b1558ef6e', '320': '9184b780cf604e91' };
const playDir = process.env.GM_PLAYSHOTS_OUT ?? mkdtempSync(join(tmpdir(), 'pocket-playshots-'));
let playBad = 0;
for (const [name, flags] of [
  ['480', []],
  ['320', ['-DPOCKET_CYD28']],
] as const) {
  const exe = join(mkdtempSync(join(tmpdir(), 'pocket-playshots-exe-')), 'playshots' + name);
  execFileSync('c++', ['-std=c++17', '-O1', '-Wall', ...flags, '-I', here + 'src', here + 'host/playshots.cpp', '-lz', '-o', exe], { stdio: 'inherit' });
  const out = execFileSync(exe, [here + 'data', playDir], { maxBuffer: 1 << 24 }).toString();
  const got = createHash('sha256').update(out).digest('hex').slice(0, 16);
  if (got !== playHashes[name]) {
    playBad = 1;
    console.log(out + `playshots ${name}: snapshot ${got} differs from ${playHashes[name]}`);
  } else console.log(`playshots ${name}: ${out.split('\n').filter((l) => l.startsWith('SHOT')).length} frames match (${playDir})`);
}
const exe = join(mkdtempSync(join(tmpdir(), 'pocket-controls-')), 'controlstest');
execFileSync('c++', ['-std=c++17', '-O1', '-Wall', '-I', here + 'src', here + 'host/controlstest.cpp', '-o', exe], { stdio: 'inherit' });
const r = spawnSync(exe, { stdio: 'inherit' });
// Run held arrow -> Space -> arrow and jump-wedge slides, both hands, with edge hysteresis
// at the resistive board's actual geometry. The large build also checks GT911 ownership.
const smallExe = exe + '-small';
execFileSync('c++', ['-std=c++17', '-O1', '-Wall', '-DPOCKET_CYD28', '-I', here + 'src', here + 'host/controlstest.cpp', '-o', smallExe], { stdio: 'inherit' });
const small = spawnSync(smallExe, { stdio: 'inherit' });
// the resistive touch calibration (src/touchcal.h) for the 2.8 inch board
const calExe = join(mkdtempSync(join(tmpdir(), 'pocket-touchcal-')), 'touchcaltest');
execFileSync('c++', ['-std=c++17', '-O1', '-Wall', '-I', here + 'src', here + 'host/touchcaltest.cpp', '-o', calExe], { stdio: 'inherit' });
const c = spawnSync(calExe, { stdio: 'inherit' });
// the display setup screen's layout, corner-tap touch mapping and saved record (src/displaysetup.h)
const setupExe = join(mkdtempSync(join(tmpdir(), 'pocket-setup-')), 'setuptest');
execFileSync('c++', ['-std=c++17', '-O1', '-Wall', '-I', here + 'src', here + 'host/setuptest.cpp', '-o', setupExe], { stdio: 'inherit' });
const d = spawnSync(setupExe, { stdio: 'inherit' });
// the setup screens drawn into a frame buffer: four different flips per round, margins, PNG-able shots (host/setupshots.cpp)
const shotsDir = mkdtempSync(join(tmpdir(), 'pocket-shots-'));
const shotsExe = join(shotsDir, 'setupshots');
execFileSync('c++', ['-std=c++17', '-O1', '-Wall', '-I', here + 'src', here + 'host/setupshots.cpp', '-o', shotsExe], { stdio: 'inherit' });
const e = spawnSync(shotsExe, [shotsDir], { stdio: 'inherit', cwd: here });
// The six-thumbnail picker uses real packed title pictures, with bounded metadata/cache and RAM tests.
const libraryExe = join(shotsDir, 'librarytest');
execFileSync('c++', ['-std=c++17', '-O1', '-Wall', '-I', here + 'src', here + 'host/librarytest.cpp', '-lz', '-o', libraryExe], { stdio: 'inherit' });
const library = spawnSync(libraryExe, [here + 'data', shotsDir], { stdio: 'inherit' });
process.exit(playBad || (library.status ?? 1) || (r.status ?? 1) || (small.status ?? 1) || (c.status ?? 1) || (d.status ?? 1) || (e.status ?? 1));
