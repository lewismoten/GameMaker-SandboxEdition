// Design previews (never on the disk): the block sheet, and each room's whole map in each view's palette, as PNGs in the
// folder given (default: the system temp dir); plus every picture on the built disk.
//   cd web && npx vite-node ../games/color-doors/tools/preview.ts [outDir]
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { buildLevels } from '../src/levels';
import { VIEWS, viewPalette } from '../src/views';

const out = process.argv[2] ?? join(tmpdir(), 'color-doors-preview');
mkdirSync(out, { recursive: true });
const { book, pal, hall, gallery } = buildLevels();
const bbl = book.finish();
writePng(join(out, 'blocks.png'), blockSheet(bbl.slice(0, book.index.size), 12, 0), pal.pal, 3);
const none = Array.from({ length: 50 }, () => bbl[0]);
for (const l of [hall, gallery]) {
  const pic = renderRegion(l.map.done(), bbl, none, [], ORIGIN, ORIGIN, l.map.width, l.map.height);
  VIEWS.forEach((v) => writePng(join(out, `${l.file}-${v.file.replace('.pal', '')}.png`), pic, viewPalette(pal.pal, v.kind), 1));
}
const disk = new URL('../disk/', import.meta.url);
for (const f of readdirSync(disk).filter((n) => n.endsWith('.gif'))) {
  const g = decodeGif(readFileSync(new URL(f, disk)));
  const p = new Pixels(g.width, g.height);
  p.px.set(g.pixels);
  writePng(join(out, `pic-${f.replace('.gif', '')}.png`), p, g.palette, 2);
}
console.log(`previews in ${out}`);
