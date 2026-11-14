// STICK MAN STARS on paper: the world is a drawing on ruled notebook sheets, colored in here and there.
//   - paperRamps: three palette entries of its own (a ruled line, a crayon stroke, a seam shadow). A level drawn on
//     paper gives them colors (moods.ts); every other palette makes them the sky's own color, so they vanish there.
//   - paperize: every sky pixel of every background block becomes ruled paper with crayon strokes. The pattern
//     repeats every 20 pixels, so it runs on unbroken from block to block, behind signs, stars and doors alike.
//   - the blocks: a seam where one sheet is taped to the next (plain, and with a strip of tape), and a giant
//     pencil standing on its end as a wall (its sharpened tip, and its six-sided body).
//   - sketch and crayon: a dark house is a pencil drawing on white paper; a lit one is colored in with crayon.
import type { PaletteBuilder } from '@lewismoten/gamemaker-sandbox-tools/kit/palette';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import type { StarterMap } from '../../kit/starter/map';

/** The paper's own ramp: [0] the ruled line, [1] a crayon stroke, [2] the shadow along a taped seam. */
export function paperRamps(b: PaletteBuilder): void {
  b.ramp('paper', 3, [60, 74, 140], [20, 24, 64], [26, 30, 78]);
}

/** Gives the paper ramp the sky's own color (a level not drawn on paper). */
export function hidePaper(pal: Uint8Array, sky: number, paper: number[]): void {
  for (const i of paper) pal.set(pal.subarray(sky * 3, sky * 3 + 3), i * 3);
}

/** Where a crayon stroke falls in a 20 by 20 tile: short diagonal strokes, broken up so they read as hand-colored. */
function stroke(x: number, y: number): boolean {
  if ((x + y) % 5 !== 0) return false;
  const h = (Math.imul(x * 31 + y * 17 + 7, 2654435761) >>> 0) % 7;
  return h < 3;
}

/** The ruled line, one a block, 15 pixels down. */
const RULE_Y = 15;

/** The paper behind everything: ruled lines over crayon-colored sky. */
function paperAt(pal: Pal, x: number, y: number): number {
  if (y === RULE_Y) return pal.c('paper', 0);
  return stroke(x, y) ? pal.c('paper', 1) : skyOf(pal);
}

/** Turns every sky pixel of every block in `book` into paper. */
export function paperize(book: Book, pal: Pal): void {
  const sky = skyOf(pal);
  for (const [name, pic] of book.pics) {
    const p = new Pixels(pic.w, pic.h, 0);
    p.px.set(pic.px);
    p.map((x, y, c) => (c === sky ? paperAt(pal, x % 20, y % 20) : c));
    book.redraw(name, p);
  }
}

/** The seam and tape blocks, and the pencil (tip and body). Call before paperize, so their sky is paper too. */
export function addPaperBlocks(book: Book, pal: Pal): void {
  const { c } = pal;
  const air = { grav: PULL.down };
  const blank = () => new Pixels(20, 20, skyOf(pal));
  // the seam: the next sheet's edge laps over this one, a pale cut edge with its shadow beside it
  const seam = () => blank().rect(9, 0, 1, 20, c('white', 1)).rect(10, 0, 1, 20, c('paper', 2));
  book.add('seam', seam(), air);
  // a strip of tape across the seam, its ends torn
  const tape = seam();
  tape.rect(2, 5, 16, 10, c('parch', 3)).rect(2, 5, 16, 1, c('parch', 4)).rect(2, 14, 16, 1, c('parch', 2));
  for (const y of [6, 8, 10, 12]) tape.set(1, y, c('parch', 3)).set(18, y + 1, c('parch', 3));
  tape.rect(9, 6, 1, 8, c('parch', 4)).rect(10, 6, 1, 8, c('parch', 2));
  book.add('tape', tape, air);
  // the pencil: a six-sided yellow body (three faces lit from the left), standing on its end
  const body = blank();
  const faces = [c('gold', 5), c('gold', 4), c('gold', 3), c('gold', 3), c('gold', 2), c('gold', 1)];
  for (let x = 4; x < 16; x++) body.rect(x, 0, 1, 20, faces[Math.floor(((x - 4) * 6) / 12)]);
  body.rect(3, 0, 1, 20, c('ink', 0)).rect(16, 0, 1, 20, c('ink', 0));
  body.rect(8, 0, 1, 20, c('gold', 2)).rect(12, 0, 1, 20, c('gold', 1));
  book.add('pencil', body, { solid: SOLID });
  // its sharpened tip: bare wood cut to a cone, and the graphite point
  const tip = blank();
  for (let y = 4; y < 20; y++) {
    const half = Math.round(((y - 4) * 6) / 15);
    const wood = y < 9 ? c('ink', 0) : y % 3 ? c('wood', 4) : c('wood', 3);
    tip.rect(10 - half, y, half * 2, 1, wood);
    tip.set(10 - half - 1, y, c('ink', 0)).set(10 + half, y, c('ink', 0));
  }
  tip.rect(3, 19, 14, 1, c('ink', 0));
  for (let x = 4; x < 16; x++) if (x % 3 === 0) tip.set(x, 18, c('wood', 2));
  book.add('pencilTip', tip, { solid: SOLID });
}

