// Close-ups shown when Pip kneels by a rune carving or the Mines' brass key plate: the same glyphs
// as the floor blocks (wheel/glyphs.ts), four times as big, so they are easy to read off for the
// Royal Code Wheel.
import { type RGB, mix, clamp01, tnoise } from '../art/rgb';
import { glyphIn, letterRows } from '../art/runes';
import { RUNES, MARKS } from '../wheel/glyphs';
import { carve, type Carving, type Key } from '../wheel/wheel';
import { Screen } from './screen';

const CELL = 26;
const STONE: [RGB, RGB] = [
  [184, 176, 158],
  [120, 112, 100],
];
const BRASS: [RGB, RGB] = [
  [240, 202, 104],
  [164, 112, 36],
];

function backdrop(sc: Screen): void {
  sc.cv.shade((x, y) => mix([44, 36, 40], [10, 8, 12], clamp01(Math.hypot(x - 160, y - 96) / 200)));
}

function stone(sc: Screen, x: number, y: number, w: number, h: number): void {
  sc.cv.rrect(x + 3, y + 4, w, h, 4, [6, 4, 6]);
  sc.cv.rrect(x, y, w, h, 4, (px, py) => mix(STONE[0], STONE[1], 0.2 + 0.6 * tnoise(px, py, 6, 320, 17)));
}

function brassKey(sc: Screen, k: Key, x: number, y: number, s: number): void {
  const w = CELL * (s / 4);
  for (const [i, rows, gs] of [
    [0, letterRows(k.letter), (s * 3) / 2],
    [1, RUNES[k.rune], s],
  ] as const) {
    const bx = x + i * (w + 2);
    sc.cv.rrect(bx, y, w, w * 1.3, 3, (px, py) => mix(BRASS[0], BRASS[1], clamp01((px - bx + py - y) / (w * 2.3))));
    glyphIn(sc.cv, [...rows], bx, y, w, w * 1.3, gs, [84, 50, 16], [255, 236, 170]);
  }
}

/** A carving: its brass key, then its lines of runes, as it lies in the floor; `place` under it. */
export function carvingScreen(c: Carving, place: string): Screen {
  const sc = new Screen();
  backdrop(sc);
  const cols = 3 + Math.max(...c.lines.map((l) => l.length));
  const x0 = Math.round((320 - cols * CELL) / 2);
  const y0 = 100 - Math.round((c.lines.length * CELL * 1.3) / 2);
  stone(sc, x0 - 8, y0 - 8, cols * CELL + 16, c.lines.length * CELL * 1.3 + 16);
  brassKey(sc, c.key, x0, y0, 4);
  c.lines.forEach((line, i) =>
    carve(line, c.key).forEach((r, j) => {
      if (r) glyphIn(sc.cv, RUNES[r], x0 + (3 + j) * CELL, y0 + i * CELL * 1.3, CELL, CELL * 1.3, 4, [48, 42, 40], [226, 220, 204]);
    }),
  );
  sc.centered(184, place, [200, 190, 170], 1, [0, 0, 0]);
  return sc;
}

/** The Mines' brass key plate, and the four doors in the bulkhead beside it, west to east. */
export function plateScreen(k: Key, doors: string[][], place: string): Screen {
  const sc = new Screen();
  backdrop(sc);
  stone(sc, 108, 18, 104, 70);
  brassKey(sc, k, 120, 28, 6);
  doors.forEach((marks, i) => {
    const x = 22 + i * 72;
    const y = 104;
    sc.cv.rect(x + 3, y + 4, 60, 70, [6, 4, 6]);
    sc.cv.rect(x, y, 60, 70, (px) => mix([150, 102, 56], [104, 68, 36], ((px - x) % 12) / 14));
    sc.cv.rect(x, y, 60, 22, (px, py) => mix(BRASS[0], BRASS[1], clamp01((px - x + (py - y) * 2) / 100)));
    marks.forEach((m, j) => glyphIn(sc.cv, MARKS[m], x + 3 + j * 18, y + 2, 18, 18, 3, [60, 34, 10]));
    sc.cv.disc(x + 50, y + 48, 3, [230, 190, 90]);
  });
  sc.centered(186, place, [200, 190, 170], 1, [0, 0, 0]);
  return sc;
}
