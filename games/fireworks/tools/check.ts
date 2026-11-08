// The play-testing bot plays the whole game on the built disk without losing a life. route.ts counts what the monsters
// do: each launcher launches on its own time and every rocket bursts at the top of its climb; Enter launches one; every
// small burst goes out; each big firework's nine blocks burst in their square again and again, and its rocket shows only
// while it climbs. The checks also confirm that no solid block is drawn like open sky.
//   cd web && npx vite-node ../games/fireworks/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

const built = buildLevels();
assertNoInvisibleWalls({ book: built.book, pal: built.pal, levels: built.levels });
const { sim } = await play();
console.log(`fireworks: the bot walked both levels; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
