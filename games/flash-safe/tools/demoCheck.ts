// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: the hero walks into the first burr and takes exactly one hit (5 hit points), then he
// jumps over the other two without losing more and goes on.
//   cd web && npx vite-node ../games/flash-safe/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
let low = Infinity;
let start = 0;
let stings = 0;
let last = 0;
const step = async () => {
  await sim.tick();
  if (sim.trail.length === 1) {
    start = start || sim.ci.hitpts;
    low = Math.min(low, sim.ci.hitpts);
    if (sim.ci.hitpts < last) stings++;
    last = sim.ci.hitpts;
  }
};
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await step();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 40; i++) await step();
console.log(`demo: lowest hit points ${low} of ${start}, ${stings} sting(s); ${sim.trail.length} scenes entered; score ${sim.ci.score}`);
if (stings !== 1 || start - low !== 5) {
  console.error('demoCheck: expected exactly one 5-point hit from the first burr');
  process.exit(1);
}
console.log('demoCheck ok: one hit from the first burr, then over the others');
