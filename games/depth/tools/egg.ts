// Checks the felt egg: the bot plays to the Hall of Mirrors, rolls through the two-way mirror
// (the egg's page shows), picks the Prism Egg up with Enter, and makes sure it is carried as
// block 149, the number the desk looks for in a save (web/src/eggs/eggs.ts).
//   cd web && npx vite-node ../games/depth/tools/egg.ts
import { Bot } from './bot';
import { ROUTES, playLevel, playSteps } from './route';
import { GameSim } from './sim';
import { LORE_SCENE } from '../src/screens/screens';
import { farScene } from '../src/game';
import { EGG_BLOCK } from '../src/levels/extras';

const sim = new GameSim(undefined, 1);
const bot = new Bot(sim);
await playLevel(bot, 0);
await playLevel(bot, 1);
// the Hall of Mirrors as far as the red lens (room C, in the far plane)
await playSteps(bot, 2, ROUTES[2].slice(0, 5));
const ox = 31;
const oy = 37;
let r = await bot.goto(ox + 31, oy + 3, 'behind the mirror');
if (r !== 'link' || sim.scene !== LORE_SCENE) throw new Error(`no egg page (${r}, scene ${sim.scene})`);
await bot.wait(3);
if (sim.scene !== farScene(2)) throw new Error(`not back in the hall (scene ${sim.scene})`);
r = await bot.goto(ox + 33, oy + 3, 'the felt egg');
if (r) throw new Error(`egg: ${r}`);
await bot.pickup();
if (!sim.ci.inv.includes(EGG_BLOCK)) throw new Error(`no egg in the inventory: ${sim.ci.inv.join(' ')}`);
console.log(`The Prism Egg is carried (inventory ${sim.ci.inv.join(' ')}), score ${sim.ci.score}`);
// and out again by the other mirror, without the page
r = await bot.goto(ox + 29, oy + 2, 'out through the mirror');
if (r) throw new Error(`out: ${r}`);
console.log(bot.log.slice(-4).join('\n'));
