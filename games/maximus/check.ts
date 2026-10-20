// Plays the built game headlessly and reports problems:
//   cd web && npx vite-node ../games/maximus/check.ts [scene name...]
// - every world: land, wait three seconds (nothing should kill you at the landing site),
//   and the uplink back to orbit is reachable;
// - rover worlds: the rover can drive all the way around the planet;
// - the training deck can be crossed by "hold right, hop when stuck".
import { SCAN } from './common';
import { buildGame } from './game';
import { autoWalk, simFor, standStill } from './verify';

const only = process.argv.slice(2);
const b = buildGame();
const report: string[] = [];
let checked = 0;
for (const info of b.scenes) {
  if (only.length && !only.includes(info.name) && !only.includes(info.file)) continue;
  checked++;
  // landing safety (three random seeds)
  for (const seed of [1, 2, 3]) {
    const sim = simFor(b, info, seed);
    const r = await standStill(sim, 55);
    if (r.dead || r.hp < 70) report.push(`${info.name}: standing at the landing site for 3s leaves ${r.hp} HP${r.dead ? ' (dead)' : ''} [seed ${seed}]`);
  }
  if (info.kind === 'rover') {
    const sim = simFor(b, info, 1);
    await sim.run(5);
    const startX = sim.pos.x;
    let travelled = 0;
    let last = startX;
    sim.press(SCAN.right);
    let stuck = 0;
    for (let t = 0; t < 2400 && travelled < 2000 && !sim.dead; t++) {
      if (t % 8 === 0) sim.press(SCAN.space);
      if (t % 8 === 1) sim.release(SCAN.space);
      await sim.tick();
      let dx = sim.pos.x - last;
      if (dx < -1000) dx += 2000;
      travelled += Math.max(0, dx);
      stuck = dx === 0 ? stuck + 1 : 0;
      last = sim.pos.x;
      if (stuck > 60) break;
      sim.link = -1; // drive past the uplink
    }
    if (travelled < 2000)
      report.push(
        `${info.name}: rover got ${Math.round(travelled / 20)} blocks around the planet (stuck at ${sim.pos.bx},${sim.pos.by}${sim.dead ? ', dead' : ''})`,
      );
  }
  if (info.kind === 'home') {
    const sim = simFor(b, info, 1);
    await sim.run(5);
    const r = await autoWalk(sim, 'right', 1500);
    if (r.link !== 0) report.push(`${info.name}: the training deck bot did not reach the airlock (x ${r.x})`);
  }
}
console.log(`checked ${checked} scenes`);
for (const line of [...b.problems, ...report]) console.log(line);
