// The play-testing bot plays the whole game on the built disk and must win without losing a life; route.ts
// asserts what each sign teaches: the cubes stop him, he goes round the diagonal wall in square steps, and he
// goes round the front of the stair of towers.
//   cd web && npx vite-node ../games/corner-view/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

const built = buildLevels();
// each level against its own block set
for (const level of built.levels) assertNoInvisibleWalls({ book: level.book, pal: built.pal, levels: [level] });
const { sim } = await play();
console.log(
  `corner-view: the bot played both levels; ${sim.deaths} lives lost, ${sim.ci.lives} left, score ${sim.ci.score}, ${sim.trail.length} scenes entered`,
);
