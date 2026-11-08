// The play-testing bot visits every door and comes back, then ends the game, without losing a life; route.ts asserts that each
// door leads to its own scene, that every scene opens the same map file with its own palette, and that the way back lands
// beside the door he used. It also checks that no solid block is drawn like open ground.
//   cd web && npx vite-node ../games/color-doors/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

const built = buildLevels();
assertNoInvisibleWalls({ book: built.book, pal: built.pal, levels: [built.hall, built.gallery] });
const { sim } = await play();
const trail = sim.trail.join(' ');
if (trail !== '2 3 8 4 8 5 8 6 8 7 8') throw new Error(`the bot should enter scenes 2 3 8 4 8 5 8 6 8 7 8 (then the ending), not ${trail}`);
console.log(`color-doors: the bot tried all five doors; ${sim.deaths} lives lost, scenes entered ${trail}`);
