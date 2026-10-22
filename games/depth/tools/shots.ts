// Screenshots of play from the headless simulator: the bot plays up to a step of a level's
// route, waits a few ticks and the scene is drawn into a PNG.
//   cd web && npx vite-node ../games/depth/tools/shots.ts <level 1-6> <steps> <out.png> [ticks]
import { Bot } from './bot';
import { ROUTES, playLevel, playSteps } from './route';
import { GameSim } from './sim';
import { snap } from './snap';

const level = Number(process.argv[2] ?? 1) - 1;
const steps = Number(process.argv[3] ?? 0);
const out = process.argv[4] ?? 'shot.png';
const extra = Number(process.argv[5] ?? 0);
const sim = new GameSim(undefined, 1);
const bot = new Bot(sim);
for (let i = 0; i < level; i++) await playLevel(bot, i);
await playSteps(bot, level, ROUTES[level].slice(0, steps));
await bot.wait(extra);
snap(sim, out);
console.log(bot.log.slice(-3).join('\n'));
