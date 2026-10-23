// What every group's block set has: the attributes the game agrees on, and the things to pick
// up, drawn over whichever backdrop they sit on (a block has no see-through pixels, so a coin on
// the office carpet and a coin on the kitchen tiles are two blocks):
//   - tips (money): a coin (+1) and a dollar bill (+5), with a few points;
//   - a mug of coffee mends composure (+20; +10 in the last two sets, home and outside, so the
//     night's end has some bite);
//   - the spotlight where the poet starts each monologue: the only block in a monologue's scene
//     that gives points alone, so it plays the score sound, which each scene's .SND fills with
//     the monologue's opening line. It goes dark once he steps out of it.
// Name them `<what>@<backdrop>`: coin@carpet, bill@carpet, mug@carpet, spot@stage.
import { Pixels } from '../../../kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import { BlockBook, SOLID } from '../../../snowbound/src/blocks/book';
import { micro } from '../../../snowbound/src/art/font';
import type { Pal } from '../art/pal';
import { MONEY, PLOT } from '../ids';

export { BlockBook, SOLID };
/** Solid on top only: stand on it, hop up through it. */
export const LEDGE = 1;
export const GRAV = { none: 0, up: 1, right: 2, down: 4, left: 8 } as const;
/** Air: what falls. */
export const AIR = { grav: GRAV.down };
/** Effect numbers for blocks (1 lives, 3 money, 20.. the extra counters). */
export const LIFE = 1;

const copy = (bg: Pixels) => bg.crop(0, 0, 20, 20);

/** A gold coin standing on its edge at the bottom of the block. */
export function drawCoin(p: Pixels, pal: Pal, x = 10, y = 15): Pixels {
  const c = pal.c;
  p.disc(x, y, 3.6, c('gold', 0))
    .disc(x - 0.4, y - 0.4, 2.8, c('gold', 2))
    .disc(x - 1, y - 1, 1, c('gold', 3));
  p.rect(x - 1, y - 1, 1, 3, c('gold', 1));
  return p;
}

/** A dollar bill, folded once. */
export function drawBill(p: Pixels, pal: Pal, x = 3, y = 12): Pixels {
  const c = pal.c;
  p.rect(x, y, 14, 7, c('green', 1))
    .rect(x + 1, y + 1, 12, 5, c('green', 2))
    .frame(x, y, 14, 7, c('green', 0));
  p.disc(x + 7, y + 3.5, 1.8, c('green', 3)).set(x + 7, y + 3, c('green', 1));
  micro(p, x + 1, y + 1, '1', c('green', 0));
  return p;
}

/** A white mug of coffee, steaming. */
export function drawMug(p: Pixels, pal: Pal, x = 6, y = 11): Pixels {
  const c = pal.c;
  p.rect(x, y, 8, 8, c('white', 1))
    .rect(x + 1, y, 6, 7, c('white', 2))
    .rect(x + 1, y, 6, 1, c('coffee', 2));
  p.rect(x + 8, y + 2, 2, 1, c('white', 1))
    .rect(x + 9, y + 2, 1, 4, c('white', 1))
    .rect(x + 8, y + 5, 2, 1, c('white', 1));
  p.set(x + 2, y - 2, c('white', 0))
    .set(x + 3, y - 3, c('white', 0))
    .set(x + 5, y - 2, c('white', 0))
    .set(x + 4, y - 4, c('white', 0));
  return p;
}

/** The spotlight on the boards: an X of gaffer's tape in a pool of light. */
export function drawSpot(p: Pixels, pal: Pal, on: boolean): Pixels {
  const c = pal.c;
  if (on)
    for (let y = 0; y < 20; y++) {
      const half = 3 + y * 0.35;
      for (let x = Math.round(10 - half); x <= 10 + half; x++) if ((x + y) % 2 === 0) p.set(x, y, c('spot', y > 15 ? 1 : 0));
    }
  p.line(6, 17, 13, 19, c('gold', 2)).line(6, 19, 13, 17, c('gold', 2));
  return p;
}

/**
 * Adds the pick-ups over a backdrop: coin@bg, bill@bg, mug@bg (each turns back into `bg` when
 * taken). `bg` must already be in the book.
 */
export function loot(book: BlockBook, pal: Pal, bg: string, extra: { attrs?: object; mugHp?: number } = {}): void {
  const pic = book.pics.get(bg);
  if (!pic) throw new Error(`No backdrop ${bg}`);
  const a = extra.attrs ?? AIR;
  book.add(`coin@${bg}`, drawCoin(copy(pic), pal), { ...a, effect: MONEY, eamt: 1, score: 10, touch: bg });
  book.add(`bill@${bg}`, drawBill(copy(pic), pal), { ...a, effect: MONEY, eamt: 5, score: 50, touch: bg });
  book.add(`mug@${bg}`, drawMug(copy(pic), pal), { ...a, hp: extra.mugHp ?? 20, score: 10, touch: bg });
}

/** Adds the spotlight over a backdrop: spot@bg (points alone: the opening line), going dark into spotOff@bg. */
export function spotlight(book: BlockBook, pal: Pal, bg: string): void {
  const pic = book.pics.get(bg);
  if (!pic) throw new Error(`No backdrop ${bg}`);
  book.add(`spotOff@${bg}`, drawSpot(copy(pic), pal, false), AIR);
  book.add(`spot@${bg}`, drawSpot(copy(pic), pal, true), { ...AIR, score: 100, touch: `spotOff@${bg}` });
}

/**
 * A thing of the monologue's plot over a backdrop: counter 21 (+1) and a few points. `draw`
 * paints it on a copy of the backdrop.
 */
export function plotThing(book: BlockBook, bg: string, name: string, draw: (p: Pixels) => void, attrs: object = AIR): void {
  const pic = book.pics.get(bg);
  if (!pic) throw new Error(`No backdrop ${bg}`);
  const p = copy(pic);
  draw(p);
  book.add(name, p, { ...attrs, effect: PLOT, eamt: 1, score: 25, touch: bg });
}

/**
 * The monologue's last gate: solid until the poet has all `need` things of the plot, then it
 * takes them (the punch line: the spend sound), gives a thousand points and opens into `open`,
 * where the scene's link waits.
 */
export function gate(book: BlockBook, name: string, closed: Pixels, open: string, need: number): void {
  book.add(name, closed, { solid: SOLID, effect: PLOT, eamt: -need, score: 1000, touch: open });
}

/** A soft lump of light for glows. */
export function glow(p: Pixels, pal: Pal, cx: number, cy: number, r: number): Pixels {
  return blob(p, cx, cy, r, r, pal.r('spot'), 0, 2);
}
