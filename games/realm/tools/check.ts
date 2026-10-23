// Checks the multi-block objects (tools/align.ts), then plays the main quest on the built disk
// with the bot (tools/route.ts) and reports.
//   cd web && npx vite-node ../games/realm/tools/check.ts      (BOT_LOG=1 for every step)
import { GameSim } from './sim';
import { Bot } from './bot';
import { ROUTE } from './route';
import { align } from './align';

if (align()) throw new Error('realm: a multi-block object is out of line (above)');

const sim = new GameSim(undefined, 1);
const bot = new Bot(sim);
bot.loot = true;
for (const [name, step] of ROUTE) {
  try {
    await step(bot);
  } catch (e) {
    console.log(bot.log.slice(-12).join('\n'));
    throw e;
  }
  console.log(`${name}: ${bot.log[bot.log.length - 1]}`);
}
console.log(`ended: ${sim.ended ?? 'still playing'}; deaths ${sim.deaths}; swings ${bot.swings}; ticks ${sim.trail.length} scenes`);
if (sim.ended !== 'won') throw new Error('realm: the bot did not win');
if (sim.deaths) throw new Error(`realm: the bot lost ${sim.deaths} life/lives`);
