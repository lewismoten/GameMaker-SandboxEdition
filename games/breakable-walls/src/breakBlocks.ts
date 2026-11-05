// SMASH IT's own blocks, added to the Starter block set after the signs:
//   crate       a wooden box you cannot walk through (solid on every side). Touch it, from any side, and it
//               becomes `rubble`. A bump is a touch: the engine does not know which side was hit.
//               It also adds 1 to a spare counter, which is what makes Game-Maker play the crunch (CRUNCH).
//   rubble      what a crate leaves: a little pile you can walk through, with nothing to turn into
//   stuckCoin   a coin whose "becomes" is itself: it pays 2 every tick Kit is touching it and never goes
//   gem0..gem7  a spinning gem, eight blocks in a loop (each turns into the next after a few ticks). Every
//               frame has the same touch: it becomes sky (air) and pays 25. A frame left blank would pay
//               again, like the stuck coin, so all eight are filled in.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { speaker } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** The spare counter a smashed crate adds one to (counters 20 and up are free; Game-Maker plays sound 7 when one goes up). Nothing shows it. */
export const CRATE_COUNTER = 21;
/** The crunch of a crate breaking: a burst of noise, then a low thump. It takes the 'counter goes up' sound, which this game has no other use for (no keys). */
export const CRUNCH = speaker((i) => (i < 14 ? 160 + ((i * 7919) % 11) * 80 : i < 24 ? 120 - (i - 14) * 6 : 0));

/** Points the stuck coin pays on every tick it is touched. */
export const STUCK_PAY = 2;
/** Points one gem pays, once. */
export const GEM_PAY = 25;
/** The frames of the spinning gem, and the ticks each lasts (18.2 a second). */
export const GEM_FRAMES = 8;
export const GEM_TICKS = 3;

/** A crate: planks in a frame with a cross of braces, brown and plainly breakable, not a wall. */
function crate(pal: Pal): Pixels {
  const w = pal.r('wood');
  const p = new Pixels(20, 20, w[2]);
  // the frame, then two plank lines across the middle and the braces
  p.rect(0, 0, 20, 20, w[0]).rect(1, 1, 18, 18, w[3]);
  p.rect(1, 1, 18, 1, w[4]).rect(1, 18, 18, 1, w[1]);
  p.rect(1, 1, 3, 18, w[2]).rect(16, 1, 3, 18, w[2]);
  for (let i = 0; i < 14; i++) {
    p.set(3 + i, 3 + i, w[1]).set(4 + i, 3 + i, w[1]);
    p.set(16 - i, 3 + i, w[1]).set(15 - i, 3 + i, w[1]);
    p.set(3 + i, 2 + i, w[4]).set(16 - i, 2 + i, w[4]);
  }
  // four nails
  for (const [x, y] of [
    [2, 2],
    [17, 2],
    [2, 17],
    [17, 17],
  ] as const)
    p.set(x, y, w[4]);
  return p;
}

