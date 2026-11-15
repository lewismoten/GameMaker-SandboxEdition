// The cliff and its waterfall. The fall is four blocks wide (left, two middles, right) and as many tall as the cliff,
// in three kinds of ring:
//   body   a pattern of white and blue streaks that slides down 5 pixels each frame. The pattern repeats every 20
//          pixels, the height of a block, so a block of it joins the block below without a seam, and sliding it by a
//          quarter of its height four times is a loop that never shows where it starts. 3 ticks a frame, all even.
//   lip    the top of the fall: a lit surface with ripples, then the body's own streaks (same columns, same 5 pixels a frame,
//          same 3 ticks), so every streak runs on from the lip into the body without a jump.
//   splash the foot of the fall: the body's streaks again down to the pool, where foam boils up in a different place each
//          frame; its times are the body's too, or the streaks above the foam would speed up and slow down.
// Everything is drawn on a rock backdrop where it meets the cliff, so the fall reads as water running down a rock face.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';

/** The four columns of the fall. */
export type Col = 'L' | 'M' | 'N' | 'R';
export const COLS: Col[] = ['L', 'M', 'N', 'R'];

export const BODY_TICKS = [3, 3, 3, 3];
export const LIP_TICKS = [3, 3, 3, 3];
export const SPLASH_TICKS = [3, 3, 3, 3];

/** A streak of the pattern: where it starts across the block, where down it starts, how long and wide, and its shade (0 white, 1 pale blue, 2 blue). */
interface Streak {
  x: number;
  y: number;
  len: number;
  w: number;
  shade: 0 | 1 | 2;
}

/** The streaks of one column: a fixed pattern (seeded), so the four columns differ but every build matches. */
function streaks(col: Col): Streak[] {
  const rand = rng(7 + COLS.indexOf(col) * 12);
  const out: Streak[] = [];
  // spread across the width: one streak every 3 to 5 pixels, each a different length and place down the period
  for (let x = 1; x < 19; x += 2 + Math.floor(rand() * 2)) {
    out.push({ x, y: Math.floor(rand() * 20), len: 8 + Math.floor(rand() * 8), w: rand() < 0.4 ? 2 : 1, shade: rand() < 0.5 ? 0 : 1 });
    if (rand() < 0.7) out.push({ x: x + 1, y: Math.floor(rand() * 20), len: 4 + Math.floor(rand() * 5), w: 1, shade: 2 });
  }
  return out;
}

/** The water's colors: a pale blue base, white streaks, and blue shade streaks. */
function colors(pal: Pal): { base: number; shade: [number, number, number] } {
  const { c } = pal;
  return { base: c('sky', 4), shade: [c('white', 3), c('sky', 5), c('blue', 3)] };
}

/** The body of the fall at frame k: the pattern moved down 5k pixels, with the rock's shadow on the outer edges. */
export function bodyFrame(pal: Pal, col: Col, k: number, step = 5): Pixels {
  const { base, shade } = colors(pal);
  const p = new Pixels(20, 20, base);
  for (const s of streaks(col)) for (let i = 0; i < s.len; i++) for (let w = 0; w < s.w; w++) p.set(s.x + w, (s.y + i + step * k) % 20, shade[s.shade]);
  edges(p, pal, col);
  return p;
}

/** Shade the sides where the water meets the rock, and brighten the middle (a mist of white at the very edge). */
function edges(p: Pixels, pal: Pal, col: Col): void {
  const { c } = pal;
  if (col === 'L')
    for (let y = 0; y < 20; y++)
      p.set(0, y, c('blue', 2))
        .set(1, y, c('blue', 3))
        .set(2, y, p.get(2, y) === c('sky', 4) ? c('sky', 3) : p.get(2, y));
  if (col === 'R')
    for (let y = 0; y < 20; y++)
      p.set(19, y, c('blue', 2))
        .set(18, y, c('blue', 3))
        .set(17, y, p.get(17, y) === c('sky', 4) ? c('sky', 3) : p.get(17, y));
}

/** The lip at frame k: sky above a surface that curls over the rock's edge, ripples sliding across it, then the streaks beginning to fall (faster than the body's). */
export function lipFrame(pal: Pal, col: Col, k: number, bg: number): Pixels {
  const { c } = pal;
  const { base, shade } = colors(pal);
  const p = new Pixels(20, 20, bg);
  const top = 5;
  p.rect(0, top, 20, 20 - top, base);
  for (let x = 0; x < 20; x++) p.set(x, top, c('white', 3)); // the lit surface
  for (let r = 0; r < 2; r++) for (let x = 0; x < 20; x++) if ((x + 5 * k + r * 8) % 11 < 4) p.set(x, top + 2 + r * 2, shade[r === 0 ? 0 : 1]); // ripples slide across
  // below the ripples the body's own pattern, so a streak leaves the lip at the pixel it enters the body
  const body = bodyFrame(pal, col, k);
  for (let y = top + 4; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, body.get(x, y));
  edges(p, pal, col);
  // the rock's edge on each outer side, so the water sits in a notch in the cliff top
  if (col === 'L') p.rect(0, top - 2, 2, 3, c('stone', 2));
  if (col === 'R') p.rect(18, top - 2, 2, 3, c('stone', 2));
  return p;
}

