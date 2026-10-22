// Saves screens from the walkthrough as it runs on the real engine (in Node): one every few
// seconds, as PNGs scaled up, for picking screenshots.
//   cd web && npx vite-node ../games/realm/tools/frames.ts <outdir> [every seconds = 10]
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { headlessCanvas, WalkRun } from '../../../web/src/walkthrough/runtime';
import { WALKTHROUGH_FPS, type Walkthrough } from '../../../web/src/walkthrough/format';
import { diskFiles } from '../../kit/walkthrough';
import { Pixels } from '../../kit/pixels';
import { writePng } from '../../kit/png';

const out = process.argv[2] ?? '/tmp/realm-frames';
const every = Number(process.argv[3] ?? 10);
mkdirSync(out, { recursive: true });
const here = dirname(fileURLToPath(import.meta.url));
const walk = JSON.parse(readFileSync(join(here, '../walkthrough.json'), 'utf8')) as Walkthrough;
const files = diskFiles('realm');
const run = new WalkRun(headlessCanvas(), files, 'tuit.gam', walk);
await run.start();
let n = 0;
while (await run.step(false)) {
  if (run.frame % (every * WALKTHROUGH_FPS) !== 0) continue;
  const p = new Pixels(320, 200);
  p.px.set(run.m.screen.pixels.subarray(0, 64000));
  const sec = Math.round(run.frame / WALKTHROUGH_FPS);
  writePng(join(out, `f${String(sec).padStart(5, '0')}.png`), p, run.m.screen.palette, 2);
  n++;
}
console.log(`${n} frames`);
