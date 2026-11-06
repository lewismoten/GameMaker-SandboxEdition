// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: the hero stands still on the sand until it gives way and drops into the hole a block
// deep, and the run loses nothing.
//   cd web && npx vite-node ../games/quicksand/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { ORIGIN } from '../../kit/starter/map';
import { GROUND_ONE } from '../src/levels';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
let low = -Infinity;
let lowest = sim.ci.hitpts;
const step = async () => {
  await sim.tick();
  if (sim.trail.length === 1) {
    low = Math.max(low, sim.pos.y - ORIGIN);
    lowest = Math.min(lowest, sim.ci.hitpts);
  }
};
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await step();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 40; i++) await step();
console.log(`demo: lowest row ${low}, hit points ${sim.ci.hitpts}, ${sim.trail.length} scenes entered; score ${sim.ci.score}`);
if (low !== GROUND_ONE || lowest !== sim.ci.hitpts) {
  console.error('demoCheck: expected the sand to give way and drop her into the hole, with nothing lost');
  process.exit(1);
}
console.log('demoCheck ok: the sand gave way and she dropped into the hole');
