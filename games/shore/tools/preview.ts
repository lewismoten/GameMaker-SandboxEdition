// Design previews (never on the disk): each level's block sheet, Kit's top-down poses, the water frames and shore loops
// side by side, each level's whole map at three moments and every picture on the built disk, as PNGs in the folder given
// (default: the system temp dir).
//   cd web && npx vite-node ../games/shore/tools/preview.ts [outDir]
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { buildMonsterBlocks, buildMonsters } from '../../kit/starter/monsters';
import { buildTopHeroBlocks } from '../../kit/starter/topHero';
import { finishBlocks } from '../src/blocks';
import { buildLevels } from '../src/levels';
import { mapAt } from './frames';

const out = process.argv[2] ?? join(tmpdir(), 'shore-preview');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const top = buildTopHeroBlocks(pal);
const grid = new Pixels(3 * 24 + 4, 4 * 24 + 4, pal.r('parch')[2]);
['down', 'up', 'right', 'left'].forEach((f, row) =>
  ['0', 'stand', '1'].forEach((st, col) => grid.blit(top.pics.get(`${f}.${st}`)!, 4 + col * 24, 4 + row * 24, 255)),
);
writePng(join(out, 'hero-top.png'), grid, pal.pal, 6);
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
for (const l of levels) {
  const bbl = finishBlocks(l);
  writePng(join(out, `${l.file}-blocks.png`), blockSheet(bbl.slice(0, l.book.index.size), 12, 0), pal.pal, 3);
  for (const tick of [0, 12, 24]) {
    const m = mapAt(l, tick);
    const w = l.file === 'one' ? 64 : 62;
    const pic = renderRegion(m, bbl, mbl, buildMonsters(mb), 18, l.file === 'one' ? 38 : 38, w, l.file === 'one' ? 12 : 17);
    writePng(join(out, `${l.file}-t${tick}.png`), pic, pal.pal, 1);
  }
}
const disk = new URL('../disk/', import.meta.url);
for (const f of readdirSync(disk).filter((n) => n.endsWith('.gif'))) {
  const g = decodeGif(readFileSync(new URL(f, disk)));
  const p = new Pixels(g.width, g.height);
  p.px.set(g.pixels);
  writePng(join(out, `pic-${f.replace('.gif', '')}.png`), p, g.palette, 2);
}
console.log(`previews in ${out}`);
