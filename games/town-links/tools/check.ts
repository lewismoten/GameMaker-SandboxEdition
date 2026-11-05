// The play-testing bot plays the whole game on the built disk and must win without losing a life; route.ts asserts
// what each sign teaches: the town block on the world map lands Kit at the town's south gate, a locked gate stops him until
// he carries the key (the counter is kept across scenes), the south gate lands him on the world map just below the town block,
// a house door lands him in the room and the room's door lands him in the yard outside it. It also checks that no solid block
// is drawn like open ground.
//   cd web && npx vite-node ../games/town-links/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

const built = buildLevels();
assertNoInvisibleWalls({ book: built.book, pal: built.pal, levels: built.levels });
const { sim } = await play();
const trail = sim.trail.join(' ');
if (trail !== '2 3 2 3 4 3 4') throw new Error(`the bot should enter scenes 2 3 2 3 4 3 4 (then the ending), not ${trail}`);
console.log(`town-links: the bot played the whole trip; ${sim.deaths} lives lost, ${sim.ci.lives} left, score ${sim.ci.score}, scenes entered ${trail}`);
