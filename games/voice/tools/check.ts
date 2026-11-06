// The play-testing bot plays the whole game on the built disk. It must win without losing a life;
// route.ts asserts what each sign teaches: Enter plays the HELLO clip, a speaker's counter going up plays
// WELCOME and going down plays DEEPER, a new clip cuts the one playing, and the last line ends before the door.
//   cd web && npx vite-node ../games/voice/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

assertNoInvisibleWalls(buildLevels());
const { sim } = await play();
console.log(
  `out loud: the bot played all three levels; ${sim.deaths} lives lost, ${sim.ci.lives} left, score ${sim.ci.score}, ${sim.trail.length} scenes entered`,
);
