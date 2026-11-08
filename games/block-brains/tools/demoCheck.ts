// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows the level's
// lesson once: the hero bumps a shut gate, then goes through every gate in its turn, alive.
//   cd web && npx vite-node ../games/block-brains/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { GATES_ONE } from '../src/levels';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
// the hero's left edge in level pixels; the start column is 3 blocks in
const x = () => (sim.pos.x - 10) * 20 + sim.pos.sx;
let bumped = false;
let far = 0;
let beforeFirst = 0;
const step = async () => {
  await sim.tick();
  if (sim.trail.length !== 1) return;
  far = Math.max(far, x());
  // pressed against the first gate (right beside it, not through)
  if (x() >= (GATES_ONE[0] - 1) * 20 - 6 && x() < GATES_ONE[0] * 20 - 14) beforeFirst++;
  if (beforeFirst >= 6) bumped = true;
};
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await step();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 40; i++) await step();
const through = far > (GATES_ONE[2] + 1) * 20;
console.log(`demo: reached column ${(far / 20).toFixed(1)}; stood at the first gate ${beforeFirst} ticks; deaths ${sim.deaths}`);
if (!through || !bumped || sim.deaths) {
  console.error('demoCheck: expected the hero to wait at the first gate, then go through all three, without dying');
  process.exit(1);
}
console.log('demoCheck ok: the demo goes through every gate in its turn');
