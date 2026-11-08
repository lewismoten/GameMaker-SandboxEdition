// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: the hills, the town and the fence change their blocks at their own rates (one
// picture every 4, 2 and 1 ticks), so the three bands go by at three speeds while Kit stands on the path.
//   cd web && npx vite-node ../games/parallax/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { ORIGIN } from '../../kit/starter/map';
import { FENCE, HILLS, TOWN } from '../src/view';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -1); // the wait before the Esc is kept, the Esc itself is not pressed
const sim = new GameSim(undefined, 1);
const at = (x: number, y: number): number => sim.w.blkmap[sim.w.map[(y + ORIGIN) * 100 + x + ORIGIN]];
const bands = [HILLS, TOWN, FENCE].map((b) => ({ b, last: -1, changes: 0, seen: new Set<number>() }));
let ticks = 0;
await sim.tick();
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    await sim.tick();
    ticks++;
    for (const s of bands) {
      const now = at(6, s.b.row);
      if (s.last >= 0 && now !== s.last) s.changes++;
      s.last = now;
      s.seen.add(now);
    }
  }
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
const [h, t, f] = bands;
console.log(`demo: ${ticks} ticks; block changes hills ${h.changes}, town ${t.changes}, fence ${f.changes}`);
const ok =
  ticks > 200 &&
  Math.abs(h.changes * 4 - ticks) < 12 &&
  Math.abs(t.changes * 2 - ticks) < 12 &&
  Math.abs(f.changes - ticks) < 12 &&
  h.seen.size === 10 &&
  f.seen.size === 5;
if (!ok) {
  console.error('demoCheck: expected the three bands to change every 4, 2 and 1 ticks and each ring to come round');
  process.exit(1);
}
console.log('demoCheck ok: three bands, three speeds');
