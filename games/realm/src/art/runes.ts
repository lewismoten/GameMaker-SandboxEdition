// Painting the Royal Code Wheel's pixel glyphs (wheel/glyphs.ts) into the game: cut into stone (a
// dark groove with a lit lower lip) or struck into brass, at a whole-pixel scale, and the floor
// slabs, brass key plates and mine doors that carry them. The close-up screens use the same.
import { MICRO_GLYPHS } from '@lewismoten/gamemaker-sandbox-tools/microFont';
import { Canvas, type RGB, mix, tnoise } from './rgb';

/** A plain capital as glyph rows (the 3x5 sign font), for a key's letter. */
export function letterRows(c: string): string[] {
  const bits = MICRO_GLYPHS[c];
  if (!bits) throw new Error(`No sign letter ${c}`);
  return [0, 1, 2, 3, 4].map((r) =>
    bits
      .slice(r * 3, r * 3 + 3)
      .replace(/1/g, '#')
      .replace(/0/g, '.'),
  );
}

/** Glyph rows at (x, y), each pixel `s` square: the groove in `ink`, its lower-right lip in `lip`. */
export function glyph(cv: Canvas, rows: string[], x: number, y: number, s: number, ink: RGB, lip?: RGB): void {
  const on = (cx: number, cy: number) => rows[cy]?.[cx] === '#';
  for (let cy = 0; cy < rows.length; cy++)
    for (let cx = 0; cx < rows[cy].length; cx++) {
      if (!on(cx, cy)) continue;
      cv.rect(x + cx * s, y + cy * s, s, s, ink);
      // the lit edge where the cut comes back up to the surface
      if (lip && !on(cx, cy + 1)) cv.rect(x + cx * s, y + (cy + 1) * s, s, Math.max(1, s / 4), lip);
      if (lip && !on(cx + 1, cy)) cv.rect(x + (cx + 1) * s, y + cy * s, Math.max(1, s / 4), s, lip);
    }
}

/** Centers glyph rows at scale s in a w x h box at (x, y). */
export function glyphIn(cv: Canvas, rows: string[], x: number, y: number, w: number, h: number, s: number, ink: RGB, lip?: RGB): void {
  glyph(cv, rows, Math.round(x + (w - rows[0].length * s) / 2), Math.round(y + (h - rows.length * s) / 2), s, ink, lip);
}

const SLAB: [RGB, RGB] = [
  [178, 170, 152],
  [134, 126, 112],
];
const BRASS: [RGB, RGB] = [
  [236, 196, 96],
  [168, 118, 40],
];

/** A worn stone floor slab, a block square, with a rune cut in it (or none: the gap between words). */
export function slab(cv: Canvas, rows?: string[]): Canvas {
  cv.rect(0, 0, 20, 20, (x, y) => mix(SLAB[0], SLAB[1], 0.25 + 0.5 * tnoise(x, y, 4, 20, 31)));
  cv.rect(0, 19, 20, 1, [92, 86, 76]);
  cv.rect(19, 0, 1, 20, [92, 86, 76]);
  if (rows) glyphIn(cv, rows, 0, 0, 20, 20, 2, [52, 46, 42], [214, 208, 192]);
  return cv;
}

/** A brass key plate set in the floor: a letter or a rune struck into it. */
export function brass(cv: Canvas, rows: string[], s: number): Canvas {
  cv.rect(0, 0, 20, 20, [70, 52, 30]);
  cv.rrect(1, 1, 18, 18, 2, (x, y) => mix(BRASS[0], BRASS[1], (x + y) / 40));
  for (const [x, y] of [
    [3, 3],
    [16, 3],
    [3, 16],
    [16, 16],
  ])
    cv.rect(x, y, 1, 1, [110, 74, 24]);
  glyphIn(cv, rows, 0, 0, 20, 20, s, [84, 50, 16], [255, 236, 170]);
  return cv;
}

/** A timber door in the mine's bulkhead, the three marks struck on a brass plate over it. */
export function mineDoor(cv: Canvas, marks: string[][]): Canvas {
  cv.rect(0, 0, 20, 20, [58, 40, 24]);
  cv.rect(2, 7, 16, 13, (x, y) => mix([150, 102, 56], [104, 68, 36], ((x - 2) % 4) / 5 + (y - 7) / 60));
  for (let x = 5; x < 18; x += 4) cv.rect(x, 7, 1, 13, [70, 46, 26]);
  cv.rect(2, 11, 16, 1, [64, 42, 24]).rect(2, 16, 16, 1, [64, 42, 24]);
  cv.disc(15, 14, 1, [230, 190, 90]);
  // the plate: three marks, 1 2 3 from left to right
  cv.rect(0, 0, 20, 7, [70, 52, 30]);
  cv.rect(0, 0, 20, 6, (x, y) => mix(BRASS[0], BRASS[1], (x + y * 2) / 32));
  marks.forEach((m, i) => glyph(cv, m, 1 + i * 6, 0, 1, [60, 34, 10]));
  return cv;
}

/** The true door, swung open onto the cart track. */
export function mineDoorOpen(cv: Canvas): Canvas {
  cv.rect(0, 0, 20, 2, [58, 40, 24]);
  cv.rect(0, 0, 2, 20, [58, 40, 24]);
  cv.rect(2, 2, 3, 18, [120, 80, 44]);
  return cv;
}

/** The timber bulkhead the doors are hung in: planks and props. */
export function bulkhead(cv: Canvas): Canvas {
  cv.rect(0, 0, 20, 20, (x, y) => mix([118, 80, 44], [78, 52, 28], (y % 5) / 6 + 0.2 * tnoise(x, y, 3, 20, 7)));
  for (let y = 4; y < 20; y += 5) cv.rect(0, y, 20, 1, [52, 34, 18]);
  cv.rect(0, 0, 3, 20, [92, 62, 34]).rect(17, 0, 3, 20, [92, 62, 34]);
  return cv;
}
