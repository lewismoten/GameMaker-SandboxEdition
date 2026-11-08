// THE SAME HOUSE's pictures. Each is drawn once, in slots of the palette's ramps, and shows in whichever
// palette the scene loads. The ramps named carpet, paper, roof and cloth are the ones the seven
// palettes change (palettes.ts); wood, brick, sky, ink and the rest are the Starters' own and
// look the same everywhere.
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from '../../kit/starter/palette';

const sky = (pal: Pal) => new Pixels(20, 20, skyOf(pal));

/** Wallpaper: pale stripes with a small repeated flower, drawn in the paper ramp (a house's inside wall). */
export function wallpaper(pal: Pal): Pixels {
  const w = pal.r('paper');
  const p = new Pixels(20, 20, w[1]);
  for (const x of [0, 10]) p.rect(x, 0, 3, 20, w[2]);
  for (const [x, y] of [
    [6, 5],
    [16, 15],
  ])
    p.rect(x, y, 2, 2, w[0])
      .set(x - 1, y, w[0])
      .set(x + 2, y + 1, w[0]);
  return p;
}

/** Siding on the outside of a house: boards in the paper ramp. */
export function siding(pal: Pal): Pixels {
  const w = pal.r('paper');
  const p = new Pixels(20, 20, w[1]);
  for (let y = 0; y < 20; y += 5) p.rect(0, y, 20, 1, w[0]).rect(0, y + 1, 20, 1, w[2]);
  return p;
}

/** The carpet: the top of the floor, with a woven edge. */
export function carpet(pal: Pal): Pixels {
  const c = pal.r('carpet');
  const p = new Pixels(20, 20, c[2]);
  p.rect(0, 0, 20, 3, c[3]).rect(0, 3, 20, 1, c[0]);
  for (let y = 6; y < 20; y += 4) for (let x = (y / 4) % 2 ? 0 : 2; x < 20; x += 4) p.rect(x, y, 2, 1, c[1]);
  return p;
}

/** A roof tile row in the roof ramp (a house's roof, a street front's roof). */
export function roofTile(pal: Pal): Pixels {
  const t = pal.r('roof');
  const p = new Pixels(20, 20, t[2]);
  for (let y = 0; y < 20; y += 5) {
    p.rect(0, y, 20, 1, t[3]).rect(0, y + 4, 20, 1, t[0]);
    for (let x = (y / 5) % 2 ? 0 : 5; x < 20; x += 10) p.rect(x, y + 1, 1, 3, t[0]);
  }
  return p;
}

/** A window of a house, seen from inside: wood frame, sky glass, and curtains in the cloth ramp. */
export function windowIn(pal: Pal, bg: Pixels): Pixels {
  const { c, r } = pal;
  const k = r('cloth');
  const wd = r('wood');
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  p.rect(3, 2, 14, 16, wd[1]).rect(5, 4, 10, 12, skyOf(pal)).rect(5, 4, 10, 2, c('sky', 4));
  p.rect(4, 3, 4, 14, k[2]).rect(12, 3, 4, 14, k[2]).rect(4, 3, 2, 14, k[3]).rect(12, 3, 2, 14, k[3]).rect(4, 16, 4, 1, k[0]).rect(12, 16, 4, 1, k[0]);
  p.rect(3, 2, 14, 1, k[0]).frame(3, 2, 14, 16, c('ink', 0));
  return p;
}

/** A picture on the wall: a wood frame around a cloth-ramp painting of a hill and a sun. */
export function painting(pal: Pal, bg: Pixels): Pixels {
  const { c, r } = pal;
  const k = r('cloth');
  const wd = r('wood');
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  p.rect(3, 4, 14, 12, wd[1]).rect(5, 6, 10, 8, k[3]).rect(5, 11, 10, 3, k[1]).disc(9, 9, 3, k[0]);
  p.frame(3, 4, 14, 12, c('ink', 0));
  return p;
}

/** One half of the sofa (left or right), on the wall: a back, an arm and a cushion in the cloth ramp, on wood feet. */
export function sofa(pal: Pal, bg: Pixels, half: 'l' | 'r'): Pixels {
  const { c, r } = pal;
  const k = r('cloth');
  const wd = r('wood');
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  const x0 = half === 'l' ? 2 : 0;
  const x1 = half === 'l' ? 20 : 18;
  p.rect(x0, 3, x1 - x0, 11, k[2])
    .rect(x0, 3, x1 - x0, 2, k[3])
    .rect(x0, 11, x1 - x0, 3, k[1]);
  const arm = half === 'l' ? 2 : 14;
  p.rect(arm, 6, 4, 10, k[1]).rect(arm, 6, 4, 2, k[2]);
  p.rect(x0 + (half === 'l' ? 4 : 0), 8, x1 - x0 - 4, 5, k[3]).rect(x0 + (half === 'l' ? 4 : 0), 12, x1 - x0 - 4, 1, k[0]);
  p.rect(half === 'l' ? 3 : 14, 16, 3, 4, wd[0]);
  p.frame(x0, 3, x1 - x0, 13, c('ink', 0));
  return p;
}

