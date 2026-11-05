// DIG IT's own blocks, added to the Starter block set after the signs:
//   soil     loose, light brown earth with pebbles. It is solid, and every tick Neka pushes on it (walking into it, standing
//            on it, jumping up into it) it breaks up one step along a chain: soil, cracked, split open, half dug, nearly dug, then `dug`
//            (a hole with a heap of crumbs). The steps are solid, so she is held for five ticks, shovel against the
//            dirt, and then walks straight on. A touch chain is the only per-block animation PLAYGAME has: a block timer
//            would change every copy of the block on the screen at once.
//   nugget   soil with a gold fleck. It pays 10 on its first touch (once), glints as it cracks and then joins the chain.
//   crumbs   the dug hole's crunch: touching soil adds one to a spare counter, which Game-Maker answers with sound 7.
//   tunnel   the hole that is left: a dark brown wall behind Neka, nothing solid, with the pull of ordinary air (down)
//   mineLadder  a ladder on the tunnel's dark wall: the way up out of a dug tunnel
//   rock     gray stone with cracks. It is solid and has no touch, so it never digs: a hole goes around it.
// The Starters' own `dirt` (dark, packed) is not diggable either; only `soil` is.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { speaker } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import { speckle } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';

/** The spare counter every dug step adds one to (counters 20 and up are free; Game-Maker plays sound 7 when one goes up). Nothing shows it. */
export const DIG_COUNTER = 22;
/** The crunch of a dig: a burst of gritty noise, then a short scrape. It takes the 'counter goes up' sound, which this game has no other use for (no keys). */
export const CRUNCH = speaker((i) => (i < 10 ? 140 + ((i * 7919) % 13) * 90 : i < 18 ? 700 - (i - 10) * 60 : 0));

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

/** A jagged crack from (x, y), `len` steps toward (dx, dy), kinking sideways on the steps in `kinks`. */
function crack(p: Pixels, x: number, y: number, dx: number, dy: number, len: number, kinks: number[], c: number): void {
  for (let i = 0; i < len; i++) {
    p.set(x, y, c);
    if (kinks.includes(i)) {
      x += dy;
      y += dx;
    } else {
      x += dx;
      y += dy;
    }
  }
}

/** Soil, cracked across by the first bite of the shovel, with two crumbs hopping off the top. */
function cracked(pal: Pal, nugget: boolean): Pixels {
  const d = pal.r('dirt');
  const t = pal.r('parch');
  const p = soil(pal, nugget);
  p.set(10, 9, d[0]).set(9, 10, d[0]).set(10, 10, d[0]).set(11, 10, d[0]).set(10, 11, d[0]);
  crack(p, 9, 9, -1, -1, 6, [2, 4], d[0]);
  crack(p, 11, 10, 1, 0, 8, [2, 5], d[0]);
  crack(p, 10, 12, 0, 1, 7, [1, 4], d[0]);
  crack(p, 9, 11, -1, 1, 5, [2], d[0]);
  // lifted crumbs
  for (const [x, y] of [
    [3, 1],
    [16, 2],
  ])
    p.rect(x, y, 2, 2, t[3]).rect(x, y, 2, 1, t[4]);
  return p;
}

/** The same soil split wider: a dark gap along the cracks, more branches, the crumbs higher. */
function splitOpen(pal: Pal, nugget: boolean): Pixels {
  const d = pal.r('dirt');
  const t = pal.r('parch');
  const p = cracked(pal, nugget);
  p.rect(2, 1, 5, 3, t[2]).rect(13, 1, 5, 3, t[2]); // wipe the first crumbs
  p.rect(9, 8, 3, 5, d[1]).rect(8, 9, 1, 3, d[0]).rect(12, 9, 1, 3, d[0]);
  crack(p, 6, 6, -1, 1, 5, [2], d[0]);
  crack(p, 13, 13, 1, 1, 5, [2], d[0]);
  for (const [x, y] of [
    [2, 0],
    [15, 1],
  ])
    p.rect(x, y, 2, 2, t[4]).rect(x, y + 1, 2, 1, d[3]);
  return p;
}

