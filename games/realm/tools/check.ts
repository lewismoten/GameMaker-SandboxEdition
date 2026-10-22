// Plays the main quest on the built disk with the bot (tools/route.ts) and reports.
//   cd web && npx vite-node ../games/realm/tools/check.ts      (BOT_LOG=1 for every step)
import { GameSim } from './sim';
import { Bot } from './bot';
import { ROUTE } from './route';

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
