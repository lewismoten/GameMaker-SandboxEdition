// The play-testing bot plays the whole game on the built disk. It must win, and the only life it
// loses is the one the spikes take on purpose in level 3 (tools/play.ts); route.ts asserts what each
// sign teaches: a spike costs 10 hit points once, a heart gives 10 back, running out costs a life.
//   cd web && npx vite-node ../games/slippery-and-bouncy/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

assertNoInvisibleWalls(buildLevels());
const { sim } = await play();
console.log(
  `slippery-and-bouncy: the bot played all three levels; ${sim.deaths} life lost on purpose, ${sim.ci.lives} left, score ${sim.ci.score}, ${sim.trail.length} scenes entered`,
);
