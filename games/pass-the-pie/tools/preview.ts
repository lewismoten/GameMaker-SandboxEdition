// Design previews (never on the disk): the block sheets, each level's whole map in its own palette mood, every
// picture on the built disk and a few frames of each cartoon, as PNGs in the folder given (default: the temp dir).
//   cd web && npx vite-node ../games/pass-the-pie/tools/preview.ts [outDir]
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyFliFrame, newFliCanvas, parseFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blockSheet, writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { renderRegion } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { ORIGIN } from '../../kit/starter/map';
import { buildLevels, finishBook } from '../src/levels';
import { finishMonsterPictures, monsterPictures, monsterSet } from '../src/monsters';
import { buildPalette, moodBytes } from '../src/palette';

const out = process.argv[2] ?? join(tmpdir(), 'pass-the-pie-preview');
mkdirSync(out, { recursive: true });
const pal = buildPalette();
const levels = buildLevels(pal);
const mb = monsterPictures(pal);
const mbl = finishMonsterPictures(mb);
for (const l of levels) {
  const bytes = moodBytes(pal, l.mood);
  const bbl = finishBook(l);
  writePng(join(out, `blocks-${l.file}.png`), blockSheet(bbl.slice(0, l.book.index.size), 12, 0), bytes, 3);
  const pic = renderRegion(l.map.done(), bbl, mbl, monsterSet(mb), ORIGIN, ORIGIN, l.map.width, l.map.height);
  writePng(join(out, `${l.file}.png`), pic, bytes, 1);
}
writePng(join(out, 'monsters.png'), blockSheet(mbl.slice(0, mb.index.size), 12, 0), pal.pal, 4);
const disk = new URL('../disk/', import.meta.url);
for (const f of readdirSync(disk)) {
  if (f.endsWith('.gif')) {
    const g = decodeGif(readFileSync(new URL(f, disk)));
    const p = new Pixels(g.width, g.height);
    p.px.set(g.pixels);
    writePng(join(out, `pic-${f.replace('.gif', '')}.png`), p, g.palette, 2);
  } else if (f === 'intro.fli' || f === 'ending.fli') {
    const anim = parseFli(readFileSync(new URL(f, disk)));
    const canvas = newFliCanvas(anim);
    const want = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((k) => Math.floor(((anim.frameCount - 1) * k) / 11)));
    const sheet = new Pixels(320 * 4, 200 * 3);
    let k = 0;
    for (let n = 0; n < anim.frameCount; n++) {
      applyFliFrame(anim, n, canvas);
      if (!want.has(n)) continue;
      const p = new Pixels(320, 200);
      p.px.set(canvas.pixels);
      sheet.blit(p, (k % 4) * 320, Math.floor(k / 4) * 200);
      k++;
      if (k === 12) break;
    }
    writePng(join(out, `${f}-sheet.png`), sheet, pal.pal, 1);
  }
}
console.log(`previews in ${out}`);
