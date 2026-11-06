// Builds and runs the Pocket Player's touch-controls test (hardware/pocket-player/host/controlstest.cpp):
// scripted touch events (sliding fingers, two fingers, stylus taps, palm contacts, left-handed layout, the
// key menu) go into src/controls.h and the keys it presses are checked. No board needed.
//   cd web && npx vite-node scripts/pocketControlsCheck.ts
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const here = new URL('../../hardware/pocket-player/', import.meta.url).pathname;
// Card drawing uses the same bounded bands and palette-0 clearing as the firmware.
for (const flags of [[], ['-DPOCKET_CYD28']]) {
  const cardExe = join(mkdtempSync(join(tmpdir(), 'pocket-carddraw-')), 'carddrawtest');
  execFileSync('c++', ['-std=c++17', '-O1', '-Wall', ...flags, '-I', here + 'src', here + 'host/carddrawtest.cpp', '-o', cardExe], { stdio: 'inherit' });
  execFileSync(cardExe, { stdio: 'inherit' });
}
const exe = join(mkdtempSync(join(tmpdir(), 'pocket-controls-')), 'controlstest');
execFileSync('c++', ['-std=c++17', '-O1', '-Wall', '-I', here + 'src', here + 'host/controlstest.cpp', '-o', exe], { stdio: 'inherit' });
const r = spawnSync(exe, { stdio: 'inherit' });
// Run the new one-contact scenarios at the resistive board's actual geometry too.
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
process.exit((r.status ?? 1) || (small.status ?? 1) || (c.status ?? 1) || (d.status ?? 1) || (e.status ?? 1));
