// The play-testing bot plays the whole game on the built disk without losing a life. route.ts records, tick by tick, which
// frame of each loop the engine shows and checks its character (a pulse steps at even gaps, a flicker at uneven ones, a
// flag's two blocks step together, the fall's four columns step together, a spark rests dark). These checks also confirm
// that no two sparks side by side (or diagonal) share a loop, that every torch and flag is laid on a ring's first block,
// and that no solid block is drawn like open sky.
//   cd web && npx vite-node ../games/flicker/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

const built = buildLevels();
for (const l of built.levels) {
  assertNoInvisibleWalls({ book: l.book, pal: l.pal, levels: [l] });
  const sparks = l.things.filter((t) => t.kind === 'spark');
  for (const a of sparks)
    for (const b of sparks)
      if (a !== b && a.ring === b.ring && Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1)
        throw new Error(`${l.file}: two sparks at ${a.x},${a.y} and ${b.x},${b.y} share a loop`);
  for (const t of l.things) if (!l.book.index.has(`${t.ring}.0`)) throw new Error(`${l.file}: no ring ${t.ring}`);
}
const { sim } = await play();
console.log(`flicker: the bot walked all three levels; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
