// Design previews (never on the disk), as PNGs in the folder given (default: the system temp dir): each level's
// block sheet and whole map in its look, Nell and the actors, and every picture on the built disk.
//   cd web && npx vite-node ../games/noodle-observatory/tools/preview.ts [outDir] [level]
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { ORIGIN } from '../../kit/starter/map';
import { finishBlocks } from '../src/level';
import { buildLevels } from '../src/levels';
import { MON_SETS, finishMonsterPictures, monsterPictures } from '../src/monsters';
import { buildNellBlocks, buildRingBlocks } from '../src/nell';
import { lookOf } from '../src/palette';

const out = process.argv[2] ?? join(tmpdir(), 'noodle-preview');
const only = process.argv[3];
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = monsterPictures(pal);
const mbl = finishMonsterPictures(mb);
for (const l of levels) {
  if (only && l.file !== only) continue;
  const bbl = finishBlocks(l);
  const look = lookOf(pal, l.look);
  writePng(join(out, `blocks-${l.file}.png`), blockSheet(bbl.slice(0, l.book.index.size), 14, 0), look, 3);
  const pic = renderRegion(l.map.done(), bbl, mbl, MON_SETS[l.mon](mb), ORIGIN, ORIGIN, l.map.width, l.map.height);
  writePng(join(out, `map-${l.file}.png`), pic, look, 1);
}
if (!only) {
  const hero = buildNellBlocks(pal);
  const ring = buildRingBlocks(pal, hero);
  writePng(join(out, 'nell.png'), blockSheet(hero.finish().slice(0, hero.index.size), 13, 0), pal.pal, 4);
  writePng(join(out, 'ring.png'), blockSheet(ring.finish().slice(0, ring.index.size), 3, 0), pal.pal, 4);
  writePng(join(out, 'actors.png'), blockSheet(mbl.slice(0, mb.index.size), 8, 0), lookOf(pal, 'dusk'), 4);
  const disk = new URL('../disk/', import.meta.url);
  for (const f of readdirSync(disk).filter((n) => n.endsWith('.gif'))) {
    const g = decodeGif(readFileSync(new URL(f, disk)));
    const p = new Pixels(g.width, g.height);
    p.px.set(g.pixels);
    writePng(join(out, `pic-${f.replace('.gif', '')}.png`), p, g.palette, 2);
  }
}
console.log(`previews in ${out}`);
