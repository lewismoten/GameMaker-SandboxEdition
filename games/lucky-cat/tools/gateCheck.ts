// Race to the Fair's clock on the built disk: the gate is open at the start, shut once the last bell has gone dark,
// and open again after the shut spell, with the bells lit again; and the bells go dark one at a time.
//   cd web && npx vite-node ../games/lucky-cat/tools/gateCheck.ts
import { StarterBot } from '../../kit/starter/bot';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { ORIGIN } from '../../kit/starter/map';
import { FOUR, METER_ROW } from '../src/levels/four';
import { buildLevels } from '../src/levels';
import { BELLS, CYCLE, OPEN_TICKS } from '../src/meter';
import { LEVELS } from './play';
import { GameSim } from './sim';

const { levels } = buildLevels();
const fair = levels.findIndex((l) => l.file === 'four');
const book = levels[fair].book;
const sim = new GameSim(undefined, 1);
const bot = new StarterBot(sim);
for (const level of LEVELS.slice(0, fair)) await level(bot);
if (sim.ticks > 3) await bot.wait(1);
// the map keeps the block a cell was painted with; the block timers change what each block number shows (blkmap)
const at = (x: number, y: number): number => sim.w.blkmap[sim.w.map[(y + ORIGIN) * MLEN + x + ORIGIN]];
const gate = () => at(FOUR.gate, 8) === book.n('gateShut');
const lit = (j: number) => at(5 + j, METER_ROW) === book.n(`bellOn${j}`);
const expect = (what: string, ok: boolean) => {
  if (!ok) throw new Error(`gateCheck: ${what} (tick ${sim.ticks})`);
};

const start = sim.ticks;
expect('the gate is open at the start', !gate());
expect('every bell is lit at the start', Array.from({ length: BELLS }, (_, j) => lit(j)).every(Boolean));
await bot.wait(Math.round(OPEN_TICKS / BELLS) + 10 - (sim.ticks - start));
expect('the first bell has gone dark after a seventh of the time', !lit(0) && lit(1));
await bot.wait(OPEN_TICKS + 10 - (sim.ticks - start));
expect('the gate is shut once the last bell is dark', gate() && !lit(BELLS - 1));
await bot.wait(CYCLE + 10 - (sim.ticks - start));
expect('the gate is open again after the shut spell', !gate() && lit(BELLS - 1));
console.log(`gateCheck ok: open at 0, shut at ${OPEN_TICKS}, open again at ${CYCLE} ticks`);
