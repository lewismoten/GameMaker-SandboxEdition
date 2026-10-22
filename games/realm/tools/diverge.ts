// Compares the bot's run in the simulator with the walkthrough on the real engine: the scenes
// each enters, in order, and where Pip is when it leaves each (finds where they part ways).
//   cd web && npx vite-node ../games/realm/tools/diverge.ts
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { headlessCanvas, WalkRun } from '../../../web/src/walkthrough/runtime';
import type { Walkthrough } from '../../../web/src/walkthrough/format';
import { diskFiles } from '../../kit/walkthrough';

const here = dirname(fileURLToPath(import.meta.url));
const walk = JSON.parse(readFileSync(join(here, '../walkthrough.json'), 'utf8')) as Walkthrough;
const run = new WalkRun(headlessCanvas(), diskFiles('realm'), 'tuit.gam', walk);
await run.start();
const seen: string[] = [];
let last = -1;
let lastPos = '';
let n = 0;
while ((await run.step(false)) && n < 60) {
  const s = run.session;
  if (!s?.lastWorld) continue;
  const w = s.lastWorld;
  const pos = `${w.chr.x[0]},${w.chr.y[0]}`;
  const sc = s.game.scenes.indexOf(s.game.scenes.find((_, i) => s.game.scenes[i].files[1] === undefined) ?? s.game.scenes[0]);
  void sc;
  const rec = s.rec as unknown as { nextSegment: number; segTicks: number };
  if (rec.nextSegment !== last) {
    seen.push(`seg ${rec.nextSegment} at ${pos} (left ${lastPos})`);
    last = rec.nextSegment;
    n++;
  }
  lastPos = `${pos} t${rec.segTicks}`;
}
console.log(seen.join('\n'));
