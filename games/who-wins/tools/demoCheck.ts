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
let stars = 0;
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    await sim.tick();
    stars += count(STAR);
  }
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
console.log(`demo: ${count(PIP)} pips left, the big one ${count(BIG) ? 'standing' : 'gone'}, ${stars} star ticks`);
if (count(PIP) !== 0 || count(BIG) !== 1 || stars) {
  console.error('demoCheck: expected the big one to pop both pips with no star thrown');
  process.exit(1);
}
console.log('demoCheck ok: the big one popped both pips');
