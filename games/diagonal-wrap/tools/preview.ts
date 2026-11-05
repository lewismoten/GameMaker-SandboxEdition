// Design previews (never on the disk): the block sheet, Kit's top-down poses, each level's whole 100x100 map
// and every picture on the built disk, as PNGs in the folder given (default: the system temp dir).
//   cd web && npx vite-node ../games/diagonal-wrap/tools/preview.ts [outDir]
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { buildLevels } from '../src/levels';
import { buildTopHeroBlocks } from '../src/topHero';

const out = process.argv[2] ?? join(tmpdir(), 'diagonal-wrap-preview');
mkdirSync(out, { recursive: true });
const { book, pal, levels } = buildLevels();
const bbl = book.finish();
writePng(join(out, 'blocks.png'), blockSheet(bbl.slice(0, book.index.size), 12, 0), pal.pal, 3);

// Kit from above: four facings, three steps each
const top = buildTopHeroBlocks(pal);
const grid = new Pixels(3 * 24 + 4, 4 * 24 + 4, pal.r('grass')[2]);
['down', 'up', 'right', 'left'].forEach((f, row) =>
  ['0', 'stand', '1'].forEach((st, col) => grid.blit(top.pics.get(`${f}.${st}`)!, 4 + col * 24, 4 + row * 24, 255)),
);
writePng(join(out, 'hero-top.png'), grid, pal.pal, 6);

const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
for (const l of levels) {
  const m = l.map.done();
  const pic = renderRegion(m, bbl, mbl, buildMonsters(mb), 0, 0, 100, 100);
  writePng(join(out, `${l.file}.png`), pic, pal.pal, 1);
}
const disk = new URL('../disk/', import.meta.url);
for (const f of readdirSync(disk).filter((n) => n.endsWith('.gif'))) {
  const g = decodeGif(readFileSync(new URL(f, disk)));
  const p = new Pixels(g.width, g.height);
  p.px.set(g.pixels);
  writePng(join(out, `pic-${f.replace('.gif', '')}.png`), p, g.palette, 2);
}
console.log(`previews in ${out}`);
