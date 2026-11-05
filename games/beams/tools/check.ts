// The play-testing bot walks the three beams, the fog and the lanterns, and ends the game, without losing a life; route.ts asserts
// that each door leads to the next room. It also checks that no solid
// block is drawn like open ground.
//   cd web && npx vite-node ../games/beams/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

const built = buildLevels();
for (const l of [built.beams, built.fog, built.glow]) assertNoInvisibleWalls({ book: l.book, pal: built.pal, levels: [l] });
const { sim } = await play();
const trail = sim.trail.join(' ');
if (trail !== '2 3 4') throw new Error(`the bot should enter scenes 2 3 4 (then the ending), not ${trail}`);
console.log(`beams: the bot walked the beams, the fog and the glow; ${sim.deaths} lives lost, scenes entered ${trail}`);
