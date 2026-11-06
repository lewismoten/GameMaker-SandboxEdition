// The play-testing bot plays the whole game on the built disk without losing a life. route.ts counts what the stars do
// under each sky: the first blinks all at once, the second never does. The checks also confirm that no two stars within
// four blocks of each other share a picture in the second kind of sky, and that no solid block is drawn like open sky.
//   cd web && npx vite-node ../games/twinkle/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

const built = buildLevels();
for (const l of built.levels) {
  assertNoInvisibleWalls({ book: l.book, pal: built.pal, levels: [l] });
  const own = l.stars.filter((s) => s.set === 'star');
  for (const a of own)
    for (const b of own)
      if (a !== b && a.spot === b.spot && Math.abs(a.x - b.x) <= 4 && Math.abs(a.y - b.y) <= 4)
        throw new Error(`${l.file}: two stars at ${a.x},${a.y} and ${b.x},${b.y} share a loop`);
}
const { sim } = await play();
console.log(`twinkle: the bot walked both levels; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
