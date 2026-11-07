// Design previews (never on the disk), as PNGs in the folder given (default: the system temp dir): each level's block
// sheet and whole map, every picture on the built disk, and a contact sheet of each cartoon's frames.
//   cd web && npx vite-node ../games/lucky-cat/tools/preview.ts [outDir] [level]
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { buildCatBlocks, catPicture } from '../src/cat';
import { endingReel, introReel, REEL_SPEED } from '../src/reels';
import { finishBlocks } from '../src/level';
import { buildLevels } from '../src/levels';
import { LOOKS, swapped } from '../src/palette';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';

const out = process.argv[2] ?? join(tmpdir(), 'lucky-cat-preview');
const only = process.argv[3];
mkdirSync(out, { recursive: true });
const { pal, levels } = buildLevels();
const mb = monsterPictures(pal);
for (const l of levels) {
  if (only && l.file !== only) continue;
  const bbl = finishBlocks(l);
  const look = l.look ? swapped(pal, LOOKS[l.look]) : pal.pal;
  writePng(join(out, `blocks-${l.file}.png`), blockSheet(bbl.slice(0, l.book.index.size), 14, 0), look, 3);
  const pic = renderRegion(l.map.done(), bbl, finishMonsterPictures(mb), monsterSet(mb), ORIGIN, ORIGIN, l.map.width, l.map.height);
  writePng(join(out, `map-${l.file}.png`), pic, look, 1);
}
const disk = new URL('../disk/', import.meta.url);
if (!only) {
  for (const f of readdirSync(disk).filter((n) => n.endsWith('.gif'))) {
    const g = decodeGif(readFileSync(new URL(f, disk)));
    const p = new Pixels(g.width, g.height);
    p.px.set(g.pixels);
    writePng(join(out, `pic-${f.replace('.gif', '')}.png`), p, g.palette, 2);
  }
  const cat = catPicture(buildCatBlocks(pal), 'stand.top', 'stand');
  const reels = { intro: introReel(pal, levels[0].book, cat), ending: endingReel(pal, levels[0].book, catPicture(buildCatBlocks(pal), 'cheer.top', 'jump')) };
  for (const [name, r] of Object.entries(reels)) {
    const cols = 4;
    const want = 16;
    const sheet = new Pixels(cols * 160, Math.ceil(want / cols) * 100);
    let last = r.palettes[0];
    for (let n = 0; n < want; n++) {
      const i = Math.floor(((n + 0.5) * r.frames.length) / want);
      last = r.palettes[i];
      const ox = (n % cols) * 160;
      const oy = Math.floor(n / cols) * 100;
      for (let y = 0; y < 100; y++) for (let x = 0; x < 160; x++) sheet.set(ox + x, oy + y, r.frames[i][y * 2 * 320 + x * 2]);
    }
    writePng(join(out, `fli-${name}.png`), sheet, r.pal, 2);
    void last;
    console.log(`${name}: ${r.frames.length} frames, ${r.seconds(REEL_SPEED).toFixed(1)} s`);
  }
}
console.log(`previews in ${out}`);
