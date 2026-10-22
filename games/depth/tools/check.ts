// Plays the whole game on the built disk: the bot rolls every level, lenses, rings, gates and
// the vanishing point, beats Count Polygon and reaches the end. Fails if it can't.
//   cd web && npx vite-node ../games/depth/tools/check.ts
import { Bot } from './bot';
import { ROUTES, playLevel } from './route';
import { GameSim } from './sim';

const sim = new GameSim(undefined, 1);
const bot = new Bot(sim);
try {
  for (let i = 0; i < ROUTES.length; i++) {
    await playLevel(bot, i);
    console.log(bot.log[bot.log.length - 1]);
  }
} catch (e) {
  console.log(bot.log.slice(-15).join('\n'));
  throw e;
}
console.log(`ended: ${sim.ended ?? 'no'}; deaths ${sim.deaths}; score ${sim.ci.score}; shots ${bot.shots}; scenes ${sim.trail.join(' ')}`);
if (process.argv.includes('--partial')) process.exit(0);
if (sim.ended !== 'won') throw new Error('The bot did not win');
if (sim.deaths) throw new Error(`The bot lost ${sim.deaths} lives`);
