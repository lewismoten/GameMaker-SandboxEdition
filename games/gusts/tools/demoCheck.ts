// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: the hero waits in the shaft, the gust lifts him up above the ledge's row and he
// lands on it, and the run loses nothing.
//   cd web && npx vite-node ../games/gusts/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { ORIGIN } from '../../kit/starter/map';
import { LEDGE_ROW } from '../src/levels';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
let top = Infinity;
let lowest = sim.ci.hitpts;
const step = async () => {
  await sim.tick();
  if (sim.trail.length === 1) {
    top = Math.min(top, sim.pos.y - ORIGIN);
    lowest = Math.min(lowest, sim.ci.hitpts);
  }
};
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await step();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 40; i++) await step();
console.log(`demo: highest row ${top}, hit points ${sim.ci.hitpts}, ${sim.trail.length} scenes entered; score ${sim.ci.score}`);
if (top > LEDGE_ROW || lowest !== sim.ci.hitpts) {
  console.error('demoCheck: expected the gust to lift him to the ledge, with nothing lost');
  process.exit(1);
}
console.log('demoCheck ok: the gust lifted him to the ledge');
