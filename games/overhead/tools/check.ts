// The play-testing bot plays the whole game on the built disk and must win without losing a life; route.ts asserts
// what each sign teaches: each arrow plays its own walking sequence and walks him, Space does nothing, a table and a
// house wall stop him, a road off an area's edge lands him in the middle of the next area (and back, both ways),
// and a door is a link too. It also checks that no solid block is drawn like open ground.
//   cd web && npx vite-node ../games/overhead/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

const built = buildLevels();
assertNoInvisibleWalls({ book: built.book, pal: built.pal, levels: built.levels });
const { sim } = await play();
const trail = sim.trail.join(' ');
if (trail !== '2 3 4 3 6 5 7 5 7') throw new Error(`the bot should enter scenes 2 3 4 3 6 5 7 5 7 (then the ending), not ${trail}`);
console.log(`overhead: the bot played both levels; ${sim.deaths} lives lost, ${sim.ci.lives} left, score ${sim.ci.score}, scenes entered ${trail}`);
