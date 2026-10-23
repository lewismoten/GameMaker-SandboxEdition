// Proves the kitchen can be finished on the built disk: the bot plays every room in turn
// (tools/route.ts) and wins, then plays again taking the Cold Cellar's secret way through the
// hidey-hole, which skips the Tea Room, and wins that way too.
//   cd web && npx vite-node ../games/bakers/tools/check.ts [--secret]
import { compileAll } from '../src/compile';
import { roomScene } from '../src/game';
import { STOVE_SCENE } from '../src/ids';
import { FIXED_BLOCK } from '../src/ids';
import { Bot } from './bot';
import { GameSim } from './sim';
import { SECRET_ROUTE, SUSAN } from './route';
import { CTR } from '../src/ids';
import { ORIGIN } from '../src/levels/room';
import { playThrough } from './play';

/** Both eggs can be found and kept: the crock off the Larder, the display case off the Vault. */
async function eggsFound(): Promise<void> {
  const all = compileAll();
  const sim = new GameSim(undefined, 1);
  const bot = new Bot(sim, all);
  for (const [level, egg, block] of [
    [2, 'rotten', FIXED_BLOCK.eggRotten],
    [13, 'faberge', FIXED_BLOCK.eggFaberge],
  ] as const) {
    sim.warp(roomScene(level), roomScene(level) - 1, 0);
    sim.ci.meter[3] = level;
    const d = bot.marks('D')[0];
    if ((await bot.goto(d.x, d.y, `${egg}: the hatch`)) !== 'link') throw new Error(`${egg}: the hatch did not lead anywhere`);
    const q = bot.marks(egg === 'rotten' ? 'q' : 'f')[0];
    if (await bot.goto(q.x, q.y, `${egg}: the egg`)) throw new Error(`${egg}: left the cupboard`);
    await bot.pickup();
    if (!sim.ci.inv.includes(block)) throw new Error(`${egg}: not in the inventory after Enter`);
    const o = bot.marks('O')[0];
    if ((await bot.goto(o.x, o.y, `${egg}: the way back`)) !== 'link' || sim.scene !== roomScene(level)) throw new Error(`${egg}: no way back`);
    console.log(`ok   the ${egg} egg (block ${block}) found, kept, and back in ${bot.room().spec.name}`);
  }
}

/** The Clock Room's lazy Susan turns clockwise only: pushed IX right after XII it jams; XII, III, VI, IX hands over the spoon. */
async function susanTurns(): Promise<void> {
  const all = compileAll();
  const sim = new GameSim(undefined, 1);
  const bot = new Bot(sim, all);
  sim.warp(roomScene(9), roomScene(9) - 1, 0);
  const push = (i: number) => bot.push(SUSAN[i][0] + ORIGIN.x, SUSAN[i][1] + ORIGIN.y, `the lazy Susan ${['XII', 'III', 'VI', 'IX'][i]}`);
  const spoons = sim.meter(CTR.keys);
  if (await push(3)) throw new Error('The lazy Susan turned at IX before XII');
  if (!(await push(0))) throw new Error('The lazy Susan would not turn at XII');
  if (await push(3)) throw new Error('The lazy Susan turned counterclockwise (XII then IX)');
  if (await push(2)) throw new Error('The lazy Susan skipped III');
  for (const i of [1, 2, 3]) if (!(await push(i))) throw new Error(`The lazy Susan jammed at ${['XII', 'III', 'VI', 'IX'][i]}`);
  if (sim.meter(CTR.keys) !== spoons + 1) throw new Error('A full turn of the lazy Susan did not hand over the spoon');
  console.log(`ok   the lazy Susan jams counterclockwise and hands over the spoon after a turn clockwise (${sim.meter(CTR.turns) - 1} quarters)`);
}

const secretOnly = process.argv.includes('--secret');
try {
  if (!secretOnly) {
    const bot = await playThrough(false);
    if (!bot.sim.ci.inv.includes(FIXED_BLOCK.kazoo)) throw new Error('The kazoo was not picked up in the Spice Parlor');
    const at = bot.sim.trail.indexOf(STOVE_SCENE);
    if (at < 0 || bot.sim.trail[at - 1] !== roomScene(7) || bot.sim.trail[at + 1] !== roomScene(8))
      throw new Error('Sir Reginald did not go under the stove between the Sugar Room and the Brewery');
    console.log(`WON  normal route: ${bot.sim.deaths} deaths, score ${bot.sim.ci.score}, ${bot.squawks} squawks`);
  }
  await eggsFound();
  await susanTurns();
  if (Object.keys(SECRET_ROUTE).length) {
    const bot = await playThrough(true);
    if (!bot.sim.ci.inv.includes(FIXED_BLOCK.tricorn)) throw new Error("Ebenezer's tricorn was not picked up in the hidey-hole");
    if (bot.sim.trail.includes(roomScene(6))) throw new Error('The secret route went through the Tea Room');
    if (!bot.sim.trail.includes(roomScene(0))) throw new Error('The secret route never reached the hidey-hole');
    if (!bot.sim.trail.includes(STOVE_SCENE)) throw new Error('The secret route never went under the stove');
    console.log(`WON  secret route (skips the Tea Room): ${bot.sim.deaths} deaths, score ${bot.sim.ci.score}`);
  }
} catch (e) {
  console.error(`FAIL ${(e as Error).message}`, process.env.BOT_STACK ? (e as Error).stack : '');
  process.exitCode = 1;
}
