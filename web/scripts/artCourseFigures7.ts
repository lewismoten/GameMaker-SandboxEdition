// Draws the figures of art course 7 ("Screens with words: titles, cartoons and talk") into src/artCourses/figures/.
// Most are the real screens of three Starters, read from their built disks (games/<id>/disk/): a title picture and its
// menu template, frames of a cartoon (FLI) and a talk card with its words laid over it the way PLAYGAME lays them.
// The sign figure is drawn here with the 8x8 font. The disks must be built (`npm run build:games` from the root); set
// GM_GAMES to another games folder to read its disks instead.
// Run from web/: npx vite-node scripts/artCourseFigures7.ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { applyFliFrame, newFliCanvas, parseFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { C, OUT, pal as kitPal, strip } from './artCourseKit';

const GAMES = process.env.GM_GAMES ?? fileURLToPath(new URL('../../games/', import.meta.url));
const disk = (game: string, file: string): Uint8Array => new Uint8Array(readFileSync(`${GAMES}/${game}/disk/${file}`));

function gif(game: string, file: string): { pic: Pixels; pal: Uint8Array } {
  const img = decodeGif(disk(game, file));
  const pic = new Pixels(img.width, img.height);
  pic.px.set(img.pixels);
  return { pic, pal: img.palette };
}

/** The 8x8 font at (x, y), one color: PLAYGAME's text rows. */
function write(p: Pixels, text: string, x: number, y: number, color: number): void {
  [...text].forEach((ch, i) => {
    for (let r = 0; r < 8; r++) {
      const bits = FONT8X8[ch.charCodeAt(0) * 8 + r];
      for (let c = 0; c < 8; c++) if ((bits >> c) & 1) p.set(x + i * 8 + c, y + r, color);
    }
  });
}

function figTitle(): void {
  const { pic, pal } = gif('title-demo', 'title.gif');
  writePng(`${OUT}screen-title.png`, pic, pal, 2);
  const board = gif('title-demo', 'boxes.gif');
  writePng(`${OUT}screen-board.png`, board.pic, board.pal, 2);
  // the colors the title uses, as chips beside it, in palette order, on a gray no color of the title uses
  const used = [...new Set(pic.px)].sort((a, b) => a - b);
  console.log('title colors used:', used.length);
  const free = [...Array(256).keys()].find((c) => !used.includes(c)) ?? 255;
  const chip = 12;
  const cols = 8;
  const sheet = new Pixels(320 + 8 + cols * chip, 200, free);
  sheet.blit(pic, 0, 0);
  used.forEach((c, i) => sheet.rect(328 + (i % cols) * chip, Math.floor(i / cols) * chip, chip - 1, chip - 1, c));
  const p2 = pal.slice();
  p2.set([40, 40, 44], free * 3);
  writePng(`${OUT}screen-colors.png`, sheet, p2, 2);
}

function figCartoon(): void {
  const anim = parseFli(disk('pictures-and-cartoons', 'bloom.fli'));
  console.log('bloom frames', anim.frameCount, 'speed', anim.speed);
  const canvas = newFliCanvas(anim);
  const picks = [0, 10, 20, 30, 33, 39];
  const shots = new Map<number, Pixels>();
  let pal = canvas.palette;
  for (let n = 0; n < anim.frameCount; n++) {
    applyFliFrame(anim, n, canvas);
    if (n === 20) pal = canvas.palette.slice();
    if (picks.includes(n)) {
      const f = new Pixels(320, 200);
      f.px.set(canvas.pixels);
      shots.set(n, f);
    }
  }
  const sheet = new Pixels(320 * 3 + 8, 200 * 2 + 4, 255);
  picks.forEach((n, i) => sheet.blit(shots.get(n)!, (i % 3) * 324, Math.floor(i / 3) * 204));
  const p2 = pal.slice();
  p2.set([40, 40, 44], 255 * 3);
  writePng(`${OUT}screen-cartoon.png`, sheet, p2, 1);
}

function figTalk(): void {
  const { pic, pal } = gif('dialog', 'crowd1.gif');
  // PLAYGAME's Display_File: 8x8 letters from x 40, y 40, a row every 8 pixels, all in one ink (the darkest color here)
  const dark = [...new Set(pic.px)].reduce((best, c) => (lum(pal, c) < lum(pal, best) ? c : best));
  const lines = disk('dialog', 'crowd1.txt');
  new TextDecoder()
    .decode(lines)
    .split(/\r?\n/)
    .forEach((line, i) => write(pic, line, 40, 40 + i * 8, dark));
  writePng(`${OUT}screen-talk.png`, pic, pal, 2);
}
const lum = (pal: Uint8Array, c: number): number => pal[c * 3] * 3 + pal[c * 3 + 1] * 6 + pal[c * 3 + 2];

/** A sign: a wooden board `w` blocks wide and `h` high, its words one line a row 9 pixels apart, on two posts. Words may spill. */
function sign(lines: string[], w: number, h: number): Pixels {
  const W = w * 20;
  const H = h * 20;
  const wide = Math.max(W, ...lines.map((l) => l.length * 8 + 8));
  const p = new Pixels(wide, H + 14, C.sky);
  const x0 = Math.floor((wide - W) / 2);
  p.rect(x0 + 3, H, 4, 14, C.w2).rect(x0 + W - 7, H, 4, 14, C.w2);
  p.rect(x0 + 1, 1, W - 2, H - 2, C.w2).rect(x0 + 3, 3, W - 6, H - 6, C.s3);
  p.rect(x0 + 1, 1, W - 2, 1, C.w3).rect(x0 + 1, H - 2, W - 2, 1, C.w0);
  const top = 3 + Math.floor((H - 6 - (lines.length * 9 - 1)) / 2);
  lines.forEach((l, i) => write(p, l, Math.floor((wide - l.length * 8) / 2), top + i * 9, C.ink));
  return p;
}

function figSigns(): void {
  const fits = [sign(['EXIT'], 3, 1), sign(['WATCH OUT'], 4, 1), sign(['MIND THE', 'GAP'], 4, 2)];
  const bad = sign(['MIND THE GAP'], 4, 1);
  const top = strip(fits, 8);
  const out = new Pixels(Math.max(top.w, bad.w), top.h + bad.h + 10, C.bg);
  out.blit(top, 0, 0);
  out.blit(bad, 0, top.h + 10);
  writePng(`${OUT}screen-signs.png`, out, kitPal, 4);
}

figTitle();
figCartoon();
figTalk();
figSigns();