/** The splash at frame k: the body's pattern for the top 8 rows, then foam boiling out of the pool, whose blobs are in different places in every frame. */
export function splashFrame(pal: Pal, col: Col, k: number): Pixels {
  const { c } = pal;
  const p = bodyFrame(pal, col, k);
  const foam = c('white', 3);
  const mist = c('sky', 5);
  const rand = rng(40 + (COLS.indexOf(col) + 1) * 10 + k * 3);
  p.rect(0, 9, 20, 11, c('sky', 4)); // below the streaks: the pool
  for (let i = 0; i < 11; i++) {
    const x = Math.floor(rand() * 20);
    const y = 5 + Math.floor(rand() * 6) + (k % 2);
    p.disc(x, y, 2 + Math.floor(rand() * 2), mist);
    p.disc(x + 0.5, y - 0.5, 1.6 + (k % 2) * 0.6, foam);
  }
  for (let x = 0; x < 20; x++) {
    const h = 9 + Math.round(2 * Math.sin(x * 0.9 + k * 1.7));
    p.rect(x, h, 1, 3, foam); // the pool's surface, foaming
    p.rect(x, h + 3, 1, 2, c('sky', 5));
  }
  for (let y = 15; y < 20; y++) for (let x = 0; x < 20; x++) if ((x + y * 3 + k * 5) % 7 === 0) p.set(x, y, c('blue', 3));
  edges(p, pal, col);
  return p;
}

/** The pool beside the splash: a surface with a pale line, over a rock backdrop (the cliff face), one block high. */
export function poolBlock(pal: Pal, rock: Pixels, seed: number): Pixels {
  const { c } = pal;
  const p = rock.crop(0, 0, 20, 20);
  const rand = rng(seed);
  p.rect(0, 11, 20, 9, c('blue', 3));
  p.rect(0, 11, 20, 2, c('sky', 4));
  for (let i = 0; i < 4; i++) p.rect(Math.floor(rand() * 15), 14 + Math.floor(rand() * 5), 4 + Math.floor(rand() * 3), 1, c('sky', 3 + (i % 2)));
  for (let x = 0; x < 20; x += 5) p.set(x + (seed % 3), 11, c('white', 3));
  return p;
}

/** A block of the cliff: rock (a stone ramp with a few cracks and lighter facets), capped with grass if `cap`, with a dark edge on `side`. */
export function rockBlock(pal: Pal, opts: { cap?: boolean; side?: 'L' | 'R'; seed: number }): Pixels {
  const { c } = pal;
  const rand = rng(opts.seed);
  const p = new Pixels(20, 20, c('stone', 1));
  for (let i = 0; i < 9; i++) {
    const x = Math.floor(rand() * 20);
    const y = Math.floor(rand() * 20);
    p.rect(x, y, 4 + Math.floor(rand() * 5), 2 + Math.floor(rand() * 3), c('stone', rand() < 0.5 ? 0 : 2));
  }
  for (let i = 0; i < 3; i++) {
    const x = 2 + Math.floor(rand() * 15);
    const y = Math.floor(rand() * 14);
    p.line(x, y, x + Math.floor(rand() * 5) - 2, y + 4 + Math.floor(rand() * 3), c('ink', 0));
  }
  if (opts.side === 'L') p.rect(0, 0, 2, 20, c('ink', 0)).rect(2, 0, 1, 20, c('stone', 0));
  if (opts.side === 'R') p.rect(18, 0, 2, 20, c('ink', 0)).rect(17, 0, 1, 20, c('stone', 0));
  if (opts.cap) {
    p.rect(0, 0, 20, 5, c('grass', 3)).rect(0, 0, 20, 2, c('grass', 4));
    for (let x = 0; x < 20; x += 2) p.set(x, 5, c('grass', 2)).set(x + 1, 5, c('grass', 2));
    p.rect(0, 5, 20, 1, c('grass', 1));
    if (opts.side === 'L') p.rect(0, 0, 2, 6, c('grass', 1));
    if (opts.side === 'R') p.rect(18, 0, 2, 6, c('grass', 1));
  }
  return p;
}
