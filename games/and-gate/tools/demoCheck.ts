// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: Kit bumps the first dial on, a spark runs the wire and dies at the dial that is
// still off, and the lamp stays dark; then he bumps the second dial and the lamp lights.
//   cd web && npx vite-node ../games/and-gate/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { ORIGIN } from '../../kit/starter/map';
import { inScreenBounds } from '@lewismoten/gamemaker-sandbox-engine/engine/touch';
import { DIAL_OFF, DIAL_ON, FALLING, LAMP, LIGHT, SPARK } from '../src/monsters';
import { DemoLesson } from './demoLesson';
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
const lesson = new DemoLesson();
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    await sim.tick();
    ticks++;
    const xs = sparkX();
    if (firstOn < 0 && alive(DIAL_ON) === 1) firstOn = ticks;
    if (alive(DIAL_OFF) === 1 && firstOn > 0) furthest = Math.max(furthest, ...xs);
    if (stoppedAt < 0 && furthest > 14 && !xs.some((x) => x > 14)) stoppedAt = ticks;
    const sparkAtLamp = sim.w.mm.some((m, i) => {
      const mi = sim.w.mi[i];
      return m.monnum === SPARK && Math.abs(mi.curx[0] - ORIGIN + mi.curx[1] / 20 - 23) < 1 && Math.abs(mi.cury[0] - ORIGIN + mi.cury[1] / 20 - 1) < 1;
    });
    const lightVisible = sim.w.mm.some((m, i) => (m.monnum === FALLING || m.monnum === LIGHT) && inScreenBounds(sim.w.mi[i].scrPos));
    lesson.observe({ tick: ticks, stoppedAt, dialsOn: alive(DIAL_ON), dialsOff: alive(DIAL_OFF), lamp: alive(LAMP) > 0, sparkAtLamp, lightVisible });
  }
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
console.log(
  `demo: ${ticks} ticks; first dial on at ${firstOn}; a spark died at the dial that was off (it got to ${furthest.toFixed(1)}) by ${stoppedAt}; lamp lit at ${lesson.litAt}; light visible at ${lesson.visibleAt}; dials off now ${alive(DIAL_OFF)}`,
);
if (firstOn < 0 || stoppedAt < 0 || furthest > 17.3 || furthest < 15)
  throw new Error('demoCheck: expected one dial on and a spark dying at the dial that is off');
if (lesson.litAt < 0 || lesson.visibleAt < 0 || alive(DIAL_OFF) !== 0)
  throw new Error('demoCheck: expected a spark to light the lamp with both dials on after the first spark died, and its light visible');
console.log('demoCheck ok: a spark died at the off dial, then both dials on lit the lamp');
