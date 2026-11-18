// Place backdrops, floors, walls and their light, drawn as 20x20 tiles.
import { Pixels, dither } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';
import { tile } from './artTile';

type P = Pixels;

export type Place = 'cupboard' | 'pantry' | 'lens' | 'loft' | 'roof' | 'yard' | 'bakery';

/** Each place's floor. */
export const FLOORS = { cupboard: 'counter', pantry: 'counter', lens: 'mat', loft: 'boards', roof: 'slate', yard: 'snow', bakery: 'tiles' } as const;

/** Places open to the night sky (no ceiling; the walls run up out of sight). */
export const isOpen = (place: Place): boolean => place === 'roof' || place === 'yard';

/** A place's backdrop: `v` (0..3) varies it a little so a wall is not one stamp repeated. */
export function backdrop(pal: Pal, place: Place, v = 0): P {
  const p = new Pixels(20, 20);
  const { c, r } = pal;
  if (place === 'cupboard') {
    const b = r('butter');
    p.rect(0, 0, 20, 20, b[3]);
    p.rect(9, 0, 1, 20, b[2]).rect(19, 0, 1, 20, b[2]).rect(10, 0, 1, 20, b[4]).rect(0, 0, 1, 20, b[4]);
    if (v === 1) p.set(4, 6, b[1]).set(5, 6, b[2]).set(4, 7, b[2]);
    if (v === 2) p.rect(13, 12, 3, 1, b[2]).set(14, 11, b[2]);
  } else if (place === 'pantry') {
    const b = r('butter');
    p.rect(0, 0, 20, 20, b[2]);
    p.rect(0, 15, 20, 2, b[4]).rect(0, 17, 20, 1, b[1]);
    // jars on the back shelf now and then: short and tall, lids in different colors
    const jar = (x: number, h: number, lid: number) => {
      p.rect(x, 15 - h, 5, h, c('glass', 1))
        .rect(x + 1, 16 - h, 1, h - 2, c('glass', 3))
        .rect(x, 14 - h, 5, 2, lid);
    };
    if (v === 1) jar(3, 6, c('red', 2));
    if (v === 2) jar(11, 8, c('teal', 2));
    if (v === 3) jar(7, 5, c('gold', 3));
  } else if (place === 'lens') {
    const w = r('white');
    p.rect(0, 0, 20, 20, w[1]);
    for (const y of [0, 10]) p.rect(0, y, 20, 1, c('stone', 2));
    for (const x of [0, 10]) p.rect(x, 0, 1, 20, c('stone', 2));
    p.rect(1, 1, 9, 1, w[2]).rect(11, 11, 9, 1, w[2]);
    if (v === 1) p.rect(12, 2, 6, 6, c('glass', 2)).rect(12, 2, 6, 1, c('glass', 3));
    if (v === 2) p.rect(2, 12, 6, 6, c('butter', 3)).rect(2, 12, 6, 1, c('butter', 4));
  } else if (place === 'loft') {
    const k = r('cab');
    p.rect(0, 0, 20, 20, k[1]);
    for (const y of [0, 7, 14]) p.rect(0, y, 20, 1, k[0]);
    p.set((v * 7 + 3) % 20, 3, k[2])
      .set((v * 5 + 11) % 20, 10, k[2])
      .set((v * 3 + 6) % 20, 17, k[0]);
  } else if (place === 'bakery') {
    // warm plaster, a faint trowel texture, now and then a dusting of flour
    const pa = r('parch');
    p.rect(0, 0, 20, 20, pa[2]);
    for (const [x, y] of [
      [3, 4],
      [14, 9],
      [8, 16],
    ])
      p.rect((x + v * 5) % 18, y, 3, 1, pa[3]);
    if (v === 1) p.set(5, 12, pa[1]).set(6, 12, pa[1]);
    if (v === 2) p.rect(11, 3, 2, 1, pa[4]).set(12, 4, pa[4]);
    if (v === 3) p.set(16, 15, pa[1]);
  } else if (place === 'yard') {
    // the night over the yards, with snow falling (the variants carry the flakes)
    const s = r('sky');
    p.rect(0, 0, 20, 20, s[1]);
    const flakes: [number, number][][] = [
      [],
      [[5, 6]],
      [
        [14, 2],
        [3, 15],
      ],
      [[11, 11]],
    ];
    for (const [x, y] of flakes[v % 4]) p.set(x, y, c('white', 3)).set(x + 1, y + 1, c('white', 1));
  } else {
    const s = r('sky');
    p.rect(0, 0, 20, 20, s[1]);
    const stars: [number, number][][] = [
      [[4, 5]],
      [
        [14, 3],
        [6, 15],
      ],
      [[11, 12]],
      [],
    ];
    for (const [x, y] of stars[v % 4]) p.set(x, y, c('white', 3)).set(x + 1, y, c('white', 1));
  }
  return p;
}

