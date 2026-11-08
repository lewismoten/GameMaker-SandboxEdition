// The play-testing bot plays the whole game on the built disk and must win without losing a life; route.ts asserts that
// every block he stops on is road (the straights and round corners, the diagonals and their triangles, the crossroads, the
// T and the bridge), that the finish line of each level takes him to the next, and that water stops him. It also checks that
// no solid block is drawn like open ground.
//   cd web && npx vite-node ../games/road-tiles/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

const built = buildLevels();
assertNoInvisibleWalls({ book: built.book, pal: built.pal, levels: built.levels });
const { sim } = await play();
const trail = sim.trail.join(' ');
if (trail !== '2 3 4') throw new Error(`the bot should enter scenes 2 3 4 (then the ending), not ${trail}`);
console.log(`road-tiles: the bot played all three levels; ${sim.deaths} lives lost, ${sim.ci.lives} left, score ${sim.ci.score}, scenes entered ${trail}`);
