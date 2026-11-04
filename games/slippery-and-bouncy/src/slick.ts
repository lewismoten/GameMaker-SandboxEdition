// SLIPPERY AND BOUNCY's blocks, added to the Starter block set after the signs. Gravity is a block setting:
// each block says which ways it pulls (down, up, left, right, or a mix), and the hero is pulled by the
// block his feet are in. Nothing here is a new engine rule; it is only those settings, drawn so you can see them.
//   ice, slickAir      a floor of ice; the air above it pulls down AND right, so Kit is dragged along it
//   belt, beltAir      a floor with chevrons; the same pull, drawn as a moving walkway
//   fan, windAir       a floor fan; the air above it pulls UP, a column of wind
//   spring, springAir  a spring pad; a short column of the same wind
//   spikeUp, spikeFlat the spikes (10 hit points, once) that the slide or the belt can carry Kit into
// The ledge is the Starter plank (solid from above only), so Kit jumps up through it and lands on top.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** Hit points a spike takes, once. */
export const SPIKE_HURT = -10;

function spikes(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const s = pal.r('stone');
  p.rect(0, 16, 20, 4, s[1]).rect(0, 16, 20, 1, s[3]);
  for (const x of [1, 7, 13]) {
    for (let y = 0; y < 16; y++) {
      const half = Math.ceil(((y + 1) / 16) * 3);
      p.rect(x + 3 - half, y, half * 2, 1, y < 4 ? s[4] : s[3]);
    }
    for (let y = 0; y < 16; y++) p.set(x + 3 + Math.ceil(((y + 1) / 16) * 3) - 1, y, s[2]);
  }
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** The same three spikes, bent over flat and blunt. */
function flat(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const s = pal.r('stone');
  p.rect(0, 16, 20, 4, s[1]).rect(0, 16, 20, 1, s[3]);
  for (const x of [1, 7, 13]) {
    p.rect(x, 13, 6, 3, s[3])
      .rect(x, 13, 6, 1, s[4])
      .rect(x + 4, 13, 2, 3, s[2]);
  }
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}


/** The pulls: down and to the right, and straight up. */
export const SLIDE_RIGHT = PULL.down | PULL.right;
export const WIND_UP = PULL.up;

/** A floor of ice: pale blue with white glints slanting across it. */
function ice(pal: Pal): Pixels {
  const s = pal.r('sky');
  const w = pal.r('white');
  const p = new Pixels(20, 20, s[4]);
  p.rect(0, 0, 20, 2, w[3]).rect(0, 2, 20, 1, s[5]);
  p.rect(0, 17, 20, 3, s[3]).rect(0, 19, 20, 1, s[2]);
  for (const [x, y] of [
    [3, 8],
    [12, 12],
    [6, 15],
  ]) {
    for (let k = 0; k < 5; k++) p.rect(x + k, y - k, 2, 1, w[3]);
  }
  p.rect(0, 3, 1, 14, s[5]).rect(19, 3, 1, 14, s[3]);
  return p;
}

/** The air above the ice: sky with a few frost sparkles, so the patch reads as ice. */
function slick(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const w = pal.c('white', 3);
  for (const [x, y] of [
    [3, 16],
    [11, 17],
    [16, 14],
  ]) {
    p.set(x, y, w).set(x - 1, y, w).set(x + 1, y, w).set(x, y - 1, w).set(x, y + 1, w);
  }
  return p;
}

/** A moving walkway: a dark band with orange chevrons pointing the way it carries you, on a stone body. */
function belt(pal: Pal): Pixels {
  const st = pal.r('stone');
  const o = pal.r('orange');
  const p = new Pixels(20, 20, st[2]);
  p.rect(0, 0, 20, 8, st[0]).rect(0, 0, 20, 1, st[3]);
  for (const x of [1, 10]) {
    for (let k = 0; k < 4; k++) p.rect(x + k, 1 + k, 2, 1, o[3]).rect(x + k, 6 - k, 2, 1, o[3]);
  }
  p.rect(0, 8, 20, 1, st[1]);
  p.disc(4, 14, 3, st[1]).disc(4, 14, 1, st[3]).disc(15, 14, 3, st[1]).disc(15, 14, 1, st[3]);
  p.rect(0, 19, 20, 1, st[0]);
  return p;
}

/** The air above the belt: sky with a few small dashes pointing along it. */
function beltAir(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const w = pal.c('white', 2);
  for (const [x, y] of [
    [2, 14],
    [11, 17],
  ]) {
    p.rect(x, y, 5, 1, w).set(x + 5, y, w).set(x + 4, y - 1, w).set(x + 4, y + 1, w);
  }
  return p;
}

/** A floor fan: a round grille on a stone box. */
function fan(pal: Pal): Pixels {
  const st = pal.r('stone');
  const o = pal.r('orange');
  const p = new Pixels(20, 20, st[2]);
  p.rect(0, 0, 20, 9, st[0]).rect(0, 0, 20, 1, st[3]);
  for (const x of [2, 5, 8, 11, 14, 17]) p.rect(x, 1, 1, 7, st[3]);
  p.rect(0, 9, 20, 1, st[1]);
  p.rect(2, 12, 4, 4, o[3]).rect(2, 12, 4, 1, o[4]).rect(2, 15, 4, 1, o[2]);
  p.rect(10, 12, 8, 1, st[1]).rect(10, 15, 8, 1, st[1]);
  p.rect(0, 19, 20, 1, st[0]);
  return p;
}

/** A column of wind: wavy white lines and an up-chevron, with a leaf blown along. */
function wind(pal: Pal, phase: number): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const w = pal.c('white', 3);
  const dim = pal.c('white', 1);
  for (const [x0, ph] of [
    [3, 0],
    [16, 2],
  ]) {
    for (let y = 0; y < 20; y++) {
      if (y % 6 === 5) continue;
      p.set(x0 + Math.round(1.6 * Math.sin((y + phase + ph * 2) / 2.2)), y, dim);
    }
  }
  for (let k = 0; k < 4; k++) p.rect(7 + k, 8 + k, 1, 2, w).rect(12 - k, 8 + k, 1, 2, w);
  const g = pal.r('green');
  p.rect(9, 15, 3, 1, g[3]).rect(10, 14, 2, 1, g[4]).set(8, 16, g[2]);
  return p;
}

