// THE SHOW's pictures: the stage (a red curtain that folds, a valance with a gold fringe, wooden boards)
// and the actors, who are the kit's gumdrop in new colors: Pip (orange), Blu (blue) and the cameo (yellow
// with a party hat), each walking, standing and speaking, a speech bubble that says HI, and the curtain with
// a pair of eyes peeking out of it (an actor waiting backstage).
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { text } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';

const T = 255;

/** The kit's gumdrop with one color ramp swapped for another. */
export function recolor(pic: Pixels, from: number[], to: number[]): Pixels {
  return pic.crop(0, 0, 20, 20).map((_x, _y, c) => {
    const k = from.indexOf(c);
    return k < 0 ? c : to[k];
  });
}

/** The curtain: red cloth with vertical folds (every 5th column dark, the one after it bright). */
export function drawCurtain(pal: Pal): Pixels {
  const red = pal.r('red');
  const p = new Pixels(20, 20, red[2]);
  for (let x = 0; x < 20; x++) {
    const k = x % 5;
    const shade = k === 0 ? red[0] : k === 1 ? red[1] : k === 3 ? red[3] : red[2];
    p.rect(x, 0, 1, 20, shade);
  }
  return p;
}

/** A curtain with a gap and a pair of eyes in it: whoever waits backstage, peeking. `look` glances left (0) or right (1). */
export function drawPeek(pal: Pal, look: 0 | 1): Pixels {
  const { c } = pal;
  const p = drawCurtain(pal);
  p.rect(5, 7, 10, 6, c('ink', 0));
  for (const x of [6, 11]) {
    p.rect(x, 8, 3, 4, c('white', 3));
    p.rect(x + (look ? 1 : 0), 9, 2, 3, c('ink', 1));
  }
  return p;
}

/** The valance across the top of the stage: the curtain's cloth with a scalloped edge and a gold fringe. */
export function drawValance(pal: Pal): Pixels {
  const { c, r } = pal;
  const red = r('red');
  const gold = r('gold');
  const p = new Pixels(20, 20, pal.c('sky', 3));
  const cloth = drawCurtain(pal);
  for (let x = 0; x < 20; x++) {
    const scallop = 9 + Math.round(3 * Math.abs(Math.sin((x / 20) * Math.PI * 2)));
    for (let y = 0; y < scallop; y++) p.set(x, y, cloth.get(x, y));
    p.set(x, scallop, red[0]);
    if (x % 3 === 0) p.set(x, scallop + 1, gold[3]).set(x, scallop + 2, gold[2]);
  }
  p.rect(0, 0, 20, 2, gold[3]).rect(0, 2, 20, 1, gold[1]);
  void c;
  return p;
}

/** The stage floor: warm boards, a seam every 10 pixels and a dark front edge. */
export function drawBoards(pal: Pal): Pixels {
  const w = pal.r('wood');
  const p = new Pixels(20, 20, w[2]);
  p.rect(0, 0, 20, 1, w[4]).rect(0, 1, 20, 1, w[3]);
  p.rect(0, 9, 20, 1, w[1]).rect(9, 2, 1, 7, w[1]).rect(19, 10, 1, 10, w[1]);
  for (const [x, y] of [
    [3, 4],
    [14, 5],
    [6, 14],
    [13, 16],
  ])
    p.rect(x, y, 3, 1, w[3]);
  p.rect(0, 18, 20, 2, w[0]);
  return p;
}

/** A speech bubble the size of a block, saying HI in the PC's 8 by 8 letters, with a tail pointing down at the speaker (its tip at column `tail`). */
export function drawBubble(pal: Pal, tail: number, edge: number): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  p.rect(2, 0, 16, 12, edge).rect(1, 1, 18, 10, edge);
  p.rect(3, 1, 14, 10, c('white', 3)).rect(2, 2, 16, 8, c('white', 3));
  // the tail: a small stub under the bubble, pointing at the speaker
  p.rect(tail - 1, 12, 4, 1, edge)
    .rect(tail, 12, 2, 1, c('white', 3))
    .rect(tail, 13, 2, 1, edge);
  text(p, 2, 2, 'HI', c('ink', 0));
  return p;
}

/** A gumdrop with its mouth open, speaking. */
export function drawSays(pal: Pal, body: Pixels): Pixels {
  const { c } = pal;
  const p = body.crop(0, 0, 20, 20);
  p.rect(8, 15, 4, 3, c('ink', 0)).rect(9, 17, 2, 1, c('red', 3));
  return p;
}

/** Nothing at all: a block of clear picture, for an actor that only waits its turn. */
export const drawNothing = (): Pixels => new Pixels(20, 20, T);

/** A small striped party hat (a five-row cone) on top of the low gumdrop frame, tipped one pixel to the right when `bob` is 1. */
export function withHat(pal: Pal, body: Pixels, bob: number): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  p.blit(body, 0, 0, T);
  const pink = r('pink');
  const widths = [1, 3, 3, 5, 5];
  widths.forEach((w, i) => p.rect(10 - (w >> 1) + bob, 2 + i, w, 1, i % 2 ? c('white', 3) : pink[2]));
  p.set(10 + bob, 1, c('gold', 4));
  return outline(p, c('ink', 0), { transparent: T });
}
