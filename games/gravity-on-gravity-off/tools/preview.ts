// Design previews (never on the disk): the block sheet, the hero's hurt pose, each level's whole map
// and every picture on the built disk, as PNGs in the folder given (default: the system temp dir).
//   cd web && npx vite-node ../games/gravity-on-gravity-off/tools/preview.ts [outDir]
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { buildLevels } from '../src/levels';
import { buildTopHeroBlocks } from '../../kit/starter/topHero';

const out = process.argv[2] ?? join(tmpdir(), 'gravity-on-gravity-off-preview');
mkdirSync(out, { recursive: true });
const { book, topBook, pal, levels } = buildLevels();
const sky = pal.c('sky', 3);
const bbl = book.finish();
const tbl = topBook.finish();
writePng(join(out, 'blocks.png'), blockSheet(bbl.slice(0, book.index.size), 12, 0), pal.pal, 3);
writePng(join(out, 'blocks-top.png'), blockSheet(tbl.slice(0, topBook.index.size), 12, 0), pal.pal, 3);

const hero = buildHeroBlocks(pal);
const poses: [string, string][] = [
  ['stand.top', 'stand'],
  ['cheer.top', 'jump'],
  ['up.top', 'jumpup'],
  ['oh.top', 'fall'],
];
const sheet = new Pixels(poses.length * 24 + 4, 44, sky);
poses.forEach(([t, b], i) => sheet.blit(heroPicture(hero, t, b), 4 + i * 24, 2, 255));
writePng(join(out, 'hero.png'), sheet, pal.pal, 5);
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
  const pic = renderRegion(m, l.book === book ? bbl : tbl, mbl, buildMonsters(mb), ORIGIN, ORIGIN, l.map.width, l.map.height);
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
