// The play-testing bot plays the whole game on the built disk. It must win without losing a life;
// route.ts asserts what each sign teaches: P takes a crate into the pack, D puts it down as a step (three make a stair up a six-block wall), Enter shrugs with an empty pack, a flame in the pack melts the frosty grump, a flame falls short of the far gumdrop, and with the flame put down Enter throws a star that pops it.
//   cd web && npx vite-node ../games/inventory/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

assertNoInvisibleWalls(buildLevels());
const { sim } = await play();
console.log(
  `pick it up: the bot played both levels; ${sim.deaths} lives lost, ${sim.ci.lives} left, score ${sim.ci.score}, ${sim.trail.length} scenes entered`,
);