/** A window on the front of a house: shutters in the cloth ramp either side of the glass, on siding. */
export function frontWindow(pal: Pal, bg: Pixels): Pixels {
  const { c, r } = pal;
  const k = r('cloth');
  const wd = r('wood');
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  p.rect(1, 3, 18, 14, wd[1]).rect(5, 4, 10, 12, skyOf(pal)).rect(5, 4, 10, 2, c('sky', 4)).rect(9, 4, 2, 12, wd[1]);
  p.rect(1, 3, 4, 14, k[2]).rect(15, 3, 4, 14, k[2]).rect(1, 3, 1, 14, k[3]).rect(15, 3, 1, 14, k[3]);
  p.frame(1, 3, 18, 14, c('ink', 0));
  return p;
}

/** The glyph rows of one digit. */
const digit = (d: number): number[] => [...FONT8X8.subarray((48 + d) * 8, (48 + d) * 8 + 8)];

/** A house number over the door: a parchment plate with a big digit (the 8x8 font at 2x). */
export function plate(pal: Pal, bg: Pixels, d: number): Pixels {
  const { c, r } = pal;
  const pc = r('parch');
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  p.rect(1, 1, 18, 18, pc[2]).frame(1, 1, 18, 18, c('ink', 0));
  digit(d).forEach((row, y) => {
    for (let x = 0; x < 8; x++) if (row & (1 << x)) p.rect(2 + x * 2, 2 + y * 2, 2, 2, c('ink', 0));
  });
  return p;
}

/** Bricks of a tower wall, in the paper ramp (mortar lines in the dark shade). */
export function towerWall(pal: Pal): Pixels {
  const w = pal.r('paper');
  const p = new Pixels(20, 20, w[2]);
  for (let y = 0; y < 20; y += 5) {
    p.rect(0, y + 4, 20, 1, w[0]).rect(0, y, 20, 1, w[3]);
    for (let x = (y / 5) % 2 ? 4 : 14; x < 20; x += 10) p.rect(x, y, 1, 5, w[0]);
  }
  return p;
}

/** A tower's floor: flat slabs in the carpet ramp. */
export function slab(pal: Pal): Pixels {
  const c = pal.r('carpet');
  const p = new Pixels(20, 20, c[2]);
  p.rect(0, 0, 20, 2, c[3]).rect(0, 2, 20, 1, c[1]).rect(0, 19, 20, 1, c[0]);
  p.rect(9, 3, 1, 16, c[0]).rect(10, 3, 1, 16, c[1]);
  return p;
}

/** A tower's roof slab or corner post in the roof ramp (solid). */
export function cap(pal: Pal): Pixels {
  const t = pal.r('roof');
  const p = new Pixels(20, 20, t[2]);
  p.rect(0, 0, 20, 2, t[3]).rect(0, 18, 20, 2, t[0]).rect(0, 0, 2, 20, t[3]).rect(18, 0, 2, 20, t[0]);
  p.rect(6, 6, 8, 8, t[1]).rect(6, 6, 8, 1, t[3]).rect(6, 13, 8, 1, t[0]);
  return p;
}

/** A merlon on the tower's top: a roof-ramp block with sky either side. */
export function merlon(pal: Pal): Pixels {
  const t = pal.r('roof');
  const p = sky(pal);
  p.rect(3, 0, 14, 20, t[2]).rect(3, 0, 14, 2, t[3]).rect(3, 0, 2, 20, t[3]).rect(15, 0, 2, 20, t[0]);
  return p;
}

/** A wall lamp in the tower: a bracket and a glowing flame in the cloth ramp, on the wall. */
export function lamp(pal: Pal, bg: Pixels): Pixels {
  const { c, r } = pal;
  const k = r('cloth');
  const s = r('stone');
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  p.rect(9, 12, 2, 6, s[0]).rect(6, 12, 8, 2, s[0]);
  p.disc(10, 8, 5, c('ink', 0)).disc(10, 8, 4, k[1]).disc(10, 8, 3, k[2]).disc(10, 9, 2, k[3]);
  return p;
}

/** A banner hanging on the tower wall: a cloth-ramp flag with a pointed bottom. */
export function banner(pal: Pal, bg: Pixels): Pixels {
  const { c, r } = pal;
  const k = r('cloth');
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  p.rect(2, 1, 16, 2, r('wood')[1]);
  p.rect(4, 3, 12, 11, k[2]).rect(4, 3, 12, 1, k[3]).rect(4, 3, 2, 11, k[3]);
  for (let i = 0; i < 6; i++) p.rect(4 + i, 14 + i, 12 - 2 * i, 1, k[2]);
  p.disc(10, 8, 3, k[3]).disc(10, 8, 1.5, k[0]).frame(4, 3, 12, 11, c('ink', 0));
  return p;
}

/** A narrow window in the tower wall: a slit of sky between the bricks. */
export function slit(pal: Pal, bg: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  p.rect(7, 3, 6, 14, pal.c('ink', 0)).rect(8, 4, 4, 12, skyOf(pal)).rect(8, 4, 4, 2, pal.c('sky', 4));
  return p;
}
