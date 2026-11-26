// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: Kit throws nothing, and the big one pops both small gumdrops by itself.
//   cd web && npx vite-node ../games/who-wins/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { BIG, PIP, STAR } from '../src/monsters';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
const count = (n: number) => sim.w.mm.filter((m) => m.monnum === n).length;
// the lesson needs both pips there at the start, so that "popped both" means something
const startPips = count(PIP);
const startBig = count(BIG);
if (startPips !== 2 || startBig !== 1) {
  console.error(`demoCheck: level 1 should start with 2 pips and the big one; found ${startPips} pips, ${startBig} big`);
  process.exit(1);
}
let stars = 0;
let pops = 0;
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    const before = count(PIP);
    await sim.tick();
    stars += count(STAR);
    const after = count(PIP);
    // a pip gone while the big one still stands is a pop by the big one (no star is ever out)
    if (after < before && count(BIG) === 1) pops += before - after;
  }
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
console.log(`demo: ${startPips} pips at the start, ${pops} popped, ${count(PIP)} left, the big one ${count(BIG) ? 'standing' : 'gone'}, ${stars} star ticks`);
if (pops !== startPips || count(PIP) !== 0 || count(BIG) !== 1 || stars) {
  console.error('demoCheck: expected the big one to pop both pips with no star thrown');
  process.exit(1);
}
console.log('demoCheck ok: the big one popped both pips');
