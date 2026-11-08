// The play-testing bot plays the whole game on the built disk. It must win without losing a life;
// route.ts asserts what each sign teaches: a real wall stops him and a picture of one does not, a bump turns
// a block into a cracked one and a touch turns that into chips, and the coins in the wall are taken.
//   cd web && npx vite-node ../games/secret-doors/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

assertNoInvisibleWalls(buildLevels());
const { sim } = await play();
console.log(
  `looks like a wall: the bot played all three levels; ${sim.deaths} lives lost, ${sim.ci.lives} left, score ${sim.ci.score}, ${sim.trail.length} scenes entered`,
);
