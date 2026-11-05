// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: Plop sits on its crate, Kit breaks the crate, and Plop has dropped into the dip.
//   cd web && npx vite-node ../games/drop-down/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { ORIGIN } from '../../kit/starter/map';
import { GROUND, MON_ROW } from '../src/levels';
import { PLOP } from '../src/monsters';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -1); // the wait before the Esc is kept, the Esc itself is not pressed
const sim = new GameSim(undefined, 1);
/** The row Plop stands in, or undefined when it is not there. */
const row = (): number | undefined => {
  const i = sim.w.mm.findIndex((m) => m.monnum === PLOP);
  return i < 0 ? undefined : sim.w.mi[i].cury[0] - ORIGIN;
};
const first = row();
let ticks = 0;
let last = first;
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    await sim.tick();
    ticks++;
    last = row();
  }
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
console.log(`demo: ${ticks} ticks, Plop started in row ${first} and ended in row ${last}`);
if (first !== MON_ROW || last !== GROUND) {
  console.error(`demoCheck: expected Plop to start on its crate (row ${MON_ROW}) and end in the dip (row ${GROUND})`);
  process.exit(1);
}
console.log('demoCheck ok: the crate broke and Plop dropped');
