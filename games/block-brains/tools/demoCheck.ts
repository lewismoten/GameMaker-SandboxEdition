// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows the level's
// lesson once: the hero bumps a shut gate, then goes through every gate in its turn, alive.
//   cd web && npx vite-node ../games/block-brains/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { playDemoKeys } from './demoReplay';
import { DemoGate } from './demoGate';
import { SCAN } from '../../kit/starter/ids';
import { GATES_ONE, buildLevels, openOf, startOf } from '../src/levels';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url))));
const sim = new GameSim(undefined, 1);
// the hero's left edge in level pixels; the start column is 3 blocks in
const x = () => (sim.pos.x - 10) * 20 + sim.pos.sx;
const lesson = new DemoGate();
const book = buildLevels().levels[0].book;
const first = book.n(startOf('gate0', 3, 0));
const open = book.n(openOf('gate0'));
let far = 0;
const step = async () => {
  await sim.tick();
  if (sim.trail.length !== 1) return;
  far = Math.max(far, x());
  lesson.tick(x(), sim.isHeld(SCAN.right), sim.w.blkmap[first] === open);
};
await playDemoKeys(keys, sim, step);
const through = far > (GATES_ONE[2] + 1) * 20;
console.log(`demo: reached column ${(far / 20).toFixed(1)}; first gate lesson ${lesson.passed}; deaths ${sim.deaths}`);
if (!through || !lesson.passed || sim.deaths) {
  console.error('demoCheck: expected the hero to wait at the first gate, then go through all three, without dying');
  process.exit(1);
}
console.log('demoCheck ok: the demo goes through every gate in its turn');
