// Draws the figures of art course 6 ("Words as monsters") into src/artCourses/figures/: word monsters drawn as real
// indexed 20x20 blocks from the PC's 8x8 font (the font the game's own text uses), turned around the way PLAYGAME
// turns a monster (orient 4: the block mirrored left to right), and the alphabet sorted into letters that mirror cleanly.
// Run from web/: npx vite-node scripts/artCourseFigures6.ts
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { C, save, strip } from './artCourseKit';

/** A letter's ink as rows of '#' and '.', trimmed to the columns it uses (the 8x8 cell has blank columns). */
function inkRows(ch: string): string[] {
  const rows = [...FONT8X8.subarray(ch.charCodeAt(0) * 8, ch.charCodeAt(0) * 8 + 8)].map((b) =>
    [...Array(8)].map((_, x) => ((b >> x) & 1 ? '#' : '.')).join(''),
  );
  const cols = [...Array(8).keys()].filter((x) => rows.some((r) => r[x] === '#'));
  const lo = Math.min(...cols);
  const hi = Math.max(...cols);
  return rows.map((r) => r.slice(lo, hi + 1));
}

/** A letter mirrors cleanly when its ink is its own mirror image. */
const mirrorsCleanly = (ch: string): boolean => inkRows(ch).every((r) => r === [...r].reverse().join(''));

/** The width in pixels of a word set with one pixel between letters. */
const wordWidth = (word: string): number => [...word].reduce((n, ch) => n + inkRows(ch)[0].length, 0) + word.length - 1;

/** Draws a word at (x, y) in one color, letters a pixel apart. */
function letters(p: Pixels, word: string, x: number, y: number, color: number): void {
  let cx = x;
  for (const ch of word) {
    const rows = inkRows(ch);
    rows.forEach((r, ry) => [...r].forEach((c, rx) => c === '#' && p.set(cx + rx, y + ry, color)));
    cx += rows[0].length + 1;
  }
}

/** A plain rounded plate, a color and its shadow row. */
function plate(p: Pixels, x: number, y: number, w: number, h: number, top: number, low: number): void {
  p.rect(x + 1, y, w - 2, h, top)
    .rect(x, y + 1, w, h - 2, top)
    .rect(x + 1, y + h - 1, w - 2, 1, low)
    .rect(x, y + h - 2, 1, 1, low)
    .rect(x + w - 1, y + h - 2, 1, 1, low);
}

/** One word monster in a block: the word on a blue plate, two feet under it (`step` swaps which foot is raised). */
function monster(word: string, step = 0, withPlate = true): Pixels {
  const p = new Pixels(20, 20, C.sky);
  const w = wordWidth(word);
  const x = Math.floor((20 - w) / 2);
  if (withPlate) {
    plate(p, 1, 3, 18, 11, C.b1, C.b0);
    letters(p, word, x, 5, C.yel);
  } else letters(p, word, x, 5, C.ink);
  p.rect(5, 15 - (step ? 1 : 0), 3, 3, C.ink).rect(12, 15 - (step ? 0 : 1), 3, 3, C.ink);
  p.rect(5, 15 - (step ? 1 : 0), 3, 1, C.w1).rect(12, 15 - (step ? 0 : 1), 3, 1, C.w1);
  return p;
}

function figFlip(): void {
  const parts: Pixels[] = [];
  for (const word of ['NO', 'GO']) {
    const m = monster(word);
    parts.push(m, m.flipX());
  }
  save('word-flip', strip(parts, 6), 5);
}

function figAlphabet(): void {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const CELL = 11;
  const out = new Pixels(13 * CELL + 1, 4 * CELL + 1, C.bg);
  [...A].forEach((ch, i) => {
    const col = i % 13;
    const band = Math.floor(i / 13) * 2;
    const clean = mirrorsCleanly(ch);
    const cell = new Pixels(CELL - 1, CELL - 1, clean ? C.j2 : C.r0);
    const rows = inkRows(ch);
    const ox = Math.floor((CELL - 1 - rows[0].length) / 2);
    letters(cell, ch, ox, 1, clean ? C.ink : C.wht);
    out.blit(cell, 1 + col * CELL, 1 + band * CELL);
    out.blit(cell.flipX(), 1 + col * CELL, 1 + (band + 1) * CELL);
  });
  save('word-alphabet', out, 4);
}

function figPairs(): void {
  const parts: Pixels[] = [];
  for (const word of ['AH', 'OH', 'AHA']) {
    const m = monster(word, 0, word.length < 3);
    parts.push(m, m.flipX());
  }
  save('word-pairs', strip(parts, 6), 5);
}

function figTwoBlocks(): void {
  // TOOT across two monsters: a 40 x 20 plate cut into two blocks, then each block turned around where it stands.
  const whole = new Pixels(40, 20, C.sky);
  plate(whole, 1, 3, 38, 11, C.b1, C.b0);
  letters(whole, 'TOOT', Math.floor((40 - wordWidth('TOOT')) / 2), 5, C.yel);
  whole.rect(5, 15, 3, 3, C.ink).rect(12, 14, 3, 3, C.ink).rect(25, 14, 3, 3, C.ink).rect(32, 15, 3, 3, C.ink);
  const left = whole.crop(0, 0, 20, 20);
  const right = whole.crop(20, 0, 20, 20);
  const asDrawn = strip([left, right], 0);
  const turned = strip([left.flipX(), right.flipX()], 0);
  const out = new Pixels(40, 46, C.bg);
  out.blit(asDrawn, 0, 0);
  out.blit(turned, 0, 26);
  save('word-two-blocks', out, 8);
}

function figReadable(): void {
  const faint = new Pixels(20, 20, C.sky);
  letters(faint, 'AH', 3, 5, C.k3);
  faint.rect(5, 15, 3, 3, C.k2).rect(12, 15, 3, 3, C.k2);
  save('word-readable', strip([faint, monster('AH', 0), monster('AH', 1), monster('AHA', 0, false), monster('OH', 0, false)], 6), 5);
}

figFlip();
figAlphabet();
figPairs();
figTwoBlocks();
figReadable();
