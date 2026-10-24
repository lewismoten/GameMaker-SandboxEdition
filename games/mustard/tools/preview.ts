// Design previews (never on the disk): every level map with its monsters and the seed at its
// start, and the block, monster and seed sheets, as PNGs in the folder given (default: the
// system temp dir).
//   cd web && npx vite-node ../games/mustard/tools/preview.ts [outDir]
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { blockSheet, writePng } from '../../kit/png';
import { renderRegion } from '../../snowbound/src/art/render';
import { buildPalette } from '../src/art/pal';
import { buildBlocks } from '../src/blocks/blocks';
import { buildMonsters } from '../src/characters';
import { LEVELS } from '../src/levels/levels';
import { ORIGIN } from '../src/levels/maps';
import { buildCharBlocks, buildMonsterBlocks } from '../src/sprites/sprites';

const out = process.argv[2] ?? join(tmpdir(), 'mustard-preview');
mkdirSync(out, { recursive: true });
const day = buildPalette('plain');
const book = buildBlocks(day);
const bbl = book.finish();
const mb = buildMonsterBlocks(day);
const cb = buildCharBlocks(day);
writePng(join(out, 'blocks.png'), blockSheet(bbl.slice(0, book.index.size), 12), day.pal, 3);
writePng(join(out, 'monsters.png'), blockSheet(mb.blocks.slice(0, mb.index.size), 12), day.pal, 4);
writePng(join(out, 'seed.png'), blockSheet(cb.blocks.slice(0, cb.index.size), 13), day.pal, 4);
for (const l of LEVELS) {
  const pal = buildPalette(l.light);
  const { m, start, size } = l.build(book);
  const map = m.build();
  const pic = renderRegion(map, bbl, mb.blocks, buildMonsters(mb, l.mons), ORIGIN, ORIGIN, size[0], size[1], [
    { pixels: cb.blocks[cb.n(`${l.form}.front`)].pixels, x: start[0], y: start[1] },
  ]);
  writePng(join(out, `${l.file}.png`), pic, pal.pal, 2);
}
console.log(`previews in ${out}`);
