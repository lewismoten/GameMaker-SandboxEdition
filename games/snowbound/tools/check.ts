// Checks the built disk: the multi-block objects (tools/align.ts), then the bot plays the
// whole game headlessly (tools/route.ts, the walkthrough's seed) and must win without losing
// a life. It reports each level's time, warmth and money; nothing is written.
//   cd web && npx vite-node ../games/snowbound/tools/check.ts [seed...]
import { align } from './align';
import { Bot, SCAN } from './bot';
import { keepToPaths, readWalkPaths } from '../../kit/walkPaths';
import { bowdenDrive, galeStreet, jamieStreet, lavaleMall } from './route';
import { GameSim } from './sim';
import { TICKS_PER_SECOND } from '../../kit/gameSim';

if (align()) throw new Error('snowbound: a multi-block object is out of line (above)');

/**
 * The top of Jamie Street is glide snow: one tap of Down (on a copy of the game) must carry
 * the sled from the start onto the steep band below it, and on past it.
 */
async function oneShove(sim: GameSim, seed: number): Promise<void> {
  const keep = sim.snapshot();
  const y0 = sim.pos.y;
  sim.press(SCAN.down);
  await sim.tick();
  sim.release(SCAN.down);
  let t = 1;
  // the start row, two glide rows, the steep band, and onto the slope below it
  for (; sim.pos.y < y0 + 4 && t < 200 && !sim.deaths; t++) await sim.tick();
  sim.restore(keep);
  if (t >= 200 || sim.deaths) throw new Error(`seed ${seed}: one push of Down does not start the sled run`);
  console.log(`seed ${seed}: one push of Down starts the sled run (the steep band in ${t} ticks)`);
}

const seeds = process.argv.slice(2).map(Number);
for (const seed of seeds.length ? seeds : [1]) {
  const sim = new GameSim(undefined, seed);
  const bot = new Bot(sim);
  // along the sidewalks and driveways, as a person walks (walkPaths.json, written by the build)
  bot.keepTo = keepToPaths(sim, readWalkPaths('snowbound'));
  let t = 0;
  for (const level of [galeStreet, jamieStreet, bowdenDrive, lavaleMall]) {
    if (level === jamieStreet) await oneShove(sim, seed);
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
