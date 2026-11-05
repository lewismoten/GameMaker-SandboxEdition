// DIG IT's own blocks, added to the Starter block set after the signs:
//   soil     loose, light brown earth with pebbles. It is solid, and touching it (walking into it, or jumping up into it)
//            turns it into `tunnel`: the engine applies a touch before it checks what is solid, so Kit walks straight on.
//   nugget   soil with a gold fleck. It pays 10 when it is dug and then becomes tunnel, like soil.
//   tunnel   the hole that is left: a dark brown wall behind Kit, nothing solid, with the pull of ordinary air (down)
//   mineLadder  a ladder on the tunnel's dark wall: the way up out of a dug tunnel
//   rock     gray stone with cracks. It is solid and has no touch, so it never digs: a hole goes around it.
// The Starters' own `dirt` (dark, packed) is not diggable either; only `soil` is.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { speckle } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';

/** Points one nugget pays, once. */
export const NUGGET_PAY = 10;

/** Loose soil: a pale, sandy tan with a few brown pebbles and little shovel marks, so it reads as lighter and looser than the packed dirt. */
function soil(pal: Pal, nugget: boolean): Pixels {
  const t = pal.r('parch');
  const d = pal.r('dirt');
  const p = speckle(new Pixels(20, 20, t[2]), 0, 0, 20, 20, t, 2, 1, 21, 0.3);
  const rand = rng(31);
  for (let i = 0; i < 6; i++) {
    const x = 1 + Math.floor(rand() * 16);
    const y = 1 + Math.floor(rand() * 16);
    p.rect(x, y, 3, 2, d[3])
      .rect(x, y, 3, 1, d[4])
      .rect(x, y + 2, 3, 1, d[2]);
  }
  // short dashes, like a spade's marks
  for (const [x, y] of [
    [3, 16],
    [12, 6],
  ])
    p.rect(x, y, 4, 1, t[1]);
  p.rect(0, 0, 20, 1, t[4]);
  if (nugget) {
    const g = pal.r('gold');
    const o = pal.r('orange');
    p.disc(9.5, 10, 5, o[0]).disc(9.5, 10, 4, g[3]).rect(8, 8, 2, 2, g[5]).rect(11, 12, 1, 1, g[4]);
    for (const [x, y] of [
      [3, 5],
      [16, 14],
    ])
      p.set(x, y, g[5])
        .set(x - 1, y, g[4])
        .set(x + 1, y, g[4])
        .set(x, y - 1, g[4])
        .set(x, y + 1, g[4]);
  }
  return p;
}

/** The hole: dark earth walls with a lit rim of crumbs, plainly something dug out, never sky. */
function tunnel(pal: Pal): Pixels {
  const d = pal.r('dirt');
  const p = speckle(new Pixels(20, 20, d[1]), 0, 0, 20, 20, d, 0, 1, 9, 0.18);
  const rand = rng(5);
  for (let i = 0; i < 4; i++) p.rect(1 + Math.floor(rand() * 16), 2 + Math.floor(rand() * 15), 2, 1, d[2]);
  return p;
}

/** A ladder on the tunnel's dark wall (the Starters' ladder is drawn on sky). */
function mineLadder(pal: Pal): Pixels {
  const w = pal.r('wood');
  const p = tunnel(pal);
  p.rect(3, 0, 3, 20, w[2]).rect(3, 0, 1, 20, w[4]).rect(5, 0, 1, 20, w[1]);
  p.rect(14, 0, 3, 20, w[2]).rect(14, 0, 1, 20, w[4]).rect(16, 0, 1, 20, w[1]);
  for (const y of [2, 7, 12, 17])
    p.rect(5, y, 9, 3, w[3])
      .rect(5, y, 9, 1, w[4])
      .rect(5, y + 2, 9, 1, w[1]);
  return p;
}

/** A rock: a gray boulder block with a lit top, a dark underside and a crack, in its own frame so it reads as a wall. */
function rock(pal: Pal): Pixels {
  const s = pal.r('stone');
  const p = new Pixels(20, 20, s[2]);
  p.rect(0, 0, 20, 20, s[0]).rect(1, 1, 18, 18, s[2]);
  p.rect(1, 1, 18, 2, s[4]).rect(1, 3, 18, 1, s[3]).rect(1, 17, 18, 2, s[1]).rect(17, 3, 2, 14, s[1]).rect(1, 3, 2, 12, s[3]);
  // a zigzag crack
  for (const [x, y] of [
    [10, 4],
    [9, 6],
    [11, 8],
    [10, 10],
    [8, 12],
    [9, 14],
  ])
    p.rect(x, y, 2, 2, s[0]);
  p.rect(4, 6, 3, 2, s[3]).rect(13, 12, 3, 2, s[3]);
  return p;
}

/** Adds the dig blocks to `book` (after addStarterBlocks and the signs). */
export function addDigBlocks(book: Book, pal: Pal): void {
  book.add('tunnel', tunnel(pal), { grav: PULL.down });
  book.add('soil', soil(pal, false), { solid: SOLID, touch: 'tunnel' });
  book.add('nugget', soil(pal, true), { solid: SOLID, score: NUGGET_PAY, touch: 'tunnel' });
  book.add('mineLadder', mineLadder(pal), { grav: PULL.none });
  book.add('rock', rock(pal), { solid: SOLID });
}
