// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's lesson: Kit
// walks into the stone tower, which is only a picture, and comes out of its far side without a jump.
//   cd web && npx vite-node ../games/blocks-budget/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { ORIGIN } from '../../kit/starter/map';
import { TOWER_X } from '../src/levels';
import { TOWER } from '../src/pictures';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
const kitX = () => (sim.pos.x - ORIGIN) * 20 + sim.pos.sx;
const kitY = () => (sim.pos.y - ORIGIN) * 20 + sim.pos.sy;
const floor = kitY();
let inside = 0;
let lifted = false;
const step = async () => {
  await sim.tick();
  if (kitX() > (TOWER_X + 1) * 20 && kitX() < (TOWER_X + TOWER.w - 1) * 20) inside++;
  if (kitY() < floor) lifted = true;
};
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await step();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 30; i++) await step();
console.log(`demo: ${inside} ticks inside the tower; ends at column ${(kitX() / 20).toFixed(1)}; jumped ${lifted}`);
const fail = (m: string) => {
  console.error(`demoCheck: ${m}`);
  process.exit(1);
};
if (inside < 20) fail('the demo should walk into the tower');
if (kitX() < (TOWER_X + TOWER.w) * 20) fail('the demo should come out of the tower on its far side');
if (lifted) fail('he should walk through the tower, not jump over it');
console.log('demoCheck ok: walked through the tower picture without a jump');