/** Half dug: a ragged hollow in the soil, dark inside with loose lumps, and crumbs thrown up out of it. */
function halfDug(pal: Pal): Pixels {
  const d = pal.r('dirt');
  const t = pal.r('parch');
  const p = soil(pal, false);
  p.disc(10, 11, 7.5, d[0]).disc(10, 11, 6.5, d[1]).disc(10, 12, 5, d[2]);
  p.rect(5, 10, 3, 1, d[0]).rect(13, 15, 3, 1, d[0]);
  // lumps in the hollow
  for (const [x, y, w] of [
    [6, 13, 4],
    [11, 14, 3],
    [9, 10, 3],
  ])
    p.rect(x, y, w, 2, t[2]).rect(x, y, w, 1, t[3]);
  // crumbs flying up
  for (const [x, y, w] of [
    [6, 2, 2],
    [12, 3, 3],
    [15, 6, 2],
  ])
    p.rect(x, y, w, w, t[3])
      .rect(x, y, w, 1, t[4])
      .rect(x, y + w - 1, w, 1, d[3]);
  return p;
}

/** Nearly through: the hollow fills the cell, a ring of soil is left and one clump is still rising. */
function nearlyDug(pal: Pal): Pixels {
  const d = pal.r('dirt');
  const t = pal.r('parch');
  const p = tunnel(pal);
  p.rect(0, 0, 20, 3, t[2]).rect(0, 0, 20, 1, t[4]).rect(0, 3, 20, 1, d[3]).rect(0, 17, 3, 3, t[2]).rect(17, 17, 3, 3, t[2]);
  p.rect(0, 0, 2, 10, t[2]).rect(18, 0, 2, 10, t[2]).rect(2, 4, 1, 4, d[3]).rect(17, 4, 1, 4, d[3]);
  p.rect(6, 15, 7, 3, t[2]).rect(7, 14, 4, 1, t[3]).rect(6, 15, 7, 1, t[3]);
  for (const [x, y] of [
    [8, 6],
    [11, 9],
  ])
    p.rect(x, y, 2, 2, t[3]).rect(x, y, 2, 1, t[4]);
  return p;
}

/** The dug hole: dark earth walls and a small heap of crumbs on the floor. */
function dug(pal: Pal): Pixels {
  const d = pal.r('dirt');
  const t = pal.r('parch');
  const p = tunnel(pal);
  p.rect(6, 16, 8, 4, t[2]).rect(8, 14, 4, 2, t[2]).rect(9, 14, 2, 1, t[4]).rect(6, 16, 8, 1, t[3]).rect(3, 18, 3, 2, d[3]).rect(14, 18, 4, 2, d[3]);
  p.rect(14, 17, 2, 1, t[3]).rect(4, 17, 2, 1, t[3]);
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
  // the dug hole, with its heap of crumbs: it pulls down like the tunnel, and what soil ends as
  book.add('dug', dug(pal), { grav: PULL.down });
  // the chain, from the last step back: half dug becomes the hole, cracked becomes half dug
  book.add('nearlyDug', nearlyDug(pal), { solid: SOLID, effect: DIG_COUNTER, eamt: 1, touch: 'dug' });
  book.add('halfDug', halfDug(pal), { solid: SOLID, touch: 'nearlyDug' });
  book.add('splitOpen', splitOpen(pal, false), { solid: SOLID, touch: 'halfDug' });
  book.add('splitGold', splitOpen(pal, true), { solid: SOLID, touch: 'halfDug' });
  book.add('cracked', cracked(pal, false), { solid: SOLID, touch: 'splitOpen' });
  book.add('crackedGold', cracked(pal, true), { solid: SOLID, touch: 'splitGold' });
  book.add('soil', soil(pal, false), { solid: SOLID, effect: DIG_COUNTER, eamt: 1, touch: 'cracked' });
  // the nugget pays on its first touch only: after that it is a cracked block with the fleck glinting
  book.add('nugget', soil(pal, true), { solid: SOLID, score: NUGGET_PAY, effect: DIG_COUNTER, eamt: 1, touch: 'crackedGold' });
  book.add('mineLadder', mineLadder(pal), { grav: PULL.none });
  book.add('rock', rock(pal), { solid: SOLID });
}
