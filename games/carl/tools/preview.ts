// Design previews (never on the disk): every level map with its monsters and Carl at his start,
// and the block, monster and Carl sheets, as PNGs in the folder given (default: the system temp
// dir).
//   cd web && npx vite-node ../games/carl/tools/preview.ts [outDir]
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { blockSheet, writePng } from '../../kit/png';
import { renderRegion } from '../../snowbound/src/art/render';
import { buildPalette } from '../src/art/pal';
import { buildHouse } from '../src/blocks/house';
import { buildYard } from '../src/blocks/yard';
import { buildMonsters } from '../src/characters';
import { LEVELS } from '../src/levels/levels';
import { ORIGIN } from '../src/levels/maps';
import { buildCharBlocks, buildMonsterBlocks } from '../src/sprites/sprites';

const out = process.argv[2] ?? join(tmpdir(), 'carl-preview');
mkdirSync(out, { recursive: true });
const day = buildPalette('plain');
const sets = { house: buildHouse, yard: buildYard };
const mb = buildMonsterBlocks(day);
const cb = buildCharBlocks(day);
const clear = (p: ReturnType<typeof blockSheet>) => p.map((_x, _y, v) => (v === 255 ? day.c('sky', 4) : v));
for (const [name, make] of Object.entries(sets)) {
  const book = make(day);
  writePng(join(out, `${name}-blocks.png`), blockSheet(book.finish().slice(0, book.index.size), 14), day.pal, 3);
}
writePng(join(out, 'monsters.png'), clear(blockSheet(mb.blocks.slice(0, mb.index.size), 12)), day.pal, 4);
writePng(join(out, 'carl.png'), clear(blockSheet(cb.blocks.slice(0, cb.index.size), 12)), day.pal, 5);
for (const l of LEVELS) {
  const pal = buildPalette(l.light);
  const book = sets[l.set](day);
  const lit = sets[l.set](pal).finish();
  const { m, start, size } = l.build(book);
  const map = m.build();
  const pic = renderRegion(map, lit, buildMonsterBlocks(pal).blocks, buildMonsters(mb, l.mons), ORIGIN, ORIGIN, size[0], size[1], [{ pixels: buildCharBlocks(pal).blocks[cb.n('front0')].pixels, x: start[0], y: start[1] }]);
  writePng(join(out, `${l.file}.png`), pic, pal.pal, 2);
}
console.log(`house ${buildHouse(day).index.size}, yard ${buildYard(day).index.size} blocks, ${mb.index.size} monster blocks, ${cb.index.size} Carl blocks; previews in ${out}`);
