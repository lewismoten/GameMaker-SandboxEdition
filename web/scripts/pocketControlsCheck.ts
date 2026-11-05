// Builds and runs the Pocket Player's touch-controls test (hardware/pocket-player/host/controlstest.cpp):
// scripted touch events (sliding fingers, two fingers, stylus taps, palm contacts, left-handed layout, the
// key menu) go into src/controls.h and the keys it presses are checked. No board needed.
//   cd web && npx vite-node scripts/pocketControlsCheck.ts
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const here = new URL('../../hardware/pocket-player/', import.meta.url).pathname;
const exe = join(mkdtempSync(join(tmpdir(), 'pocket-controls-')), 'controlstest');
execFileSync('c++', ['-std=c++17', '-O1', '-Wall', '-I', here + 'src', here + 'host/controlstest.cpp', '-o', exe], { stdio: 'inherit' });
const r = spawnSync(exe, { stdio: 'inherit' });
process.exit(r.status ?? 1);
