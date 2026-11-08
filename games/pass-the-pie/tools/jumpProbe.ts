// A probe (never on the disk): how high and how far the hero jumps on this disk, standing and running.
//   cd web && npx vite-node ../games/pass-the-pie/tools/jumpProbe.ts
import { GameSim } from './sim';

const SPACE = 57;
const py = (s: GameSim) => s.pos.y * 20 + s.pos.sy;
const px = (s: GameSim) => s.pos.x * 20 + s.pos.sx;
const RIGHT = 77;
for (const run of [false, true]) {
  const sim = new GameSim(undefined, 1);
  for (let i = 0; i < 40; i++) await sim.tick();
  const y0 = py(sim);
  const x0 = px(sim);
  if (run) sim.press(RIGHT);
  for (let i = 0; i < 6; i++) await sim.tick();
  const xs = px(sim);
  sim.press(SPACE);
  let top = y0;
  let t = 0;
  for (; t < 80; t++) {
    await sim.tick();
    if (t === 2) sim.release(SPACE);
    top = Math.min(top, py(sim));
    if (t > 4 && py(sim) >= y0) break;
  }
  sim.releaseAll();
  console.log(`${run ? 'running' : 'standing'}: rose ${y0 - top} px, airborne ${t} ticks, went ${px(sim) - xs} px (from ${x0})`);
}
