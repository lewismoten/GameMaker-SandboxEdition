// The play-testing bot plays the whole game on the built disk without losing a life, and the disk's
// pictures and cartoon are checked where the scenes use them (picturesCheck.ts).
//   cd web && npx vite-node ../games/pictures-and-cartoons/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { checkEntranceWalk } from '../../kit/starter/entranceWalk';
import { play } from './play';

const built = buildLevels();
for (const level of built.levels) assertNoInvisibleWalls({ book: level.book, pal: built.pal, levels: [level] });
for (let completed = 0; completed < 3; completed++) await checkEntranceWalk((await play(undefined, completed)).bot, 1, 4);
const { sim } = await play();
console.log(`pictures-and-cartoons: the bot walked all three levels; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
await import('./picturesCheck');
