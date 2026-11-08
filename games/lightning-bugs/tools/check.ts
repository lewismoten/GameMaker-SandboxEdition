// The play-testing bot plays the whole game on the built disk without losing a life. route.ts counts what the fireflies do:
// the copies of level 1 blink and fly as one, the six kinds and the meadow never do. The checks also confirm that no two
// fireflies within 8 blocks of each other are the same kind (in level 2, and among level 1's six), that every kind's blink
// takes a different time, and that no solid block is drawn like open sky.
//   cd web && npx vite-node ../games/lightning-bugs/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { BUG, KINDS, roundOf } from '../src/bugs';
import { buildLevels } from '../src/levels';
import { play } from './play';

const built = buildLevels();
for (const l of built.levels) {
  assertNoInvisibleWalls({ book: l.book, pal: built.pal, levels: [l] });
  const kinds = l.bugs.filter((b) => b.monnum !== BUG.step);
  for (const a of kinds)
    for (const b of kinds)
      if (a !== b && a.monnum === b.monnum && Math.abs(a.x - b.x) <= 8)
        throw new Error(`${l.file}: two fireflies of one kind at ${a.x},${a.y} and ${b.x},${b.y}`);
}
const rounds = KINDS.map(roundOf);
if (new Set(rounds).size !== rounds.length) throw new Error(`every kind's blink should take its own time; they take ${rounds.join(' ')} ticks`);
const { sim } = await play();
console.log(`lightning-bugs: the bot walked both levels; ${sim.deaths} lives lost, scenes entered ${sim.trail.join(' ')}`);
