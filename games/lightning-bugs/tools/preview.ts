// Design previews (never on the disk): each level's block sheet, each whole level as a picture with its fireflies where they
// start (all dark: they start at their first picture), and every picture on the built disk, as PNGs in the folder given
// (default: the system temp dir). shots.ts has the levels as the engine shows them while the fireflies blink.
//   cd web && npx vite-node ../games/lightning-bugs/tools/preview.ts [outDir]
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { buildBugBlocks, buildBugs } from '../src/bugs';
import { buildLevels } from '../src/levels';

const out = process.argv[2] ?? join(tmpdir(), 'lightning-bugs-preview');
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = buildBugBlocks(pal);
const mbl = mb.finish();
const mons = buildBugs(mb);
for (const l of levels) {
  const bbl = l.book.finish();
  writePng(join(out, `${l.file}-blocks.png`), blockSheet(bbl.slice(0, l.book.index.size), 12, 0), pal.pal, 3);
  writePng(join(out, `${l.file}-map.png`), renderRegion(l.map.done(), bbl, mbl, mons, ORIGIN, ORIGIN, l.map.width, l.map.height), pal.pal, 1);
}
const disk = new URL('../disk/', import.meta.url);
for (const f of readdirSync(disk).filter((n) => n.endsWith('.gif'))) {
  const g = decodeGif(readFileSync(new URL(f, disk)));
  const p = new Pixels(g.width, g.height);
  p.px.set(g.pixels);
  writePng(join(out, `pic-${f.replace('.gif', '')}.png`), p, g.palette, 2);
}
console.log(`previews in ${out}`);