/** Two sheets taped together at column `x`: the seam from `top` down to the grass, tape at rows `taped`. */
export function seamAt(m: StarterMap, x: number, top: number, bottom: number, taped: number[]): void {
  for (let y = top; y <= bottom; y++) m.set(x, y, taped.includes(y) ? 'tape' : 'seam');
}

/** A giant pencil standing on its end at column `x`: its tip at row `top`, its body down to row `bottom`. */
export function pencilAt(m: StarterMap, x: number, top: number, bottom: number): void {
  m.set(x, top, 'pencilTip');
  for (let y = top + 1; y <= bottom; y++) m.set(x, y, 'pencil');
}

/** Which ramp and shade each palette index is, for the house passes. */
function rampOf(pal: Pal, names: string[]): Map<number, [string, number]> {
  const out = new Map<number, [string, number]>();
  for (const n of names) pal.r(n).forEach((idx, k) => out.set(idx, [n, k]));
  return out;
}
const RAMPS = ['ink', 'sky', 'white', 'wood', 'stone', 'gold', 'teal', 'red', 'blue', 'green', 'parch', 'brick', 'pink'];

/**
 * A dark house as a pencil drawing: white paper inside, a graphite line wherever one color meets another, the
 * windows' eyes as pencil dots. Gold (a lit lantern) keeps its color. `clear` is the picture's transparent index.
 */
export function sketch(p: Pixels, pal: Pal, clear: number): Pixels {
  const ramp = rampOf(pal, RAMPS);
  const src = new Pixels(p.w, p.h, clear);
  src.px.set(p.px);
  const group = (x: number, y: number) => {
    const k = src.get(x, y);
    return k === clear || k === -1 ? 'clear' : (ramp.get(k)?.[0] ?? `#${k}`);
  };
  const paper = pal.c('white', 3);
  const lead = pal.c('stone', 2);
  return p.map((x, y, k) => {
    if (k === clear) return k;
    const g = group(x, y);
    if (g === 'gold') return k;
    if (g === 'sky' || g === 'ink') return pal.c('stone', 0);
    const edge = (gx: string) => gx !== g && gx !== 'clear';
    return edge(group(x - 1, y)) || edge(group(x, y - 1)) ? lead : paper;
  });
}

/** A lit house colored in with crayon: every few pixels along a slant the color skips a shade lighter, or misses. */
export function crayon(p: Pixels, pal: Pal, clear: number): Pixels {
  const ramp = rampOf(pal, RAMPS);
  return p.map((x, y, k) => {
    if (k === clear) return k;
    const at = ramp.get(k);
    if (!at || at[0] === 'ink' || at[0] === 'gold' || at[0] === 'white') return k;
    if ((x * 2 + y) % 5 !== 0) return k;
    const r = pal.r(at[0]);
    return (x + y * 3) % 4 === 0 ? pal.c('white', 3) : r[Math.min(r.length - 1, at[1] + 1)];
  });
}
