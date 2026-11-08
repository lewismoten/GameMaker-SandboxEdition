// The play-testing bot plays the whole game on the built disk without losing a life, and no level has an invisible wall
// (a solid block drawn as sky).
//   cd web && npx vite-node ../games/thank-you-parade/tools/check.ts   (BOT_LOG=1 prints every step)
import { invisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

const { levels } = buildLevels();
const bad = levels.flatMap((l) => invisibleWalls(l.book, l.book.finish(), l.pal, [{ name: l.file, map: l.map.done() }]));
if (bad.length) throw new Error(bad.join('\n'));
const { sim } = await play();
console.log(`thank-you-parade: the bot played all seven levels; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