/** What is left: chunky wooden chips and a few splinters scattered about the square (it can float where a crate was, so it reads as bits in the air), the rest of it open. */
function rubble(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const w = pal.r('wood');
  // a chip: a lit top edge, a body and a dark underside
  const chip = (x: number, y: number, cw: number, ch: number) => {
    p.rect(x, y, cw, ch, w[3])
      .rect(x, y, cw, 1, w[4])
      .rect(x, y + ch - 1, cw, 1, w[1]);
  };
  chip(2, 14, 7, 4);
  chip(10, 15, 8, 3);
  chip(5, 9, 5, 4);
  chip(12, 9, 4, 3);
  chip(1, 4, 4, 3);
  chip(14, 3, 5, 3);
  chip(8, 3, 3, 2);
  chip(8, 17, 3, 2);
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** A coin for the mistake: gold with an orange rim and sparkles, so it reads as a richer one. */
function stuckCoin(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const g = pal.r('gold');
  const o = pal.r('orange');
  p.disc(9.5, 9.5, 7, o[0]).disc(9.5, 9.5, 6, o[2]).disc(9.5, 9.5, 4.5, g[4]).disc(9.5, 9.5, 3, g[3]);
  p.rect(6, 6, 2, 3, g[5]).set(8, 5, g[5]);
  for (const [x, y] of [
    [1, 2],
    [17, 3],
    [2, 16],
    [18, 15],
  ] as const)
    p.set(x, y, g[5])
      .set(x - 1, y, g[4])
      .set(x + 1, y, g[4])
      .set(x, y - 1, g[4])
      .set(x, y + 1, g[4]);
  return p;
}

/** The gem's turn: a cut stone with six faces round it and a flat crown, seen as it rotates about its upright axis. */
const FACES = 6;
/** How deep the stone is front to back, against its width (a flat gem narrows to a thin edge at a quarter turn). */
const DEPTH = 0.3;

/** One frame of a spinning gem: `turn` is the angle (radians) it has rotated about its vertical axis. */
function gem(pal: Pal, turn: number): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const t = pal.r('purple');
  const [cs, sn] = [Math.cos(turn), Math.sin(turn)];
  const amp = Math.hypot(cs, DEPTH * sn); // the silhouette's half width, as a share of the radius
  for (let y = 2; y <= 17; y++) {
    // the girdle (widest row) is at y 8; the crown flares to it from a flat table, the pavilion tapers to a point
    const radius = y < 8 ? 4.2 + (y - 2) * 0.55 : (7.5 * (18 - y)) / 10;
    const half = Math.max(0.55, radius * amp);
    for (let x = 0; x < 20; x++) {
      const u = (x + 0.5 - 10) / half;
      if (Math.abs(u) > 1) continue;
      // the angle round the stone of the point we see on this column, taking the one facing us
      const delta = Math.atan2(DEPTH * sn, cs);
      const near = Math.acos(Math.max(-1, Math.min(1, u)));
      let best = -9;
      let psi = 0;
      for (const cand of [delta + near, delta - near]) {
        const depth = -Math.cos(cand) * sn + DEPTH * Math.sin(cand) * cs;
        if (depth > best) [best, psi] = [depth, cand];
      }
      const face = Math.floor(((((psi / (2 * Math.PI)) * FACES) % FACES) + FACES) % FACES);
      // light from the upper left front: a face looking toward it is bright, away from it dark
      const look = ((face + 0.5) / FACES) * 2 * Math.PI - turn - Math.PI / 2;
      const lit = Math.cos(look + 0.6); // 1 facing the light, -1 away
      let shade = Math.round(2.3 + lit * 1.6);
      if (y >= 8) shade -= 1; // the pavilion is a shade darker than the crown
      if (y === 2) shade = 4; // the flat table catches the light
      p.set(x, y, t[Math.max(1, Math.min(4, shade))]);
    }
  }
  // the girdle line, kept a shade darker
  for (let x = 0; x < 20; x++) if (p.get(x, 8) === t[3] || p.get(x, 8) === t[4]) p.set(x, 8, t[2]);
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** Adds the smash blocks to `book` (after addStarterBlocks and the signs). */
export function addBreakBlocks(book: Book, pal: Pal): void {
  const air = { grav: PULL.down };
  book.add('rubble', rubble(pal), air);
  book.add('crate', crate(pal), { solid: SOLID, effect: CRATE_COUNTER, eamt: 1, touch: 'rubble' });
  book.add('stuckCoin', stuckCoin(pal), { ...air, score: STUCK_PAY, touch: 'stuckCoin' });
  for (let i = 0; i < GEM_FRAMES; i++) book.add(`gem${i}`, gem(pal, (i * 2 * Math.PI) / GEM_FRAMES), { ...air, score: GEM_PAY, touch: 'sky' });
}

/** The finished blocks: the book's, with the gem's eight frames chained into a loop. */
export function finishBlocks(book: Book): Block[] {
  const blocks = book.finish();
  for (let i = 0; i < GEM_FRAMES; i++) {
    const b = blocks[book.n(`gem${i}`)];
    b.nextBl = book.n(`gem${(i + 1) % GEM_FRAMES}`);
    b.ntime = GEM_TICKS;
  }
  return blocks;
}
