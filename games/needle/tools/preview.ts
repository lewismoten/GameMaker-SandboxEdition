// Design previews (never on the disk): the camel in each of his four loads, posed (top block
// over bottom), and the monster sheet, as PNGs in the folder given (default: the system temp
// dir); with the levels built, every level map too.
//   cd web && npx vite-node ../games/needle/tools/preview.ts [outDir]
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { blockSheet, writePng } from '../../kit/png';
import { Pixels } from '../../kit/pixels';
import { buildPalette } from '../src/art/pal';
import { renderRegion } from '../../snowbound/src/art/render';
import { buildMonsters } from '../src/characters';
import { LEVELS } from '../src/levels/levels';
import { ORIGIN } from '../src/levels/maps';
import { buildCharBlocks, buildMonsterBlocks, FORMS, type Form } from '../src/sprites/sprites';

const out = process.argv[2] ?? join(tmpdir(), 'needle-preview');
mkdirSync(out, { recursive: true });
const day = buildPalette('plain');
const mb = buildMonsterBlocks(day);
writePng(join(out, 'monsters.png'), blockSheet(mb.blocks.slice(0, mb.index.size), 10, day.c('sky', 4)), day.pal, 4);
// the camel: every pose of every form, tall ones stacked, on the sky
const forms = Object.keys(FORMS) as Form[];
const names = [
  'stand',
  'blink',
  'chew',
  'walk0',
  'walk1',
  'walk2',
  'hop',
  'dream',
  'hurt',
  'kneel0',
  'kneel1',
  'crawl0',
  'crawl1',
  'faint0',
  'faint1',
  'stars0',
];
const sheet = new Pixels(names.length * 22, forms.length * 42, day.c('sky', 4));
forms.forEach((form, row) => {
  const cb = buildCharBlocks(day, form);
  names.forEach((name, col) => {
    const at = (n: string, dy: number) => {
      const i = cb.index.get(n);
      if (i === undefined) return;
      const p = new Pixels(20, 20);
      p.px.set(cb.blocks[i].pixels);
      sheet.blit(p, col * 22, row * 42 + dy, 255);
    };
    at(`${name}.top`, 0);
    at(name, 20);
  });
});
writePng(join(out, 'camel.png'), sheet, day.pal, 4);
for (const l of LEVELS) {
  const pal = buildPalette(l.light);
  const kit = l.blocks(pal);
  const { m, start, size } = l.build(kit.book);
  const bbl = kit.book.finish();
  const map = m.build();
  const cb = buildCharBlocks(pal, l.form);
  const camel = [
    { pixels: cb.blocks[cb.n('stand')].pixels, x: start[0], y: start[1] },
    { pixels: cb.blocks[cb.n('stand.top')].pixels, x: start[0], y: start[1] - 1 },
  ];
  const pic = renderRegion(map, bbl, mb.blocks, buildMonsters(mb, l.mons), ORIGIN, ORIGIN, size[0], size[1], camel);
  writePng(join(out, `${l.file}.png`), pic, pal.pal, 2);
  writePng(join(out, `${l.file}-blocks.png`), blockSheet(bbl.slice(0, kit.book.index.size), 12), pal.pal, 3);
}
console.log(`previews in ${out}`);