/** A painted pool of lamplight on a backdrop: shades step one lighter inside `r1`, dithered out to `r2` (lights-out). */
export function litBy(pal: Pal, bg: P, cx: number, cy: number, r1: number, r2: number, ramps: string[]): P {
  const up = new Map<number, number>();
  for (const name of ramps) {
    const ramp = pal.r(name);
    ramp.forEach((v, i) => up.set(v, ramp[Math.min(ramp.length - 1, i + 1)]));
  }
  const p = new Pixels(bg.w, bg.h).blit(bg, 0, 0);
  for (let y = 0; y < bg.h; y++)
    for (let x = 0; x < bg.w; x++) {
      const d = Math.hypot(x - cx, y - cy);
      const lit = d < r1 || (d < r2 && dither(x, y, 1 - (d - r1) / (r2 - r1)));
      const v = p.get(x, y);
      if (lit && up.has(v)) p.set(x, y, up.get(v)!);
    }
  return p;
}

/** A solid cupboard door (a wall, a socket's frame); `dark` for the pantry's deeper doors. */
export function cabinet(pal: Pal, v = 0): P {
  const k = pal.r('cab');
  const p = new Pixels(20, 20, k[2]);
  p.rect(0, 0, 20, 1, k[3]).rect(0, 19, 20, 1, k[0]).rect(0, 0, 1, 20, k[3]).rect(19, 0, 1, 20, k[1]);
  p.rect(3, 3, 14, 14, k[1]).rect(4, 4, 12, 12, k[2]).rect(4, 4, 12, 1, k[3]);
  if (v === 1) p.disc(14, 10, 1.4, pal.c('gold', 4)).set(14, 9, pal.c('gold', 5));
  return p;
}

/** A countertop or terrace floor: a light top edge and a speckled face (`kind` picks the stone). */
export function floor(pal: Pal, kind: 'counter' | 'mat' | 'boards' | 'slate' | 'snow' | 'tiles'): P {
  const { c } = pal;
  if (kind === 'snow') {
    const d = pal.r('dirt');
    const w = pal.r('white');
    const p = new Pixels(20, 20, d[1]);
    p.rect(0, 0, 20, 6, w[3]).rect(0, 6, 20, 2, w[1]).rect(0, 8, 20, 1, w[0]);
    p.set(4, 2, w[1]).set(13, 3, w[1]).set(15, 12, d[2]).set(6, 15, d[0]);
    return p;
  }
  if (kind === 'tiles') {
    const t = pal.r('orange');
    const p = new Pixels(20, 20, t[1]);
    p.rect(0, 0, 20, 3, t[3]).rect(0, 3, 20, 1, t[0]);
    for (const y of [4, 12]) p.rect(0, y + 7, 20, 1, t[0]);
    p.rect(9, 4, 1, 7, t[0]).rect(0, 12, 1, 8, t[0]).rect(1, 5, 7, 1, t[2]);
    return p;
  }
  if (kind === 'mat') {
    const p = new Pixels(20, 20, c('blue', 2));
    p.rect(0, 0, 20, 3, c('blue', 4)).rect(0, 3, 20, 1, c('blue', 3));
    for (let x = 2; x < 20; x += 5) p.rect(x, 8, 1, 8, c('blue', 1));
    return p;
  }
  if (kind === 'boards') {
    const k = pal.r('cab');
    const p = new Pixels(20, 20, k[2]);
    p.rect(0, 0, 20, 2, k[3]).rect(0, 9, 20, 1, k[1]).rect(7, 2, 1, 7, k[1]).rect(15, 10, 1, 10, k[1]);
    return p;
  }
  if (kind === 'slate') {
    const s = pal.r('slate');
    const p = new Pixels(20, 20, s[1]);
    p.rect(0, 0, 20, 3, s[3]).rect(0, 3, 20, 1, s[2]).rect(0, 11, 20, 1, s[0]).rect(9, 4, 1, 7, s[0]).rect(3, 12, 1, 8, s[0]);
    return p;
  }
  const s = pal.r('stone');
  const p = new Pixels(20, 20, s[2]);
  p.rect(0, 0, 20, 4, s[4]).rect(0, 4, 20, 1, s[1]);
  for (const [x, y] of [
    [3, 8],
    [11, 6],
    [16, 12],
    [7, 15],
    [14, 17],
  ])
    p.set(x, y, s[0]).set(x + 1, y, s[3]);
  return p;
}

