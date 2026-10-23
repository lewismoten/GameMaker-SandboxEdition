// CITY.BBL: the city gate in the morning: the street of limestone pavers, market stalls with
// striped awnings to hop up onto, flat-roofed houses, palms, a fruit cart that sends melons
// rolling down the street, the well, the poor souls along the way, and at the far end the city
// wall's little "needle gate", one block high, that the preachers say the Lord meant.
import { dither, rng } from '../../../kit/pixels';
import { blob, shadeAt, speckle } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import type { Pal } from '../art/pal';
import { MON } from '../ids';
import { EGG_SHINE_FRAMES, drawEasterEgg } from '../../../kit/easterEgg';
import { addGoodThings, addSoul, GRAV, kit, LEDGE, SOLID, type Kit } from './common';

/** Ticks between melons rolling off the cart. */
export const MELON_EVERY = 110;

export function cityBlocks(pal: Pal): Kit {
  const k = kit(pal);
  const { book, c, R, P, sky, air } = k;

  // ---------- sky ----------
  book.add('bg', sky(1), air);
  book.add('skyHi', sky(2, 1), air);
  const wisp = sky(3, 2);
  for (let x = 2; x < 18; x++) wisp.set(x, 8 + Math.round(Math.sin(x / 3)), c('white', 2)).set(x + 1, 9 + Math.round(Math.sin(x / 3)), c('white', 1));
  book.add('wisp', wisp, air);
  book.add('skyMid', sky(4, 2), air);
  // where one shade of sky dithers into the next
  const band = (lo: number) => P().map((x, y) => (dither(x, y, 1 - y / 20) ? c('sky', lo) : c('sky', lo + 1)));
  book.add('band1', band(1), air);
  book.add('band2', band(2), air);
  // the city in the distance, pale in the morning haze (scenery): walls with dark windows,
  // flat roofs, a golden dome and a tower
  const haze = (x: number, y: number) => shadeAt(R('stone'), 3, 5, 0.55 + Math.sin(x / 3 + y / 5) * 0.12, x, y);
  const far = (kind: number) => {
    const p = sky(10 + kind, 3);
    const fillFrom = (top: (x: number) => number) => {
      for (let x = 0; x < 20; x++) for (let y = Math.max(0, top(x)); y < 20; y++) p.set(x, y, haze(x, y));
    };
    if (kind === 0) fillFrom(() => 0);
    if (kind === 1) fillFrom((x) => (x < 9 ? 8 : 12));
    if (kind === 2) {
      fillFrom(() => 13);
      blob(p, 10, 13, 7, 7, R('gold'), 1, 3);
      p.line(10, 3, 10, 6, c('gold', 3)).set(10, 2, c('gold', 4));
    }
    if (kind === 3) {
      fillFrom((x) => (x >= 5 && x < 15 ? 3 : 15));
      for (let x = 5; x < 15; x += 3) p.rect(x, 1, 2, 2, c('stone', 4));
    }
    if (kind === 4) fillFrom((x) => 14 + Math.round(Math.sin(x / 4) * 2));
    // dark windows, only where the wall is
    for (let y = 5; y < 18; y += 6)
      for (let x = 2 + (kind % 2) * 3; x < 17; x += 6) {
        let wall = true;
        for (let yy = y - 1; yy < y + 4; yy++) for (let xx = x - 1; xx < x + 3; xx++) if (p.get(xx, yy) < c('stone', 0) || p.get(xx, yy) > c('stone', 5)) wall = false;
        if (wall) p.rect(x, y, 2, 3, c('stone', 2));
      }
    return p;
  };
  for (let kk = 0; kk < 5; kk++) book.add(`far${kk}`, far(kk), air);

  // ---------- the street ----------
  const pavers = (seed: number, top: boolean) => {
    const p = P().rect(0, 0, 20, 20, c('stone', 2));
    for (let row = 0; row < 4; row++)
      for (let kk = -1; kk < 3; kk++) {
        const x = kk * 10 + (row % 2) * 5;
        for (let y = row * 5 + 1; y < row * 5 + 4; y++) for (let xx = x + 1; xx < x + 9; xx++) p.set(xx, y, shadeAt(R('stone'), 3, 4, 0.3 + ((xx * 7 + y * 3 + seed) % 7) / 10, xx, y));
      }
    if (top) p.rect(0, 0, 20, 1, c('stone', 5)).rect(0, 1, 20, 1, c('stone', 4));
    return p;
  };
  book.add('street', pavers(1, true), { solid: SOLID });
  book.add('earth', speckle(P(), 0, 0, 20, 20, R('sand'), 1, 1, 7, 0.4), { solid: SOLID });
  // the city wall: big dressed limestone
  const wall = (seed: number, cap: boolean) => {
    const p = P();
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const joint = y % 10 === 0 || (x + (Math.floor(y / 10) % 2) * 10) % 20 === 0;
        p.set(x, y, joint ? c('stone', 1) : shadeAt(R('stone'), 2, 4, 0.55 + Math.sin((x + seed) / 4 + y / 7) * 0.2, x, y));
      }
    if (cap) {
      p.rect(0, 0, 20, 6, c('sky', 3));
      p.rect(0, 6, 20, 14, c('stone', 3)).rect(2, 0, 6, 7, c('stone', 3)).rect(12, 0, 6, 7, c('stone', 3));
      p.rect(2, 0, 6, 1, c('stone', 5)).rect(12, 0, 6, 1, c('stone', 5)).rect(0, 6, 20, 1, c('stone', 4));
    }
    return p;
  };
  book.add('wall', wall(1, false), { solid: SOLID });
  book.add('wallTop', wall(2, true), { solid: SOLID });
  // the great city gate at the start: its arch, seen from inside (scenery, dark beyond)
  const passage = (x: number, y: number) => shadeAt(R('sand'), 1, 3, 0.25 + y / 40 + Math.abs(x - 10) / 60, x, y);
  const arch = (part: number) => {
    const p = wall(5, false);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const gx = part * 20 + x;
        const d = ((gx - 30) / 27) ** 2 + ((20 - y) / 15) ** 2;
        if (d < 1) p.set(x, y, passage(x, y + 10));
        else if (d < 1.12) p.set(x, y, c('stone', 5));
      }
    return p;
  };
  book.add('archL', arch(0), air);
  book.add('archM', arch(1), air);
  book.add('archR', arch(2), air);
  // under the arch: the way in from outside, in shadow (scenery)
  const gateway = P();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) gateway.set(x, y, passage(x, y + 30));
  book.add('gateway', gateway, air);
  // the little needle gate in the wall: a doorway one block high
  const door = P();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) door.set(x, y, shadeAt(R('sand'), 1, 3, 0.4 + x / 30, x, y));
  door.rect(0, 0, 20, 2, c('stone', 1)).rect(0, 0, 1, 20, c('stone', 1));
  book.add('doorway', door, air);
  const sign = wall(9, false);
  sign.rect(1, 4, 18, 11, c('wood', 3)).frame(1, 4, 18, 11, c('wood', 1));
  micro(sign, 5, 6, 'EYE', c('ink', 0));
  micro(sign, 3, 12, 'GATE', c('ink', 0));
  book.add('gateSign', sign, { solid: SOLID });

  // ---------- the market ----------
  const awning = (stripe: string) => {
    const p = sky(21);
    for (let x = 0; x < 20; x++) {
      const on = Math.floor(x / 4) % 2 === 0;
      p.rect(x, 2, 1, 5, on ? c(stripe, 2) : c('white', 2));
      p.set(x, 7 + (x % 4 < 2 ? 0 : 1), on ? c(stripe, 1) : c('white', 1));
    }
    p.rect(0, 2, 20, 1, c(stripe, 3));
    return p;
  };
  book.add('awningR', awning('red'), { solid: LEDGE, grav: GRAV.down });
  book.add('awningB', awning('blue'), { solid: LEDGE, grav: GRAV.down });
  // posts holding the awnings up (scenery)
  const post = sky(23);
  post.rect(9, 0, 2, 20, c('wood', 2)).rect(9, 0, 1, 20, c('wood', 3));
  book.add('post', post, air);
  // a stall's counter, heaped with pots, cloth or fruit (solid: hop over or onto)
  const counter = (goods: number) => {
    const p = P().rect(0, 6, 20, 14, c('wood', 2));
    for (let x = 0; x < 20; x += 5) p.rect(x, 6, 1, 14, c('wood', 1));
    p.rect(0, 6, 20, 2, c('wood', 4));
    const back = sky(24 + goods);
    for (let y = 0; y < 6; y++) for (let x = 0; x < 20; x++) p.set(x, y, back.get(x, y));
    if (goods === 0) for (const x of [3, 9, 15]) (blob(p, x, 3, 2.6, 3, R('red'), 0, 2), p.rect(x - 1, 0, 3, 1, c('red', 1)));
    if (goods === 1) for (const [x, col] of [[4, 'blue'], [10, 'purple'], [16, 'gold']] as const) p.rect(x - 3, 1, 6, 5, c(col, 2)).rect(x - 3, 1, 6, 1, c(col, 3));
    if (goods === 2) for (const x of [3, 8, 13, 17]) blob(p, x, 4, 2.4, 2, R(x % 2 ? 'gold' : 'leaf'), 1, 3);
    return p;
  };
  book.add('counterPots', counter(0), { solid: SOLID });
  book.add('counterCloth', counter(1), { solid: SOLID });
  book.add('counterFruit', counter(2), { solid: SOLID });
  // the fruit cart: melons roll off it down the street
  const cart = P();
  const cartBg = sky(27);
  cart.px.set(cartBg.px);
  cart.rect(0, 8, 20, 6, c('wood', 2)).rect(0, 8, 20, 1, c('wood', 4));
  for (const x of [4, 10, 16]) blob(cart, x, 5, 3, 3, R('leaf'), 1, 4);
  cart.disc(5, 16, 3.4, c('wood', 1)).disc(5, 16, 1, c('wood', 3)).disc(15, 16, 3.4, c('wood', 1)).disc(15, 16, 1, c('wood', 3));
  book.add('cart', cart, { solid: SOLID, birthMon: MON.melon, birthTime: MELON_EVERY });
  // crates and pots in the street (solid)
  const crate = P().rect(0, 0, 20, 20, c('wood', 2)).frame(0, 0, 20, 20, c('wood', 0)).line(1, 1, 18, 18, c('wood', 1)).line(18, 1, 1, 18, c('wood', 1));
  crate.rect(1, 1, 18, 1, c('wood', 4));
  book.add('crate', crate, { solid: SOLID });
  const pots = sky(29);
  for (const [x, h, col] of [[5, 7, 'red'], [14, 9, 'stone']] as const) {
    blob(pots, x, 19 - h / 2, 4, h / 2, R(col), 1, 3);
    pots.rect(x - 1, 19 - h - 2, 3, 2, c(col, 1));
  }
  book.add('pots', pots, air);

  // ---------- houses ----------
  const house = (win: boolean) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('sand'), 3, 5, 0.6 + Math.sin((x * 3 + y) / 7) * 0.15, x, y));
    if (win) p.rect(6, 5, 8, 8, c('wood', 0)).rect(6, 5, 8, 2, c('wood', 2)).rect(9, 5, 1, 8, c('wood', 2)).rect(5, 13, 10, 1, c('stone', 2));
    return p;
  };
  book.add('house', house(false), { solid: SOLID });
  book.add('houseWin', house(true), { solid: SOLID });
  // a flat roof to walk on, its parapet
  const roof = sky(31);
  roof.rect(0, 12, 20, 8, c('sand', 4)).rect(0, 12, 20, 2, c('sand', 5)).rect(0, 19, 20, 1, c('wood', 2));
  for (let x = 2; x < 20; x += 6) roof.rect(x, 19, 2, 1, c('wood', 3));
  book.add('roof', roof, { solid: LEDGE, grav: GRAV.down });
  // laundry on a line between the roofs (scenery)
  const laundry = sky(33, 2);
  laundry.line(0, 3, 19, 5, c('wood', 1));
  for (const [x, col] of [[3, 'blue'], [9, 'white'], [15, 'red']] as const) laundry.rect(x - 2, 4 + Math.floor(x / 8), 5, 7, c(col, 2)).rect(x - 2, 4 + Math.floor(x / 8), 5, 1, c(col, 1));
  book.add('laundry', laundry, air);
  // a stair of stone up to the roofs (solid steps)
  const step = pavers(4, true);
  book.add('step', step, { solid: SOLID });

  // ---------- trees ----------
  const trunk = sky(41);
  for (let y = 0; y < 20; y++) trunk.rect(8 + Math.round(Math.sin(y / 6)), y, 4, 1, c('wood', y % 4 === 0 ? 1 : 2));
  book.add('palm', trunk, air);
  const crown = sky(42);
  for (let a = 0; a < 7; a++) {
    const ang = Math.PI * (1.0 + (a / 6) * 1.0);
    for (let t = 0; t < 10; t++) crown.set(10 + Math.cos(ang) * t, 12 + Math.sin(ang) * t * 0.7 + t * t * 0.04, c('leaf', 1 + (t % 3)));
  }
  for (const [x, y] of [[9, 13], [11, 14], [10, 15]]) crown.disc(x, y, 1.4, c('wood', 3));
  crown.rect(8, 12, 4, 8, c('wood', 2)); // as wide as the trunk's top, where it meets it
  book.add('palmTop', crown, air);

  // ---------- the well ----------
  const well = sky(45);
  well.rect(3, 10, 14, 10, c('stone', 3)).rect(3, 10, 14, 2, c('stone', 5)).rect(5, 12, 10, 1, c('water', 1));
  well.rect(3, 1, 2, 10, c('wood', 2)).rect(15, 1, 2, 10, c('wood', 2)).rect(2, 0, 16, 2, c('wood', 3)).line(10, 2, 10, 8, c('ink', 1));
  blob(well, 10, 8, 2, 1.4, R('wood'), 1, 3);
  book.add('well', well, { hp: 30, score: 10, grav: GRAV.down, touch: 'wellDrawn' });
  // the bucket drawn up: one long drink per well
  const drawn = sky(46);
  drawn.px.set(well.px);
  drawn.rect(8, 7, 5, 3, c('sky', 3)).line(10, 2, 10, 4, c('ink', 1));
  blob(drawn, 10, 5, 2, 1.4, R('wood'), 1, 3);
  book.add('wellDrawn', drawn, { grav: GRAV.down });

  // ---------- the poor, and good things ----------
  const street = () => sky(51);
  for (const who of ['beggar', 'widow', 'kids', 'blind'] as const) addSoul(k, who, street);
  addGoodThings(k, () => sky(53));
  // a coin glinting in the street: not his to keep, but points for noticing
  const r = rng(55);
  const glint = sky(55);
  glint.disc(10, 16, 2, c('gold', 3)).set(9, 15, c('gold', 4));
  for (let i = 0; i < 3; i++) glint.set(6 + Math.floor(r() * 8), 9 + Math.floor(r() * 4), c('star', 1));
  book.add('glint', glint, { score: 25, touch: 'bg', grav: GRAV.down });

  // ---------- the way out ----------
  // past the needle gate: the open desert, dunes under the morning sun, and a signpost
  const dune = (seed: number, sign: boolean) => {
    const p = sky(seed, 3);
    for (let x = 0; x < 20; x++) {
      const top = 10 + Math.round(Math.sin((x + seed * 7) / 5) * 3);
      for (let y = top; y < 20; y++) p.set(x, y, shadeAt(R('sand'), 2, 5, 1 - (y - top) / 14 - (x % 7) / 40, x, y));
    }
    if (sign) {
      p.rect(9, 2, 2, 18, c('wood', 1));
      p.rect(2, 3, 16, 7, c('wood', 3)).frame(2, 3, 16, 7, c('wood', 1));
      micro(p, 3, 4, 'ROAD', c('ink', 0));
      p.line(14, 6, 17, 6, c('red', 2)).set(16, 5, c('red', 2)).set(16, 7, c('red', 2));
    }
    return p;
  };
  book.add('dune', dune(61, false), air);
  book.add('road', dune(62, true), air);
  // a painted Easter egg, left in the shadow of the great city gate behind him (a few points, no sound of its own)
  for (let f = 0; f < EGG_SHINE_FRAMES; f++)
    book.add(`egg${f || ''}`, drawEasterEgg(gateway.crop(0, 0, 20, 20), { ink: c('ink', 0), shell: [c('blue', 1), c('blue', 2), c('blue', 3)], paint: [c('gold', 2), c('gold', 3)], accent: c('white', 2), white: c('white', 2) }, 'stars', f), {
      score: 50,
      touch: 'gateway',
      grav: GRAV.down,
      next: `egg${(f + 1) % EGG_SHINE_FRAMES || ''}`,
      ntime: f ? 3 : 60,
    });
  return k;
}
