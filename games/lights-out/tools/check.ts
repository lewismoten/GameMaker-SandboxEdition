// The play-testing bot plays the whole game on the built disk without losing a life. route.ts checks, on the engine itself,
// what each level teaches (the rings of shades, the trail of light a touch leaves, a clock lighting a hall in one tick).
// These checks also confirm that no solid block is drawn like open air, that Kit, the floor's edge and the signs stand out
// from the dark at every brightness (contrast.ts), and that shared sign edges and posts match the air before and after lighting.
//   cd web && npx vite-node ../games/lights-out/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { ORIGIN } from '../../kit/starter/map';
import { buildLevels } from '../src/levels';
import { MIN_KIT_SHARE, MIN_PATH, contrastTable } from './contrast';
import { checkEntranceWalk } from '../../kit/starter/entranceWalk';
import { play } from './play';

const built = buildLevels();
for (const l of built.levels) {
  assertNoInvisibleWalls({ book: l.book, pal: l.pal, levels: [l] });
  // Shared edge/post tiles keep the air of each cell, including their lit successors.
  const names = [...l.book.index.keys()];
  for (let y = 0; y < l.map.height; y++)
    for (let x = 0; x < l.map.width; x++) {
      const name = names[l.map.map.blocks[(y + ORIGIN) * 100 + x + ORIGIN]];
      if ((!name.startsWith('tiledSign.') && !name.startsWith('microPlaque.')) || !/left|right|post/.test(name)) continue;
      const pixel = name.includes('right') ? 219 : 200;
      const { kind, shade } = l.cells[y][x];
      const initial = kind === 'tunnel' || l.lightsAt ? 0 : shade;
      const check = (id: string, k: number) => {
        const actual = l.book.pics.get(id)?.px[pixel];
        const expected = l.pal.r('cair')[k];
        if (actual === undefined || [0, 1, 2].some((c) => l.pal.pal[actual * 3 + c] !== l.pal.pal[expected * 3 + c]))
          throw new Error(`${l.file}: sign ${id} has the wrong air at ${x},${y} (shade ${k})`);
      };
      check(name, initial);
      const touch = l.book.rulesOf(name).touch;
      if (touch) check(touch, y >= 6 ? 4 : y >= 4 ? 3 : 2);
      const timed = l.timed.find((t) => t.name === name);
      if (timed) check(timed.next, shade);
    }
}
for (const row of contrastTable()) {
  if (row.path < MIN_PATH) throw new Error(`shade ${row.shade}: the floor's edge has contrast ${row.path.toFixed(2)}, under ${MIN_PATH}`);
  if (row.kit < MIN_KIT_SHARE) throw new Error(`shade ${row.shade}: only ${(row.kit * 100).toFixed(0)}% of Kit's colors stand out from the air`);
}
for (let completed = 0; completed < 3; completed++) await checkEntranceWalk((await play(undefined, completed)).bot, 1, 3);
const { sim } = await play();
console.log(`lights-out: the bot walked all three levels; score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
