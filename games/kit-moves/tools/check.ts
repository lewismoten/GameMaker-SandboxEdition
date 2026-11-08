// The play-testing bot plays the whole game on the built disk. It must win without losing a life;
// route.ts asserts what each sign teaches: Space held is one hop, Up held lifts Kit above the cliff, Enter held is one dash and each press crosses a wider gap.
//   cd web && npx vite-node ../games/kit-moves/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

assertNoInvisibleWalls(buildLevels());
const { sim } = await play();
console.log(
  `kit's moves: the bot played both levels; ${sim.deaths} lives lost, ${sim.ci.lives} left, score ${sim.ci.score}, ${sim.trail.length} scenes entered`,
);
