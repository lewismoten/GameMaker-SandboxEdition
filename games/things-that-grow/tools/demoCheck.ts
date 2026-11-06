// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: the nest on the shelf hatches a bird while Kit stands under it.
//   cd web && npx vite-node ../games/things-that-grow/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { BIRD } from '../src/monsters';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
const count = (n: number) => sim.w.mm.filter((m) => m.monnum === n).length;
let first = -1;
let most = 0;
let tick = 0;
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    await sim.tick();
    tick++;
    if (first < 0 && count(BIRD) > 0) first = tick;
    most = Math.max(most, count(BIRD));
  }
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
console.log(`demo: first bird at tick ${first}, most at once ${most}, ${tick} ticks`);
if (first < 0) {
  console.error('demoCheck: expected the nest to hatch a bird while the demo plays');
  process.exit(1);
}
console.log('demoCheck ok: the nest hatched a bird');
