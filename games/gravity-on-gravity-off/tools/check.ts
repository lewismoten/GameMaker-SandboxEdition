// The play-testing bot plays the whole game on the built disk and must win without losing a life; route.ts
// asserts what each sign teaches: gravity brings a jump back down and drops him off a ledge, the wall stops him,
// and with gravity off Space does nothing, all four arrows walk and nothing falls.
//   cd web && npx vite-node ../games/gravity-on-gravity-off/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

const built = buildLevels();
// each level against its own block set
assertNoInvisibleWalls({ book: built.book, pal: built.pal, levels: [built.levels[0]] });
assertNoInvisibleWalls({ book: built.topBook, pal: built.pal, levels: [built.levels[1]] });
const { sim } = await play();
console.log(`gravity-on-gravity-off: the bot played both levels; ${sim.deaths} lives lost, ${sim.ci.lives} left, score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
