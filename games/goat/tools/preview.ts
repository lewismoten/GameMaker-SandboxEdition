// Design previews (never on the disk): every level map with its monsters, and the block,
// monster and character sheets, as PNGs in the folder given (default: the system temp dir).
//   cd web && npx vite-node ../games/goat/tools/preview.ts [outDir]
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { blockSheet, writePng } from '../../kit/png';
import { renderRegion } from '../../snowbound/src/art/render';
import { buildPalette, type Light } from '../src/art/pal';
import { buildBlocks } from '../src/blocks/blocks';
import { buildMonsters } from '../src/characters';
import { caravan, field, stable, town, ORIGIN, type Level } from '../src/levels/maps';
import { buildCharBlocks, buildMonsterBlocks } from '../src/sprites/sprites';

const out = process.argv[2] ?? join(tmpdir(), 'goat-preview');
mkdirSync(out, { recursive: true });
const day = buildPalette('stable');
const book = buildBlocks(day);
const bbl = book.finish();
const mb = buildMonsterBlocks(day);
const cb = buildCharBlocks(day);
writePng(join(out, 'blocks.png'), blockSheet(bbl.slice(0, book.index.size), 12), day.pal, 3);
writePng(join(out, 'monsters.png'), blockSheet(mb.blocks.slice(0, mb.index.size), 12), day.pal, 3);
writePng(join(out, 'goat.png'), blockSheet(cb.blocks.slice(0, cb.index.size), 12), day.pal, 3);
const levels: [string, (b: typeof book) => Level, Light, number, number][] = [
  ['field', field, 'field', 52, 20],
  ['town', town, 'town', 40, 22],
  ['caravan', caravan, 'camp', 40, 23],
  ['stable', stable, 'stable', 30, 15],
];
for (const [name, fn, light, w, h] of levels) {
  const pal = buildPalette(light);
  const { m, start } = fn(book);
  const map = m.build();
  const pic = renderRegion(map, bbl, mb.blocks, buildMonsters(mb), ORIGIN, ORIGIN, w, h, [
    { pixels: cb.blocks[cb.n('down0')].pixels, x: start[0], y: start[1] },
  ]);
  writePng(join(out, `${name}.png`), pic, pal.pal, 2);
}
console.log(`previews in ${out}`);
