// STICK MAN STARS on paper: the world is a drawing on ruled notebook sheets, colored in here and there.
//   - paperRamps: three palette entries of its own (a ruled line, a crayon stroke, a seam shadow). A level drawn on
//     paper gives them colors (moods.ts); every other palette makes them the sky's own color, so they vanish there.
//   - paperize: every sky pixel of every background block becomes ruled paper with crayon strokes. The pattern
//     repeats every 20 pixels, so it runs on unbroken from block to block, behind signs, stars and doors alike.
//   - the blocks: a sheet's left edge (where it is taped over the last one): its cut edge and shadow, a binder
//     hole or a strip of tape, and the red margin line, in the air and in the ground; a hill drawn in pencil
//     with a little green crayon under its line; and a giant pencil standing on its end as a wall (its
//     sharpened tip, and its six-sided body).
//   - sketch and crayon: a dark house is a pencil drawing on white paper; a lit one is colored in with crayon.
import type { PaletteBuilder } from '@lewismoten/gamemaker-sandbox-tools/kit/palette';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { ORIGIN, type StarterMap } from '../../kit/starter/map';

/** A little five-pointed star, 7 by 7 (a constellation's, and a twinkle's). */
export const STAR7 = ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '.#...#.'];

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
  const ground = { grass: book.rulesOf('grass'), dirt: book.rulesOf('dirt') };
  // the hill, drawn on the sheet: a wobbly pencil line with green crayon scribbled under it, then plain paper
  const hill = () => {
    const p = blank();
    for (let x = 0; x < 20; x++) {
      const y = 3 + HILL[x];
      p.set(x, y, c('stone', 0));
      if ((x * 7) % 5 < 2) p.set(x, y + 1, c('stone', 2));
      for (let d = 1; d < 6; d++) if ((x * 2 + d * 3) % 5 === 0 && (d < 3 || (x + d) % 3 !== 0)) p.set(x, y + d, c('green', d < 3 ? 3 : 4));
    }
    return p;
  };
  const dirt = () => {
    const p = blank();
    for (const [x, y] of [
      [4, 3],
      [13, 9],
      [7, 15],
    ])
      p.set(x, y, c('green', 4)).set(x + 1, y - 1, c('green', 4));
    return p;
  };
  book.add('hill', hill(), ground.grass);
  book.add('hillPaper', dirt(), ground.dirt);
  // a sheet's left edge: the shadow it casts on the sheet under it, its cut edge, and its red margin line
  const edge = (p: Pixels) => p.rect(2, 0, 1, 20, c('paper', 2)).rect(3, 0, 1, 20, c('white', 1)).rect(16, 0, 1, 20, c('red', 3));
  // a binder hole punched through it: the sheet below shows, shaded along its top
  const hole = (p: Pixels) => {
    p.disc(9, 10, 4.6, c('stone', 1)).disc(9, 10.8, 4, c('stone', 3));
    return p;
  };
  // a strip of tape across the edge, its ends torn
  const tape = (p: Pixels) => {
    p.rect(0, 5, 20, 9, c('parch', 3)).rect(0, 5, 20, 1, c('parch', 4)).rect(0, 13, 20, 1, c('parch', 2));
    p.rect(2, 6, 1, 7, c('parch', 2)).rect(16, 6, 1, 7, c('red', 4));
    return p;
  };
  book.add('seam', edge(blank()), air);
  book.add('seamHole', hole(edge(blank())), air);
  book.add('tape', tape(edge(blank())), air);
  book.add('seamHill', edge(hill()), ground.grass);
  book.add('seamGround', edge(dirt()), ground.dirt);
  book.add('seamGroundHole', hole(edge(dirt())), ground.dirt);
  book.add('seamGroundTape', tape(edge(dirt())), ground.dirt);
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

/** How far the hill's pencil line wanders up or down across a block (it meets itself at the block's edges). */
const HILL = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, -1, -1, 0];

/** A sheet's rows, top to bottom of what the screen shows: a binder hole at 5, 9 and 12, tape at 7 and 11. */
const SHEET: Record<number, [string, string]> = {
  5: ['seamHole', ''],
  7: ['tape', ''],
  9: ['seamHole', ''],
  11: ['', 'seamGroundTape'],
  12: ['', 'seamGroundHole'],
};

/** The ground of a sheet drawn on: the hill's line on row `ground`, plain paper under it, from column x0 to x1. */
export function hillAt(m: StarterMap, x0: number, x1: number, ground: number, bottom: number): void {
  for (let x = x0; x <= x1; x++) {
    m.set(x, ground, 'hill');
    for (let y = ground + 1; y <= bottom; y++) m.set(x, y, 'hillPaper');
  }
}

/** The hill carries on past the level's two ends (the kit only carries its own grass and dirt there). Call once, before done(). */
export function hillPastEdges(m: StarterMap, book: Book): void {
  const done = m.done.bind(m);
  m.done = () => {
    const map = done();
    const hill = [book.n('hill'), book.n('hillPaper')];
    for (let y = ORIGIN; y < ORIGIN + m.height; y++) {
      const left = map.blocks[y * MLEN + ORIGIN];
      const right = map.blocks[y * MLEN + ORIGIN + m.width - 1];
      for (let x = 0; x < ORIGIN; x++) if (hill.includes(left)) map.blocks[y * MLEN + x] = left;
      for (let x = ORIGIN + m.width; x < MLEN; x++) if (hill.includes(right)) map.blocks[y * MLEN + x] = right;
    }
    return map;
  };
}

/** A sheet's left edge at column `x`, taped over the last sheet: from row `top` of the sky down to row `bottom` of the ground. */
export function seamAt(m: StarterMap, x: number, top: number, ground: number, bottom: number): void {
  for (let y = top; y < ground; y++) m.set(x, y, SHEET[y]?.[0] || 'seam');
  m.set(x, ground, 'seamHill');
  for (let y = ground + 1; y <= bottom; y++) m.set(x, y, SHEET[y]?.[1] || 'seamGround');
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
    if (k === clear || k === -1) return 'clear';
    const at = ramp.get(k);
    // a door's dark planks are their own part, so a wooden shed keeps its door's outline
    return at ? (at[0] === 'wood' && at[1] <= 1 ? 'door' : at[0]) : `#${k}`;
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
