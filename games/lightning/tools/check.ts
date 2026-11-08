// The play-testing bot plays the whole game on the built disk without losing a life. route.ts waits for a flash at
// each sign and counts, from the blocks the engine shows, that every timed block turns lit in the same tick and stays
// lit LIT ticks. The checks also confirm that every timed block keeps the same round (so nothing drifts out of step
// with the sky or the song), and that no solid block is drawn like open sky.
//   cd web && npx vite-node ../games/lightning/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { DARK, LIT } from '../src/storm';
import { play } from './play';

const built = buildLevels();
for (const l of built.levels) {
  assertNoInvisibleWalls({ book: l.book, pal: built.pal, levels: [l] });
  for (const t of l.timed) {
    const want = t.name.endsWith('.lit') ? LIT : DARK;
    if (t.ticks !== want) throw new Error(`${l.file}: ${t.name} keeps ${t.ticks} ticks, not ${want}`);
    if (t.next !== (t.name.endsWith('.lit') ? t.name.slice(0, -4) : `${t.name}.lit`)) throw new Error(`${l.file}: ${t.name} turns into ${t.next}`);
  }
}
const { sim } = await play();
console.log(`lightning: the bot walked both levels; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
