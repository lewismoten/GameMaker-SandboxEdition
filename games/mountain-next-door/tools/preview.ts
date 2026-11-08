// Design previews (never on the disk), as PNGs in the folder given (default: the system temp dir): each level's
// block sheet and whole map in its time of day, Tess and the monster pictures, every picture on the built disk,
// and a contact sheet of each cartoon's frames.
//   cd web && npx vite-node ../games/mountain-next-door/tools/preview.ts [outDir] [level]
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { finishBlocks } from '../src/level';
import { buildLevels } from '../src/levels';
import { MON_SETS, finishMonsterPictures, monsterPictures } from '../src/monsters';
import { lookOf } from '../src/palette';
import { REEL_SPEED, endingReel, introReel } from '../src/reels';
import { buildTessBlocks, tessPicture } from '../src/tess';

const out = process.argv[2] ?? join(tmpdir(), 'mountain-preview');
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
  const hero = buildTessBlocks(pal);
  writePng(join(out, 'tess.png'), blockSheet(hero.finish().slice(0, hero.index.size), 13, 0), pal.pal, 4);
  writePng(join(out, 'monsters.png'), blockSheet(mbl.slice(0, mb.index.size), 10, 0), lookOf(pal, 'dawn'), 4);
  const disk = new URL('../disk/', import.meta.url);
  for (const f of readdirSync(disk).filter((n) => n.endsWith('.gif'))) {
    const g = decodeGif(readFileSync(new URL(f, disk)));
    const p = new Pixels(g.width, g.height);
    p.px.set(g.pixels);
    writePng(join(out, `pic-${f.replace('.gif', '')}.png`), p, g.palette, 2);
  }
  const tess = tessPicture(hero, 'stand.top', 'stand');
  const reels = { intro: introReel(pal, levels[0].book, tess), ending: endingReel(pal, levels[0].book, tessPicture(hero, 'cheer2.top', 'cheer')) };
  for (const [name, r] of Object.entries(reels)) {
    const cols = 4;
    const want = 16;
    const sheet = new Pixels(cols * 160, Math.ceil(want / cols) * 100);
    for (let n = 0; n < want; n++) {
      const i = Math.floor(((n + 0.5) * r.frames.length) / want);
      const ox = (n % cols) * 160;
      const oy = Math.floor(n / cols) * 100;
      for (let y = 0; y < 100; y++) for (let x = 0; x < 160; x++) sheet.set(ox + x, oy + y, r.frames[i][y * 2 * 320 + x * 2]);
    }
    writePng(join(out, `fli-${name}.png`), sheet, r.palettes[Math.floor(r.frames.length / 2)], 2);
    console.log(`${name}: ${r.frames.length} frames, ${r.seconds(REEL_SPEED).toFixed(1)} s`);
  }
}
console.log(`previews in ${out}`);
