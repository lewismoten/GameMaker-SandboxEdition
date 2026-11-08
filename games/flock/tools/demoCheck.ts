// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: the five birds fly right and back while Kit walks under them, and the V they
// started in never changes.
//   cd web && npx vite-node ../games/flock/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { ORIGIN } from '../../kit/starter/map';
import { BIRD } from '../src/monsters';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -1); // the wait before the Esc is kept, the Esc itself is not pressed
const sim = new GameSim(undefined, 1);
/** The birds' positions in level pixels, in the order they were placed. */
const birds = (): { x: number; y: number }[] =>
  sim.w.mm.flatMap((m, i) =>
    m.monnum === BIRD ? [{ x: (sim.w.mi[i].curx[0] - ORIGIN) * 20 + sim.w.mi[i].curx[1], y: (sim.w.mi[i].cury[0] - ORIGIN) * 20 + sim.w.mi[i].cury[1] }] : [],
  );
await sim.tick();
const start = birds();
if (start.length !== 5) throw new Error(`demoCheck: expected five birds, found ${start.length}`);
let drift = 0;
let flown = 0;
let ticks = 0;
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    await sim.tick();
    ticks++;
    const now = birds();
    flown = Math.max(flown, Math.abs(now[0].x - start[0].x));
    now.forEach((b, n) => {
      drift = Math.max(drift, Math.abs(b.x - now[0].x - (start[n].x - start[0].x)), Math.abs(b.y - now[0].y - (start[n].y - start[0].y)));
    });
  }
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
console.log(`demo: ${ticks} ticks, the birds flew ${flown}px and the V drifted ${drift}px at most`);
if (flown < 60 || drift > 2) {
  console.error('demoCheck: expected the birds to fly on while the V holds its shape');
  process.exit(1);
}
console.log('demoCheck ok: the V held while the birds flew');
