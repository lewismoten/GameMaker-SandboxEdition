// Records DEMO.REC: the bot rolls the start of the Checkerboard in the simulator (photons, the
// first focus ring, the red lens) and its keys are written into src/demo.ts.
//   cd web && npx vite-node ../games/depth/tools/gendemo.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Bot } from './bot';
import { ROUTES, playSteps } from './route';
import { GameSim } from './sim';

const sim = new GameSim(undefined, 1);
const bot = new Bot(sim);
// photons, ring 1, the red lens, the green lens
await playSteps(bot, 0, ROUTES[0].slice(0, 4));
await bot.wait(20);
sim.releaseAll();
// the play from the first scene on, as one stream of keys: each scene's keys count from the
// tick play entered it, so the scenes before add their ticks to the next scene's first key
const out: number[] = [];
let carry = 0;
sim.segments.forEach((seg, i) => {
  let first = true;
  for (const k of seg.keys) {
    out.push(k.delta + (first ? carry : 0), k.key);
    carry = 0;
    first = false;
  }
  // ticks this scene ran past its last key (the card scene runs one)
  const used = seg.keys.reduce((s, k) => s + k.delta, 0);
  const ran = i < sim.segments.length - 1 ? sceneTicks(i) : used;
  carry += ran - used;
});
function sceneTicks(i: number): number {
  return sim.segmentTicks[i] ?? 0;
}
const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, '..', 'src', 'demo.ts');
const src = readFileSync(file, 'utf8').replace(/const RECORDED: number\[\] = \[[^\]]*\];/, `const RECORDED: number[] = [${out.join(', ')}];`);
writeFileSync(file, src);
console.log(`${out.length / 2} key events; scenes ${sim.trail.join(' ')}`);
