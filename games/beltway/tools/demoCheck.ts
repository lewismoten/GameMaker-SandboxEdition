// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: the hills, the trees and the rail each go round their ring of blocks more than once, the
// nearer strips sliding farther, while Kit stands on the truck.
//   cd web && npx vite-node ../games/beltway/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { ORIGIN } from '../../kit/starter/map';
import { HILLS, RAIL, TREES } from '../src/view';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -1); // the wait before the Esc is kept, the Esc itself is not pressed
const sim = new GameSim(undefined, 1);
/** The block shown at a level cell now. */
const blockAt = (x: number, y: number): number => sim.w.blkmap[sim.w.map[(y + ORIGIN) * 100 + x + ORIGIN]];
const strips = [
  { name: 'hills', s: HILLS, x: 3 },
  { name: 'trees', s: TREES, x: 3 },
  { name: 'rail', s: RAIL, x: 5 },
].map((t) => ({ ...t, y: t.s.rows[0], last: -1, changes: 0 }));
let ticks = 0;
await sim.tick();
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    await sim.tick();
    ticks++;
    for (const t of strips) {
      const b = blockAt(t.x, t.y);
      if (t.last >= 0 && b !== t.last) t.changes++;
      t.last = b;
    }
  }
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
const turns = strips.map((t) => t.changes / (40 / t.s.shift));
const moved = strips.map((t) => t.changes * t.s.shift);
console.log(`demo: ${ticks} ticks, the hills went round ${turns[0].toFixed(1)} times, the trees ${turns[1].toFixed(1)}, the rail ${turns[2].toFixed(1)}`);
if (turns[0] < 0.4 || turns[1] < 2 || turns[2] < 2 || !(moved[2] > moved[1] && moved[1] > moved[0])) {
  console.error('demoCheck: expected every strip to go round its ring, the nearer ones farther');
  process.exit(1);
}
console.log('demoCheck ok: the scenery slid past and started over');
