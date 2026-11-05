// How much of the flock the real engine's camera shows while the bot plays: per level, the share of ticks with
// every bird fully on screen, and with at least one bird on screen. Run after a build.
//   cd web && npx vite-node ../games/flock/tools/viewCheck.ts
import { join } from 'node:path';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { Screen } from '@lewismoten/gamemaker-sandbox-engine/gfx/screen';
import { renderWorld } from '@lewismoten/gamemaker-sandbox-engine/engine/render';
import { headlessCanvas } from '../../../web/src/walkthrough/runtime';
import { BIRD, QUICK } from '../src/monsters';
import { ORIGIN } from '../../kit/starter/map';
import { oneShape, outOfStep } from './route';
import { StarterBot } from '../../kit/starter/bot';
import { playLevels } from '../../kit/levelRun';
import { GameSim } from './sim';

const sim = new GameSim(undefined, 1);
const stats = new Map<number, { n: number; all: number; some: number }>();
const orig = sim.tick.bind(sim);
sim.tick = async () => {
  const r = await orig();
  const w = sim.w;
  const level = sim.scene;
  const ys: number[] = [];
  w.mm.forEach((m, i) => {
    if (m.monnum !== BIRD && m.monnum !== QUICK) return;
    const mi = w.mi[i];
    const sy = (mi.cury[0] - w.my) * 20 + mi.cury[1] - w.scroll.ny - w.scroll.littleShifty;
    const sx = (mi.curx[0] - w.mx) * 20 + mi.curx[1] - w.scroll.nx - w.scroll.littleShiftx;
    ys.push(sx >= 0 && sx + 20 <= 320 ? sy : -999);
  });
  if (ys.length && process.env.VIEW_SHOTS && (stats.get(level)?.n ?? 0) === Number(process.env.VIEW_TICK ?? 60)) {
    const screen = new Screen(headlessCanvas());
    const pal = sim.files.get(sim.game.scenes[level].files[0]) ?? w.palette;
    screen.setPalette(pal);
    renderWorld(screen, w);
    const p = new Pixels(320, 200);
    p.px.set(screen.pixels);
    writePng(join(process.env.VIEW_SHOTS, `level${level - 1}.png`), p, pal, 3);
  }
  if (ys.length) {
    const s = stats.get(level) ?? { n: 0, all: 0, some: 0 };
    s.n++;
    if (ys.every((y) => y >= 0 && y + 20 <= 200)) s.all++;
    if (ys.some((y) => y >= 0 && y + 20 <= 200)) s.some++;
    stats.set(level, s);
  }
  return r;
};
await playLevels(new StarterBot(sim), [oneShape, outOfStep], 2);
void ORIGIN;
for (const [lv, s] of stats)
  console.log(
    `scene ${lv}: ${s.n} ticks, all five birds in view ${((100 * s.all) / s.n).toFixed(0)}%, some bird in view ${((100 * s.some) / s.n).toFixed(0)}%`,
  );
