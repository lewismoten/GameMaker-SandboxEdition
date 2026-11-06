// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: Puff starts away from Kit, falls behind while he runs ahead, and is back at his side
// when he stops.
//   cd web && npx vite-node ../games/follower/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { ORIGIN } from '../../kit/starter/map';
import { PUFF } from '../src/monsters';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -1); // the wait before the Esc is kept, the Esc itself is not pressed
const sim = new GameSim(undefined, 1);
/** How many pixels apart Puff and Kit are across, or undefined when Puff is not there. */
const gap = (): number | undefined => {
  const i = sim.w.mm.findIndex((m) => m.monnum === PUFF);
  if (i < 0) return undefined;
  const m = sim.w.mi[i];
  const kit = (sim.pos.x - ORIGIN) * 20 + sim.pos.sx;
  return Math.abs((m.curx[0] - ORIGIN) * 20 + m.curx[1] - kit);
};
let widest = 0;
let last: number | undefined = 0;
let movedAt = 0;
let ticks = 0;
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    await sim.tick();
    ticks++;
    last = gap();
    if (last !== undefined) widest = Math.max(widest, last);
  }
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
  movedAt = ticks;
}
console.log(`demo: ${ticks} ticks, Puff got ${widest}px from Kit at most and ended ${last}px away (last key at ${movedAt})`);
if (last === undefined || widest < 60 || last > 40) {
  console.error('demoCheck: expected Puff to fall behind while Kit runs and to be at his side at the end');
  process.exit(1);
}
console.log('demoCheck ok: Puff fell behind and caught up');
