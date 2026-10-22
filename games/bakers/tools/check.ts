// Proves the kitchen can be finished on the built disk: the bot plays every room in turn
// (tools/route.ts) and wins, then plays again taking the Cold Cellar's secret way through the
// hidey-hole, which skips the Tea Room, and wins that way too.
//   cd web && npx vite-node ../games/bakers/tools/check.ts [--secret]
import { compileAll } from '../src/compile';
import { roomScene } from '../src/game';
import { FIXED_BLOCK } from '../src/ids';
import { Bot } from './bot';
import { GameSim } from './sim';
import { SECRET_ROUTE } from './route';
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

const secretOnly = process.argv.includes('--secret');
try {
  if (!secretOnly) {
    const bot = await playThrough(false);
    if (!bot.sim.ci.inv.includes(FIXED_BLOCK.kazoo)) throw new Error('The kazoo was not picked up in the Spice Parlor');
    console.log(`WON  normal route: ${bot.sim.deaths} deaths, score ${bot.sim.ci.score}, ${bot.squawks} squawks`);
  }
  await eggsFound();
  if (Object.keys(SECRET_ROUTE).length) {
    const bot = await playThrough(true);
    if (!bot.sim.ci.inv.includes(FIXED_BLOCK.tricorn)) throw new Error("Ebenezer's tricorn was not picked up in the hidey-hole");
    if (bot.sim.trail.includes(roomScene(6))) throw new Error('The secret route went through the Tea Room');
    if (!bot.sim.trail.includes(roomScene(0))) throw new Error('The secret route never reached the hidey-hole');
    console.log(`WON  secret route (skips the Tea Room): ${bot.sim.deaths} deaths, score ${bot.sim.ci.score}`);
  }
} catch (e) {
  console.error(`FAIL ${(e as Error).message}`);
  process.exitCode = 1;
}
