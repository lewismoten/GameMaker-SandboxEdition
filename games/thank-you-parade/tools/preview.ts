// Design previews (never on the disk): each level's block sheet and whole map, Penny's poses, and every picture on the
// built disk, as PNGs in the folder given.
//   cd web && npx vite-node ../games/thank-you-parade/tools/preview.ts <outDir>
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { buildLevels } from '../src/levels';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';

const out = process.argv[2];
if (!out) throw new Error('usage: preview.ts <outDir>');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = monsterPictures(pal);
const mbl = finishMonsterPictures(mb);
const set = monsterSet(mb);
for (const l of levels) {
  const bbl = l.book.finish();
  writePng(join(out, `${l.file}-blocks.png`), blockSheet(bbl.slice(0, l.book.index.size), 14, 0), l.pal.pal, 3);
  const pic = renderRegion(l.map.done(), bbl, mbl, set, ORIGIN, ORIGIN, l.map.width, l.map.height);
  writePng(join(out, `${l.file}-map.png`), pic, l.pal.pal, 1);
}
writePng(join(out, 'monsters.png'), blockSheet(mbl.slice(0, mb.index.size), 6, 0), pal.pal, 5);
const disk = new URL('../disk/', import.meta.url);
for (const f of readdirSync(disk).filter((n) => n.endsWith('.gif'))) {
  const g = decodeGif(readFileSync(new URL(f, disk)));
  const p = new Pixels(g.width, g.height);
  p.px.set(g.pixels);
  writePng(join(out, `pic-${f.replace('.gif', '')}.png`), p, g.palette, 2);
}
console.log(`previews in ${out}`);
