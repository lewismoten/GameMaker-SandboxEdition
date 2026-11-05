// The play-testing bot plays the whole game on the built disk and must win without losing a life; route.ts
// asserts what each room shows: Space lifts him off the surface and the pull brings him back, the first block
// stops him, and every block and trench is jumped with the arrow that points that way on the screen.
//   cd web && npx vite-node ../games/around-the-room/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

const built = buildLevels();
// each level against its own block set
for (const l of built.levels) assertNoInvisibleWalls({ book: l.book, pal: built.pal, levels: [l] });
const { sim } = await play();
console.log(`around-the-room: the bot played all four levels; ${sim.deaths} lives lost, ${sim.ci.lives} left, score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
