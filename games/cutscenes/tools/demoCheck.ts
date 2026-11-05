// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: the hero walks to the stage's right-hand wall (a wall is not a way out) and the
// demo ends on the stage, with the floor still shut. It prints what it saw.
//   cd web && npx vite-node ../games/cutscenes/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { ORIGIN } from '../../kit/starter/map';
import { WIDTH_STAGE, buildLevels } from '../src/levels';
import { GameSim } from './sim';

const { book } = buildLevels();
const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
const heroX = () => (sim.pos.x - ORIGIN) * 20 + sim.pos.sx;
const floorShut = () => sim.w.blkmap[book.n('trap.shut')] === book.n('trap.shut');
let farthest = 0;
const step = async () => {
  await sim.tick();
  farthest = Math.max(farthest, heroX());
};
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await step();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 20; i++) await step();
console.log(
  `demo: the hero got to x ${farthest} of ${(WIDTH_STAGE - 1) * 20}; the floor is ${floorShut() ? 'still shut' : 'open'}; ${sim.trail.length} scenes entered`,
);
if (farthest < (WIDTH_STAGE - 3) * 20) {
  console.error('demoCheck: expected the hero to walk across to the right-hand wall');
  process.exit(1);
}
if (!floorShut() || sim.trail.length !== 1) {
  console.error('demoCheck: expected the demo to end with the hero still on the shut stage floor');
  process.exit(1);
}
console.log('demoCheck ok: walked across the stage to the wall, which is not a way out');
