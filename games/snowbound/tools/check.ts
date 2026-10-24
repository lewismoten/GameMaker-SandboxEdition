// Checks the built disk: the multi-block objects (tools/align.ts), then the bot plays the
// whole game headlessly (tools/route.ts, the walkthrough's seed) and must win without losing
// a life. It reports each level's time, warmth and money; nothing is written.
//   cd web && npx vite-node ../games/snowbound/tools/check.ts [seed...]
import { align } from './align';
import { Bot } from './bot';
import { bowdenDrive, galeStreet, jamieStreet, lavaleMall } from './route';
import { GameSim } from './sim';
import { TICKS_PER_SECOND } from '../../kit/gameSim';

if (align()) throw new Error('snowbound: a multi-block object is out of line (above)');

const seeds = process.argv.slice(2).map(Number);
for (const seed of seeds.length ? seeds : [1]) {
  const sim = new GameSim(undefined, seed);
  const bot = new Bot(sim);
  let t = 0;
  for (const level of [galeStreet, jamieStreet, bowdenDrive, lavaleMall]) {
    const done = sim.segmentTicks.length;
    await level(bot);
    if (sim.deaths) throw new Error(`seed ${seed}, ${level.name}: the bot lost a life`);
    const ticks = sim.segmentTicks[done] ?? sim.ticks;
    t += ticks;
    console.log(`seed ${seed} ${level.name}: ${ticks} ticks, warmth ${sim.ci.hitpts}, $${sim.money}`);
  }
  if (sim.ended !== 'won') throw new Error(`seed ${seed}: the bot did not win`);
  console.log(`seed ${seed}: won in ${t} ticks (${(t / TICKS_PER_SECOND).toFixed(0)} s), no lives lost, ${bot.throws} snowballs`);
}
