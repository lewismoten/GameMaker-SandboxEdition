// Pictures of the lessons (never on the disk), for the progress shots: level 1 at the start, on the dashed edge
// and just after it; level 2 at the start and at a lap sign; and a small picture of each whole 100x100 map, the road
// one pixel-block per map block, which shows the straight road and the tilted one's three laps side by side.
//   cd web && npx vite-node ../games/diagonal-wrap/tools/shots.ts <outDir>
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { cellAt } from '../src/course';
import { buildLevels } from '../src/levels';
import { buildTopHeroBlocks } from '../src/topHero';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
const set = buildMonsters(mb);
const top = buildTopHeroBlocks(pal);
const kit = (name: string, x: number, y: number) => [{ pixels: Uint8Array.from(top.pics.get(name)!.px), x, y }];

/** A 16x10 block view of level n centered on map block (cx, cy), wrapping round the map's edges, with Kit named `pose` in the middle. */
const view = (n: 0 | 1, cx: number, cy: number, pose: string) => {
  const m = levels[n].map.done();
  const shifted = { ...m, blocks: new Uint8Array(m.blocks.length), monsters: [] as typeof m.monsters };
  for (let y = 0; y < 100; y++)
    for (let x = 0; x < 100; x++) shifted.blocks[y * 100 + x] = m.blocks[((y + cy - 50 + 100) % 100) * 100 + ((x + cx - 50 + 100) % 100)];
  return renderRegion(shifted, bbl, mbl, set, 42, 47, 16, 10, kit(pose, 50, 50));
};
const c1 = levels[0].course;
const c2 = levels[1].course;
const shot = (name: string, n: 0 | 1, [cx, cy]: [number, number], pose: string) => writePng(join(out, name), view(n, cx, cy, pose), pal.pal, 3);
shot('one-1-start.png', 0, cellAt(c1, 1, 2), 'down.stand');
shot('one-2-before-edge.png', 0, cellAt(c1, 47, 2), 'down.0');
shot('one-3-on-the-edge.png', 0, cellAt(c1, 50, 2), 'down.1');
shot('one-4-after-edge.png', 0, cellAt(c1, 53, 2), 'down.0');
shot('two-1-start.png', 1, cellAt(c2, 1, 2), 'down.stand');
shot('two-2-lap-sign.png', 1, cellAt(c2, 36, 2), 'down.stand');
shot('two-3-right-edge.png', 1, cellAt(c2, 156, 2), 'down.1');

// the whole map, one 4x4 square a block, colored by what the block is
const colors: Record<string, number> = {
  lawn: pal.c('grass', 3),
  flower: pal.c('grass', 3),
  hedge: pal.c('green', 1),
  path: pal.c('dirt', 3),
  seamTop: pal.c('white', 4),
  seamLeft: pal.c('white', 4),
  seamCorner: pal.c('white', 4),
  coin: pal.c('gold', 5),
  startTop: pal.c('green', 3),
  startBottom: pal.c('green', 3),
  exitTop: pal.c('gold', 4),
  exitBottom: pal.c('gold', 4),
};
const names = [...book.index.keys()];
levels.forEach((l, i) => {
  const m = l.map.done();
  const p = new Pixels(400, 400, colors.lawn);
  for (let y = 0; y < 100; y++)
    for (let x = 0; x < 100; x++) {
      const name = names[m.blocks[y * 100 + x]];
      p.rect(x * 4, y * 4, 4, 4, colors[name] ?? colors.path); // signs and the rest read as road
    }
  writePng(join(out, `map-${i + 1}-whole.png`), p, pal.pal, 2);
});
