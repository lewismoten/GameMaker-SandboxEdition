// Design previews (never on the disk): each scene's whole map with its monsters and the poet at
// his start, and each group's block and monster sheets, as PNGs in the folder given.
//   cd web && npx vite-node ../games/sweats/tools/preview.ts <outDir> [scene names...]
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { newMonsterSet } from '../../../web/src/formats/monster';
import { blockSheet, writePng } from '../../kit/png';
import { renderRegion } from '../../snowbound/src/art/render';
import { buildPalette } from '../src/art/pal';
import { BlockBook } from '../src/common/blocks';
import { commonMonsters } from '../src/common/characters';
import { MapBuilder, ORIGIN } from '../src/levels/maps';
import { buildCharBlocks, commonSprites, makeBook } from '../src/common/sprites';
import { SCENES } from '../src/scenes';
import type { Group } from '../src/groups/types';

const out = process.argv[2] ?? join(tmpdir(), 'sweats-preview');
const only = process.argv.slice(3);
mkdirSync(out, { recursive: true });

function sets(g: Group, pal: ReturnType<typeof buildPalette>) {
  const book = new BlockBook();
  g.blocks(book, pal);
  const mb = makeBook('mbl');
  commonSprites(mb, pal);
  g.sprites(mb, pal);
  return { book, bbl: book.finish(), mb };
}

const sheets = new Set<string>();
for (const def of SCENES) {
  if (only.length && !only.includes(def.name)) continue;
  const g = def.group;
  const pal = buildPalette(g.ramps, def.light);
  const s = sets(g, pal);
  if (!sheets.has(g.id)) {
    sheets.add(g.id);
    const clear = (p: ReturnType<typeof blockSheet>) => p.map((_x, _y, v) => (v === 255 ? pal.c('sky', 4) : v));
    writePng(join(out, `${g.id}-blocks.png`), blockSheet(s.bbl.slice(0, s.book.index.size), 15), pal.pal, 3);
    writePng(join(out, `${g.id}-sprites.png`), clear(blockSheet(s.mb.blocks.slice(0, s.mb.index.size), 12)), pal.pal, 3);
  }
  const m = new MapBuilder(s.book, def.filler, def.legend);
  const { start, size } = def.build(m);
  const mons = newMonsterSet();
  commonMonsters(mons, s.mb);
  def.monsters(mons, s.mb);
  const cb = buildCharBlocks(pal);
  const [w, h] = size ?? [60, 12];
  const pic = renderRegion(m.build(), s.bbl, s.mb.blocks, mons, ORIGIN, ORIGIN, w, h, [
    { pixels: cb.blocks[cb.n('front')].pixels, x: start[0] + ORIGIN, y: start[1] + ORIGIN },
  ]);
  writePng(join(out, `${def.name}.png`), pic, pal.pal, 1);
}
console.log(`previews in ${out}`);
