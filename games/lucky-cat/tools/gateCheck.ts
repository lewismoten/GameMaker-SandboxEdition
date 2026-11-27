// Built-disk bell clocks: both gate schedules, compact strips synchronized for two cycles,
// and at least one complete strip inside the cropped DOS view on every walkthrough frame.
//   cd web && npx vite-node ../games/lucky-cat/tools/gateCheck.ts
import { fileURLToPath } from 'node:url';
import { parseGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { inViewOfGame, type InViewRule } from '../../kit/inView';
import { FOUR, METER_ROW } from '../src/levels/four';
import { MARKET } from '../src/levels/market';
import { buildLevels } from '../src/levels';
import { BELLS, OPEN_TICKS, SHUT_TICKS } from '../src/meter';
import { GameSim } from './sim';

const { levels } = buildLevels();
const files = readDisk(fileURLToPath(new URL('../disk', import.meta.url)));
const rules: InViewRule[] = [];
for (const [scene, gateX, openTicks] of [
  [12, FOUR.gate, OPEN_TICKS],
  [15, MARKET.gates[0], MARKET.openTicks],
]) {
  const l = levels[scene - 2];
  const book = l.book;
  const game = parseGame(files.get('lucky.gam')!);
  game.scenes[0].links[0].toScene = scene;
  game.scenes[0].links[0].to = { x: 3 + ORIGIN, y: 9 + ORIGIN };
  const disk = new Map(files);
  disk.set('lucky.gam', serializeGame(game));
  const sim = new GameSim(disk, 1);
  const bot = new StarterBot(sim);
  const at = (x: number, y: number) => sim.w.blkmap[sim.w.map[(y + ORIGIN) * MLEN + x + ORIGIN]];
  const strips = [...l.map.done().blocks.entries()]
    .filter(([, n]) => n === book.n('bellStrip0'))
    .map(([at]) => [at % MLEN, Math.floor(at / MLEN), 1, 1] as [number, number, number, number]);
  rules.push({ scene, rects: strips });
  const [sx, sy] = strips[0];
  for (let tick = 0; tick < 2 * (openTicks + SHUT_TICKS); tick++) {
    const phase = tick % (openTicks + SHUT_TICKS);
    const dark = Math.min(BELLS, Math.floor((phase * BELLS) / openTicks));
    for (let j = 0; j < BELLS; j++) {
      const expected = j < dark ? `bellOff${j}` : `bellOn${j}`;
      if (at(5 + j, METER_ROW) !== book.n(expected)) throw new Error(`${l.title}: expected ${expected} at tick ${sim.ticks}`);
    }
    if (at(sx - ORIGIN, sy - ORIGIN) !== book.n(`bellStrip${dark}`)) throw new Error(`${l.title}: strip out of sync at tick ${sim.ticks}`);
    if ((at(gateX, 8) === book.n('gateShut')) !== (dark === BELLS)) throw new Error(`${l.title}: gate out of sync at tick ${sim.ticks}`);
    await bot.wait(1);
  }
  console.log(`gateCheck: ${l.title}: strip and gate synchronized for two cycles; open ${openTicks}, shut ${SHUT_TICKS} ticks`);
}
for (const r of await inViewOfGame('lucky-cat', rules)) {
  if (!r.frames) throw new Error(`gateCheck: s${r.scene}: walkthrough never reached the meter`);
  if (r.missed.length) throw new Error(`gateCheck: s${r.scene}: no whole strip visible on ${r.missed.length}/${r.frames} frames (first ${r.missed[0]})`);
  console.log(`gateCheck: s${r.scene}: a complete strip visible on all ${r.frames} walkthrough world frames`);
}
