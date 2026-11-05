// Design previews (never on the disk): each level's block sheet, the hero's poses, each level's whole map at three moments
// (the stars twinkle) and every picture on the built disk, as PNGs in the folder given (default: the system temp dir).
//   cd web && npx vite-node ../games/twinkle/tools/preview.ts [outDir]
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
import { finishBlocks } from '../src/stars';
import { mapAt } from './frames';

const out = process.argv[2] ?? join(tmpdir(), 'twinkle-preview');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = buildMonsterBlocks(pal);
const mbl = mb.finish();
for (const l of levels) {
  const bbl = finishBlocks(l);
  writePng(join(out, `${l.file}-blocks.png`), blockSheet(bbl.slice(0, l.book.index.size), 12, 0), pal.pal, 3);
  for (const tick of [0, 10, 20]) {
    const pic = renderRegion(mapAt(l, tick), bbl, mbl, buildMonsters(mb), ORIGIN, ORIGIN, l.map.width, l.map.height);
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