/** The loft's shutter (solid wall piece): slats; `open` tilts them so light falls through. */
export function shutter(pal: Pal, open: boolean): P {
  const k = pal.r('cab');
  const p = new Pixels(20, 20, k[0]);
  for (let y = 1; y < 20; y += 4) {
    if (open)
      p.rect(1, y, 18, 1, pal.c('warm', 3))
        .rect(1, y + 1, 18, 2, k[2])
        .rect(1, y + 3, 18, 1, k[1]);
    else p.rect(1, y, 18, 3, k[2]).rect(1, y, 18, 1, k[3]);
  }
  return p;
}

/** A shaft of light through the shutters, dithered over the backdrop (beams): `k` 0..2 is how bright. */
export function shaft(pal: Pal, bg: P, k: number): P {
  const p = tile(bg);
  const w = pal.r('warm');
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const edge = 1 - Math.abs(x - 9.5) / 8;
      if (edge > 0 && dither(x, y, edge * (0.3 + k * 0.2))) p.set(x, y, w[Math.min(3, k + (edge > 0.6 ? 1 : 0))]);
    }
  return p;
}

/** A chimney or the bakery's side wall: bricks (solid). */
export function bricks(pal: Pal, dim = false): P {
  const b = pal.r(dim ? 'slate' : 'brick');
  const p = new Pixels(20, 20, b[1]);
  for (let y = 0; y < 20; y += 5) {
    p.rect(0, y, 20, 1, b[0]);
    for (let x = (y / 5) % 2 ? 5 : 0; x < 20; x += 10) p.rect(x, y, 1, 5, b[0]);
  }
  return p;
}

/** The round light at the top of the sky (2x2: q 0..3). Before the reveal, it looks like a cheese-colored moon. */
export function roundLight(pal: Pal, bg: P, q: 0 | 1 | 2 | 3, sill: boolean): P {
  const p = tile(bg);
  const w = pal.r('warm');
  const ox = q % 2 ? -20 : 0;
  const oy = q >= 2 ? -20 : 0;
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const d = Math.hypot(x - ox - 19.5, y - oy - 19.5);
      if (d < 15) p.set(x, y, d < 10 ? w[3] : d < 13.5 ? w[2] : w[1]);
      else if (sill && d < 17) p.set(x, y, pal.c('stone', 3));
    }
  // a few darker spots that made it look like cheese
  if (!sill) {
    for (const [x, y] of [
      [26, 14],
      [14, 24],
      [24, 27],
    ])
      p.disc(x + ox, y + oy, 1.6, w[2]);
  } else {
    // one upright mullion of wood down the middle: two panes, so it is a window and not a moon
    p.rect(19 + ox, 5 + oy, 2, 30, pal.c('cab', 1));
  }
  return p;
}
