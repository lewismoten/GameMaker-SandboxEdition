// The play-testing bot walks the yard twice, watches the hops and the bees, and ends the game, without losing a life; route.ts asserts
// that each door leads to the next room, that the yard's two scenes load one map and their own pictures. It also checks that no solid
// block is drawn like open ground.
//   cd web && npx vite-node ../games/shadows/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

const built = buildLevels();
for (const l of [built.yardSolid, built.yardDither, built.hop, built.hover]) assertNoInvisibleWalls({ book: l.book, pal: built.pal, levels: [l] });
const { sim } = await play();
const trail = sim.trail.join(' ');
if (trail !== '2 3 4 5') throw new Error(`the bot should enter scenes 2 3 4 5 (then the ending), not ${trail}`);
console.log(`shadows: the bot walked the yard twice, watched the hop and the hover; ${sim.deaths} lives lost, scenes entered ${trail}`);
