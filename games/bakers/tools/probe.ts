// scratch probe (not committed)
import { compileAll } from '../src/compile';
import { Bot } from './bot';
import { ROUTE, playRoom } from './route';
import { GameSim } from './sim';
import { SCAN } from '../src/ids';
const all = compileAll();
const sim = new GameSim(undefined, 1);
const bot = new Bot(sim, all);
await playRoom(bot, ROUTE[1]);
await playRoom(bot, ROUTE[2]);
await bot.goto(10, 10, 'kazoo');
await bot.pickup();
await bot.goto(12, 13, 'x');
console.log(sim.pos, bot.nameAt(13, 13), sim.shown(13, 13).solid, sim.w.keydn.slice(0, 0x50).join(''), sim.ci.seqon.join(','));
sim.press(SCAN.right);
for (let i = 0; i < 8; i++) {
  await sim.tick();
  if (i === 0) sim.release(SCAN.right);
  console.log(i, sim.pos, sim.w.chr.cseq, sim.w.chr.cframe);
}
