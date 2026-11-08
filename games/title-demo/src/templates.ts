// The templates on MAKE A TITLE's disk: the whole 320 by 200 screen with the boxes where PLAYGAME
// writes its own words (src/templateBoxes.ts), so a game maker can draw a menu, high score, save or
// load picture around them. Two of each: T<NAME>.GIF with a grid every 20 pixels (a block), a tick
// every 10, the boxes hatched and labeled; and T<NAME>P.GIF, plain colors to paint over.
// The hatched area of a box is exactly where letters can land; its outline is one pixel outside.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { micro, microWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/microText';
import { centered, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../kit/starter/palette';
import type { Ink, Label, Template, TextBox } from './templateBoxes';

const W = 320;
const H = 200;
const LINE = 7;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
const hits = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** The heading and notes of each template, and the y of the heading. */
const NOTES: Record<string, { y: number; head: string; lines: string[]; linesY?: number }> = {
  TMENU: {
    y: 22,
    head: 'TMENU.GIF: THE MENU',
    lines: [
      '320X200. THE GAME WRITES IN THE HATCHED BOXES.',
      'DRAW AROUND THEM AND KEEP THEM PLAIN.',
      'A LINE EVERY 20 PIXELS (A BLOCK), A TICK EVERY 10.',
      'X, Y: TOP LEFT CORNER. W, H: WIDTH AND HEIGHT.',
    ],
  },
  TSCORES: { y: 14, head: 'TSCORES.GIF', lines: ['HIGH SCORES. KEEP THE HATCHED BOXES PLAIN. LINES EVERY 20, TICKS EVERY 10.'], linesY: 80 },
  TLOAD: { y: 10, head: 'TLOAD.GIF: LOAD GAME', lines: ['320X200. KEEP THE HATCHED BOXES PLAIN.', 'A LINE EVERY 20 PIXELS, A TICK EVERY 10.'] },
  TSAVE: { y: 10, head: 'TSAVE.GIF: SAVE GAME', lines: ['320X200. KEEP THE HATCHED BOXES PLAIN.', 'A LINE EVERY 20 PIXELS, A TICK EVERY 10.'] },
};

/** The ground a box's words read on, its hatching and its outline. Yellow reads only on dark. */
function inks(pal: Pal, ink: Ink): { ground: number; hatch: number; edge: number } {
  const { c } = pal;
  if (ink === 'YELLOW') return { ground: c('ink', 0), hatch: c('ink', 2), edge: c('ink', 0) };
  if (ink === 'RED') return { ground: c('white', 3), hatch: c('red', 4), edge: c('red', 1) };
  return { ground: c('white', 3), hatch: c('blue', 4), edge: c('blue', 1) };
}

/** The parts of a box the engine writes: each row, or the box itself. */
const parts = (b: TextBox): Rect[] => (b.rows && b.rows.length > 1 && b.rows[1] - b.rows[0] > 8 ? b.rows.map((y) => ({ x: b.x, y, w: b.w, h: 8 })) : [b]);

const labelsOf = (b: TextBox): Label[] => [b.label, ...(b.more ? [b.more] : [])];

/** Where a label's lines sit, with its plate. */
function labelRect(l: Label): Rect {
  const w = Math.max(...l.lines.map((s) => microWidth(s)));
  const x = l.right ? l.x - w : l.x;
  return { x: x - 1, y: l.y - 1, w: w + 2, h: l.lines.length * LINE + 1 };
}

/** The labeled template: grid, ticks, hatched boxes, labels and notes. */
export function templatePicture(pal: Pal, t: Template): Pixels {
  const { c } = pal;
  const paperC = c('white', 2);
  const plate = c('white', 3);
  const p = new Pixels(W, H, paperC);
  for (let x = 20; x < W; x += 20) p.rect(x, 0, 1, H, c('stone', 4));
  for (let y = 20; y < H; y += 20) p.rect(0, y, W, 1, c('stone', 4));
  for (let v = 10; v < W; v += 10) {
    const long = v % 20 === 0 ? 5 : 3;
    p.rect(v, 0, 1, long, c('stone', 1)).rect(v, H - long, 1, long, c('stone', 1));
    if (v < H) p.rect(0, v, long, 1, c('stone', 1)).rect(W - long, v, long, 1, c('stone', 1));
  }
  const taken: Rect[] = [];
  // outlines first, then the insides, so boxes that touch (the last score rows) read as one
  for (const b of t.boxes) for (const r of parts(b)) p.frame(r.x - 1, r.y - 1, r.w + 2, r.h + 2, inks(pal, b.ink).edge);
  for (const b of t.boxes) {
    const k = inks(pal, b.ink);
    for (const r of parts(b)) {
      p.rect(r.x, r.y, r.w, r.h, k.ground);
      for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if ((x + y) % 4 === 0) p.set(x, y, k.hatch);
      taken.push({ x: r.x - 2, y: r.y - 2, w: r.w + 4, h: r.h + 4 });
    }
  }
  const note = NOTES[t.file];
  const write = (x: number, y: number, lines: string[], col: number) => {
    const w = Math.max(...lines.map((l) => microWidth(l)));
    const r = { x: x - 1, y: y - 1, w: w + 2, h: lines.length * LINE + 1 };
    p.rect(r.x, r.y, r.w, r.h, plate);
    lines.forEach((l, i) => micro(p, x, y + i * LINE, l, col));
    taken.push(r);
  };
  const hw = textWidth(note.head);
  p.rect((W - hw) / 2 - 3, note.y - 3, hw + 6, 14, plate);
  centered(p, note.y, note.head, c('ink', 0));
  taken.push({ x: (W - hw) / 2 - 3, y: note.y - 3, w: hw + 6, h: 14 });
  const ny = note.linesY ?? note.y + 14;
  note.lines.forEach((l, i) => write(Math.round((W - microWidth(l)) / 2), ny + i * LINE, [l], c('ink', 1)));
  for (const b of t.boxes)
    for (const l of labelsOf(b)) {
      const r = labelRect(l);
      write(r.x + 1, r.y + 1, l.lines, c('ink', 0));
    }
  // the grid's numbers, where nothing else is
  for (let x = 40; x < W; x += 40) {
    const s = String(x);
    const r = { x: x + 2, y: 6, w: microWidth(s), h: 5 };
    if (!taken.some((q) => hits(q, r))) micro(p, r.x, r.y, s, c('stone', 0));
  }
  for (let y = 40; y < H; y += 40) {
    const s = String(y);
    const r = { x: 6, y: y + 2, w: microWidth(s), h: 5 };
    if (!taken.some((q) => hits(q, r))) micro(p, r.x, r.y, s, c('stone', 0));
  }
  return p;
}

/** The plain version: one calm color with each box in the ground its words read on, outlined. */
export function plainTemplate(pal: Pal, t: Template): Pixels {
  const p = new Pixels(W, H, pal.c('parch', 3));
  for (const b of t.boxes) {
    const k = inks(pal, b.ink);
    for (const r of parts(b)) p.frame(r.x - 1, r.y - 1, r.w + 2, r.h + 2, k.edge);
  }
  for (const b of t.boxes) for (const r of parts(b)) p.rect(r.x, r.y, r.w, r.h, inks(pal, b.ink).ground);
  return p;
}

/** Every label and note of a template, as rectangles (for the check that none covers a box). */
export function labelRects(t: Template): Rect[] {
  return t.boxes.flatMap((b) => labelsOf(b).map(labelRect));
}
