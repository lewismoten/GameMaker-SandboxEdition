// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: the bar goes dark and the gate shuts with the hero still outside, the clock door
// starts the level again, and the second go gets through in time. It prints what it saw.
//   cd web && npx vite-node ../games/beat-the-clock/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { buildLevels } from '../src/levels';
import { GameSim } from './sim';

const { levels } = buildLevels();
const l = levels[0];
const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
const shut = () => sim.w.blkmap[l.book.n('gate.open.top.m')] === l.book.n('gate.shut.top.m');
const seen: string[] = [];
let wasShut = false;
const step = async () => {
  await sim.tick();
  if (shut() !== wasShut) {
    wasShut = shut();
    seen.push(`${wasShut ? 'gate shut' : 'gate open'} at ${sim.ticks}`);
  }
};
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await step();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 40; i++) await step();
console.log(`demo: ${seen.join(', ')}; ${sim.trail.length} scenes entered; score ${sim.ci.score}`);
if (seen.length < 2 || !seen[0].startsWith('gate shut') || !seen[1].startsWith('gate open')) {
  console.error('demoCheck: expected the gate to shut, then (after the clock door) the level to start with it open');
  process.exit(1);
}
if (sim.trail.length < 3) {
  console.error('demoCheck: expected the clock door and then the exit (three scenes entered)');
  process.exit(1);
}
console.log('demoCheck ok: ran out of time once, tried again, got through');
