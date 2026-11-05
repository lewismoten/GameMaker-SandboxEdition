// The friendly critters of LITTLE SHADOWS, drawn here (small, so a shadow fits under each in its 20x20 block):
//   pip    a round teal blob. It waddles (level 1) or hops on the spot (level 2).
//   bee    a round little bee that bobs in the air (level 3).
//   shade  the bee's shadow, a block of its own that goes along under it (level 3).
// Nothing here hurts: the blocks are not solid and take no hit points away.
import { newMonsterSet, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { shadowLayer, withShadow, type Shade } from './shadow';

const T = 255;

/** The monsters by number (their place in the .MON file). */
export const CRITTER = { pip: 0, hopNone: 1, hopSame: 2, hopShrink: 3, bee: 4, shade: 5 } as const;

/** A hop is six pictures: how many pixels the body is lifted in each, and how long each is shown (ticks). */
export const HOP_LIFT = [0, 2, 4, 6, 4, 2] as const;
export const HOP_TICKS = [8, 2, 2, 3, 2, 2] as const;
/** The shadow's half width (pixels) under each hop picture: smallest at the top, back to full on the ground. */
export const HOP_SHRINK = [8, 6.5, 5, 3.5, 5, 6.5] as const;
/** The shadow that does not change with the hop. */
export const HOP_SAME = 7;

/** A bee bob is four pictures: how far down the body is, how long each lasts, and how wide the shadow is under each (nearer the ground is wider). */
export const BOB_DOWN = [0, 2, 4, 2] as const;
export const BOB_TICKS = [3, 3, 3, 3] as const;
export const BOB_SHADOW = [6, 7, 8, 7] as const;

function eye(p: Pixels, pal: Pal, x: number, y: number): void {
  const { c } = pal;
  p.disc(x, y, 2.2, c('white', 3));
  p.rect(x, y - 1, 2, 3, c('ink', 0)).set(x + 1, y - 1, c('white', 3));
}

/** The pip's body: `lift` pixels above the ground, `squash` makes it wider and lower (landing). Its bottom edge is at row 15 on the ground. */
export function pipBody(pal: Pal, lift: number, squash: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const rx = squash ? 8.4 : lift > 4 ? 6.2 : 7;
  const ry = squash ? 3.8 : lift > 4 ? 4.4 : 4.6;
  const cy = 15 - ry - lift;
  blob(p, 10, cy, rx, ry, r('teal'), 0, 4);
  const ey = Math.round(cy - 0.5);
  eye(p, pal, 7, ey);
  eye(p, pal, 12, ey);
  p.set(9, ey + 3, c('ink', 0)).set(10, ey + 3, c('ink', 0));
  p.set(5, ey + 2, c('pink', 2)).set(14, ey + 2, c('pink', 2));
  return outline(p, c('ink', 0), { transparent: T });
}

/** A bee body (no shadow), `down` pixels lower than its highest, wings up or down. A round, smiling bee with no stinger. */
export function beeBody(pal: Pal, down: number, wingsUp: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const cy = 10 + down;
  const wy = wingsUp ? cy - 6 : cy - 4;
  blob(p, 7, wy, 3.2, 3.6, r('white'), 1, 3);
  blob(p, 13, wy, 3.2, 3.6, r('white'), 1, 3);
  blob(p, 10, cy, 7.6, 5.2, r('gold'), 0, 5);
  for (const x of [8, 12]) p.rect(x, cy - 5, 2, 10, c('ink', 0));
  p.rect(3, cy - 1, 2, 2, c('ink', 0)).set(2, cy, c('ink', 0));
  eye(p, pal, 15, cy - 1);
  p.set(15, cy + 3, c('ink', 0)).set(16, cy + 3, c('ink', 0));
  return outline(p, c('ink', 0), { transparent: T });
}

/** Hop picture `k` of a pip with no shadow, a shadow that never changes, or one that shrinks. `mark` paints the shadow in that color (for the manual). */
export function hopPicture(pal: Pal, kind: 'none' | 'same' | 'shrink', k: number, mark?: number): Pixels {
  const body = pipBody(pal, HOP_LIFT[k], k === 0);
  if (kind === 'none') return body;
  return kind === 'same' ? withShadow(body, 'solid', pal, HOP_SAME, mark) : withShadow(body, 'dither', pal, HOP_SHRINK[k], mark);
}

/** Bob picture `k` of the bee's shadow block. */
export const shadePicture = (pal: Pal, k: number, mark?: number): Pixels => shadowLayer('dither', mark ?? pal.c('ink', 1), BOB_SHADOW[k]);

/** The monsters' pictures (.MBL). `walker` is how the level's pip walks: with a solid shadow or a dithered one (levels 2 and 3 use their own shadows). */
export function buildCritterBlocks(pal: Pal, walker: Shade): Book {
  const book = new Book('mbl');
  const rules = { solid: 0, hp: 0 };
  for (const k of [0, 1]) book.add(`pip${k}`, withShadow(pipBody(pal, 0, k === 1), walker, pal, 7), rules);
  for (const [name, kind] of [
    ['hopNone', 'none'],
    ['hopSame', 'same'],
    ['hopShrink', 'shrink'],
  ] as const)
    HOP_LIFT.forEach((_lift, k) => book.add(`${name}${k}`, hopPicture(pal, kind, k), rules));
  BOB_DOWN.forEach((d, k) => book.add(`bee${k}`, beeBody(pal, d, k % 2 === 0), rules));
  BOB_SHADOW.forEach((_rx, k) => book.add(`shade${k}`, shadePicture(pal, k), rules));
  return book;
}

/** What each critter does (.MON). `run` is how many blocks the walkers go before they turn back. */
export function buildCritters(mb: Book, run = 4): Monster[] {
  const set = newMonsterSet();
  const loop = (name: string, ticks: readonly number[]): [number, number][] => ticks.map((t, k) => [mb.n(`${name}${k}`), t]);
  const base = { power: 150, thru: 0, end: -2 };
  set[CRITTER.pip] = mon(loop('pip', [5, 5]), { ...base, thru: 1 }, pace(run, 1));
  set[CRITTER.hopNone] = mon(loop('hopNone', HOP_TICKS), base);
  set[CRITTER.hopSame] = mon(loop('hopSame', HOP_TICKS), base);
  set[CRITTER.hopShrink] = mon(loop('hopShrink', HOP_TICKS), base);
  set[CRITTER.bee] = mon(loop('bee', BOB_TICKS), base, pace(run, 1));
  set[CRITTER.shade] = mon(loop('shade', BOB_TICKS), base, pace(run, 1));
  return set;
}