/** A spring pad: a red plate on a gold coil. */
function spring(pal: Pal): Pixels {
  const r = pal.r('red');
  const go = pal.r('gold');
  const st = pal.r('stone');
  const p = new Pixels(20, 20, skyOf(pal));
  p.rect(1, 0, 18, 4, r[3]).rect(1, 0, 18, 1, r[4]).rect(1, 3, 18, 1, r[2]);
  for (let y = 4; y < 16; y += 4) {
    p.rect(4, y, 12, 2, go[3]).rect(4, y, 12, 1, go[4]);
    p.rect(4, y + 2, 2, 2, go[2]).rect(14, y + 2, 2, 2, go[2]);
  }
  p.rect(2, 16, 16, 4, st[2]).rect(2, 16, 16, 1, st[3]).rect(2, 19, 16, 1, st[0]);
  return p;
}

/** Adds the spikes, ice, belt, fan and spring blocks (with the air that pulls) to `book`, after the signs. */
export function addSlick(book: Book, pal: Pal): void {
  const air = { grav: PULL.down };
  book.add('spikeUp', spikes(pal), { ...air, hp: SPIKE_HURT, touch: 'spikeFlat' });
  book.add('spikeFlat', flat(pal), air);
  book.add('ice', ice(pal), { solid: SOLID });
  book.add('slickAir', slick(pal), { grav: SLIDE_RIGHT });
  book.add('belt', belt(pal), { solid: SOLID });
  book.add('beltAir', beltAir(pal), { grav: SLIDE_RIGHT });
  book.add('fan', fan(pal), { solid: SOLID });
  book.add('windAir', wind(pal, 0), { grav: WIND_UP });
  book.add('spring', spring(pal), { solid: SOLID });
  book.add('springAir', wind(pal, 6), { grav: WIND_UP });
}
