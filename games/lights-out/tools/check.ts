// The play-testing bot plays the whole game on the built disk without losing a life. route.ts checks, on the engine itself,
// what each level teaches (the rings of shades, the trail of light a touch leaves, a clock lighting a hall in one tick).
// These checks also confirm that no solid block is drawn like open air, that Kit, the floor's edge and the signs stand out
// from the dark at every brightness (contrast.ts), and that every sign stands in the dark, where its background matches.
//   cd web && npx vite-node ../games/lights-out/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { shadeAt } from '../src/levels';
import { buildLevels } from '../src/levels';
import { MIN_KIT_SHARE, MIN_PATH, contrastTable } from './contrast';
import { play } from './play';

const built = buildLevels();
for (const l of built.levels) {
  assertNoInvisibleWalls({ book: l.book, pal: l.pal, levels: [l] });
  // a sign's board and posts are drawn on the darkest air, so a sign must stand where the cave is shade 0
  for (const [name, [x, y]] of Object.entries(l.signs))
    for (let dx = 0; dx < 4; dx++) for (let dy = 0; dy < 4; dy++) if (shadeAt(x + dx, y + dy, l.lamps) !== 0) throw new Error(`${l.file}: sign ${name} stands in a lamp's light at ${x + dx},${y + dy}`);
}
for (const row of contrastTable()) {
  if (row.path < MIN_PATH) throw new Error(`shade ${row.shade}: the floor's edge has contrast ${row.path.toFixed(2)}, under ${MIN_PATH}`);
  if (row.kit < MIN_KIT_SHARE) throw new Error(`shade ${row.shade}: only ${(row.kit * 100).toFixed(0)}% of Kit's colors stand out from the air`);
}
const { sim } = await play();
console.log(`lights-out: the bot walked all three levels; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
