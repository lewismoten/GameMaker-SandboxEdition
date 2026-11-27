// Real engine frames (renderWorld, as PLAYGAME draws) of each score change: a strip of the
// ticks after Kit touches a coin, gem or box, one PNG per pickup, so the popups can be looked at.
//   cd web && npx vite-node ../games/popups/tools/frames.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { Screen } from '@lewismoten/gamemaker-sandbox-engine/gfx/screen';
import { renderWorld } from '@lewismoten/gamemaker-sandbox-engine/engine/render';
import { headlessCanvas } from '../../../web/src/walkthrough/runtime';
import { StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { play } from './play';
import { GameSim } from './sim';

const out = process.argv[2];
if (!out) throw new Error('usage: frames.ts <outDir>');
mkdirSync(out, { recursive: true });
const screen = new Screen(headlessCanvas());
const grab = (sim: GameSim): Uint8Array => {
  screen.setPalette(sim.files.get(sim.game.scenes[sim.scene].files[0]) ?? sim.w.palette);
  renderWorld(screen, sim.w);
  return Uint8Array.from(screen.pixels);
};
const pal = (sim: GameSim): Uint8Array => sim.files.get(sim.game.scenes[sim.scene].files[0]) ?? sim.w.palette;

/** Walks right from where Kit is; at each score change, shots every `gap` ticks, `n` of them, as one strip. */
async function strips(sim: GameSim, name: string, stop: number, payouts: number[], gap = 5, n = 8): Promise<void> {
  let k = 0;
  let last = sim.ci.score;
  sim.press(SCAN.right);
  for (let t = 0; t < 1500 && sim.pos.x < stop; t++) {
    await sim.tick();
    if (sim.ci.score === last) continue;
    const paid = sim.ci.score - last;
    if (paid !== payouts[k]) throw new Error(`${name} pickup ${k + 1}: score changed by ${paid}, expected ${payouts[k]}`);
    last = sim.ci.score;
    sim.release(SCAN.right);
    const shots: Uint8Array[] = [];
    for (let i = 0; i < n; i++) {
      shots.push(grab(sim));
      for (let j = 0; j < gap; j++) await sim.tick();
    }
    // crop to the 100 x 120 pixels around Kit in each shot
    const cx = Math.max(0, Math.min(320 - 120, sim.pos.sx - 40));
    const p = new Pixels(120 * n, 120, 0);
    shots.forEach((s, i) => {
      for (let y = 0; y < 120; y++) for (let x = 0; x < 120; x++) p.px[y * 120 * n + i * 120 + x] = s[(y + 40) * 320 + cx + x];
    });
    writePng(join(out, `${name}-${++k}-score${last}.png`), p, pal(sim), 3);
    console.log(`${name} shot ${k}: score ${last}, ${sim.w.mm.filter((m) => m.monnum < 255).length} monsters`);
    sim.press(SCAN.right);
  }
  sim.release(SCAN.right);
  if (k !== payouts.length) throw new Error(`${name}: captured ${k} of ${payouts.length} score changes`);
}

const first = new GameSim(undefined, 1);
await new StarterBot(first).wait(8);
await strips(first, 'l1', 44, [10, 10, 100, 100, 100]);
const { sim: second } = await play(1, 1);
await strips(second, 'l2', 45, [200, 500, 100, 100]);
