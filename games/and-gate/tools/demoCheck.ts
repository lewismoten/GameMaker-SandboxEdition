// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: Kit bumps the first dial on, a spark runs the wire and dies at the dial that is
// still off, and the lamp stays dark; then he bumps the second dial and the lamp lights.
//   cd web && npx vite-node ../games/and-gate/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { ORIGIN } from '../../kit/starter/map';
import { DIAL_OFF, DIAL_ON, LAMP, SPARK } from '../src/monsters';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -1); // the wait before the Esc is kept, the Esc itself is not pressed
const sim = new GameSim(undefined, 1);
const alive = (n: number) => sim.w.mm.filter((m) => m.monnum === n).length;
/** The columns (in level blocks) of every spark alive. */
const sparkX = (): number[] => sim.w.mm.flatMap((m, i) => (m.monnum === SPARK ? [sim.w.mi[i].curx[0] - ORIGIN + sim.w.mi[i].curx[1] / 20] : []));
let ticks = 0;
let furthest = 0;
let firstOn = -1;
let stoppedAt = -1;
let lit = -1;
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    await sim.tick();
    ticks++;
    const xs = sparkX();
    if (firstOn < 0 && alive(DIAL_ON) === 1) firstOn = ticks;
    if (alive(DIAL_OFF) === 1 && firstOn > 0) furthest = Math.max(furthest, ...xs);
    if (stoppedAt < 0 && furthest > 14 && !xs.some((x) => x > 14)) stoppedAt = ticks;
    if (lit < 0 && alive(LAMP) === 0) lit = ticks;
  }
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
console.log(
  `demo: ${ticks} ticks; first dial on at ${firstOn}; a spark died at the dial that was off (it got to ${furthest.toFixed(1)}) by ${stoppedAt}; lamp lit at ${lit}; dials off now ${alive(DIAL_OFF)}`,
);
if (firstOn < 0 || stoppedAt < 0 || furthest > 17.3 || furthest < 15)
  throw new Error('demoCheck: expected one dial on and a spark dying at the dial that is off');
if (lit < 0 || alive(DIAL_OFF) !== 0) throw new Error('demoCheck: expected the second dial on and the lamp lit by the end');
console.log('demoCheck ok: a spark died at the off dial, then both dials on lit the lamp');
