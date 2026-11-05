// Design previews (never on the disk): each level's block sheet, Kit from above, each level's whole map
// and every picture on the built disk, as PNGs in the folder given (default: the system temp dir).
//   cd web && npx vite-node ../games/corner-view/tools/preview.ts [outDir]
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { buildLevels } from '../src/levels';
import { buildTopHeroBlocks } from '../src/topHero';

const out = process.argv[2] ?? join(tmpdir(), 'corner-view-preview');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
for (const l of levels) {
  writePng(join(out, `blocks-${l.file}.png`), blockSheet(l.book.finish().slice(0, l.book.index.size), 12, 0), pal.pal, 3);
  const pic = renderRegion(l.map.done(), l.book.finish(), mbl, buildMonsters(mb), ORIGIN, ORIGIN, l.map.width, l.map.height);
  writePng(join(out, `${l.file}.png`), pic, pal.pal, 3);
}
// Kit from above: four facings, three steps each
const top = buildTopHeroBlocks(pal);
const grid = new Pixels(3 * 24 + 4, 4 * 24 + 4, pal.r('parch')[2]);
['down', 'up', 'right', 'left'].forEach((f, row) =>
  ['0', 'stand', '1'].forEach((st, col) => grid.blit(top.pics.get(`${f}.${st}`)!, 4 + col * 24, 4 + row * 24, 255)),
);
writePng(join(out, 'hero-top.png'), grid, pal.pal, 6);
const disk = new URL('../disk/', import.meta.url);
for (const f of readdirSync(disk).filter((n) => n.endsWith('.gif'))) {
  const g = decodeGif(readFileSync(new URL(f, disk)));
  const p = new Pixels(g.width, g.height);
  p.px.set(g.pixels);
  writePng(join(out, `pic-${f.replace('.gif', '')}.png`), p, g.palette, 2);
}
console.log(`previews in ${out}`);
