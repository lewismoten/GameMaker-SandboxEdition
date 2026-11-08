// Design previews (never on the disk): the block sheets, each level's whole map in its own inks, every picture on
// the built disk and twelve frames of each cartoon and street card, as PNGs in the folder given (default: the temp dir).
//   cd web && [MAPS_ONLY=1] npx vite-node ../games/pass-the-pie/tools/preview.ts [outDir]
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
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
import { basePal, buildPalette, moodBytes } from '../src/palette';

const out = process.argv[2] ?? join(tmpdir(), 'pass-the-pie-preview');
mkdirSync(out, { recursive: true });
const pal = basePal(buildPalette());
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
// MAPS_ONLY=1 stops after the block sheets and maps
if (process.env.MAPS_ONLY) process.exit(0);
const disk = new URL('../disk/', import.meta.url);
for (const f of readdirSync(disk)) {
  if (f.endsWith('.gif')) {
    const g = decodeGif(readFileSync(new URL(f, disk)));
    const p = new Pixels(g.width, g.height);
    p.px.set(g.pixels);
    writePng(join(out, `pic-${f.replace('.gif', '')}.png`), p, g.palette, 2);
  } else if (/^[a-z]+\.fli$/.test(f) && f !== 'sandlogo.fli') {
    // a cartoon or a street card, with the clips the build split off it (intro2.fli...) played on after it
    const parts = [f, ...[2, 3, 4, 5, 6, 7, 8, 9].map((n) => f.replace('.fli', `${n}.fli`)).filter((p) => existsSync(new URL(p, disk)))];
    const frames: { px: Uint8Array; pal: Uint8Array }[] = [];
    for (const part of parts) {
      const anim = parseFli(readFileSync(new URL(part, disk)));
      const canvas = newFliCanvas(anim);
      for (let n = 0; n < anim.frameCount; n++) {
        applyFliFrame(anim, n, canvas);
        frames.push({ px: Uint8Array.from(canvas.pixels), pal: Uint8Array.from(canvas.palette) });
      }
    }
    // twelve frames spread over the whole of it, each in its own palette, at half size
    const sheet = new Pixels(160 * 4, 100 * 3);
    const rgb: number[] = [];
    const picks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((k) => Math.min(frames.length - 1, Math.floor(((frames.length - 1) * (k + 0.5)) / 12)));
    picks.forEach((n, k) => {
      const fr = frames[n];
      for (let y = 0; y < 100; y++)
        for (let x = 0; x < 160; x++) {
          const c = fr.px[y * 2 * 320 + x * 2];
          sheet.set((k % 4) * 160 + x, Math.floor(k / 4) * 100 + y, rgbIndex(rgb, fr.pal, c));
        }
    });
    const flat = new Uint8Array(768);
    flat.set(rgb.slice(0, 768));
    writePng(join(out, `${f}-sheet.png`), sheet, flat, 2);
  }
}

/** The index of palette `pal`'s color `c` in a shared list of up to 256 colors (VGA 6-bit), adding it if new. */
function rgbIndex(rgb: number[], pal: Uint8Array, c: number): number {
  const [r, g, b] = [pal[c * 3], pal[c * 3 + 1], pal[c * 3 + 2]];
  for (let i = 0; i < rgb.length; i += 3) if (rgb[i] === r && rgb[i + 1] === g && rgb[i + 2] === b) return i / 3;
  if (rgb.length >= 768) return 0;
  rgb.push(r, g, b);
  return rgb.length / 3 - 1;
}
console.log(`previews in ${out}`);
