// The play-testing bot plays the whole game on the built disk and must win without losing a life; route.ts
// asserts what each sign teaches: the water stops him; the first sea is one block, so it shows one frame at a time;
// the second shows four; an edge block goes round its four frames by itself.
//   cd web && npx vite-node ../games/shore/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

const built = buildLevels();
for (const l of built.levels) assertNoInvisibleWalls({ book: l.book, pal: built.pal, levels: [l] });
const { sim } = await play();
console.log(`shore: the bot played both levels; ${sim.deaths} lives lost, ${sim.ci.lives} left, score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
