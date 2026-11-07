// THE NOODLE OBSERVATORY's block pictures, 20x20 each, drawn in code. A place's backdrop (`bg`) comes first: every
// prop that stands in front of it (a ladder, a shelf, a part on a hook, a sign) is drawn over that same backdrop, so
// nothing shows a square of the wrong color. The places:
//   cupboard   butter-yellow cupboard backs, wooden doors, a speckled countertop (chapter 1 and the first scene)
//   pantry     deep shelves with jars in the dusk light, cupboard fronts as the shaft's walls (chapter 2)
//   lens       a cool tiled wall, a soft blue mat, lamps in painted rings of light (chapter 3)
//   loft       dark plank walls under the roof, shutters, dithered shafts of light (chapter 4 and its scene)
//   roof       the indigo night with stars, slate terrace, rails, planters, the bakery next door (chapters 5, 6)
// The icons (a part, a lens, a pad's stamp, a place setting) are drawn three ways: the thing itself to pick up, its
// outline on a locked socket, and fitted in place once the socket takes it.
import { Pixels, dither } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';

export const T = 255;
type P = Pixels;

const tile = (bg?: P): P => (bg ? new Pixels(20, 20).blit(bg, 0, 0) : new Pixels(20, 20, T));

export type Place = 'cupboard' | 'pantry' | 'lens' | 'loft' | 'roof';

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
export function floor(pal: Pal, kind: 'counter' | 'mat' | 'boards' | 'slate'): P {
  const { c } = pal;
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

/** A shelf plank across the top of the tile, its bracket below, over the backdrop. */
export function shelf(pal: Pal, bg: P, look: 'wood' | 'pad' = 'wood'): P {
  const p = tile(bg);
  const k = look === 'pad' ? pal.r('blue') : pal.r('cab');
  p.rect(0, 0, 20, 5, k[2]).rect(0, 0, 20, 1, k[4]).rect(0, 4, 20, 1, k[0]);
  p.rect(4, 5, 2, 4, k[1]).line(5, 8, 9, 5, k[1]);
  return p;
}

/** A shelf that wobbles before it tips (cupboard shelves on a clock): 0 level, 1 wobbling, 2 tipped (fall through). */
export function tiltShelf(pal: Pal, bg: P, stage: 0 | 1 | 2): P {
  const p = tile(bg);
  const k = pal.r('cab');
  const g = pal.r('gold');
  if (stage === 0) {
    p.rect(0, 0, 20, 5, k[3]).rect(0, 0, 20, 1, k[4]).rect(0, 4, 20, 1, k[0]);
    p.rect(1, 1, 2, 2, g[3]).rect(17, 1, 2, 2, g[3]);
  } else if (stage === 1) {
    p.line(0, 1, 19, 3, k[3]).line(0, 2, 19, 4, k[3]).line(0, 3, 19, 5, k[0]).line(0, 0, 19, 2, k[4]);
    // wobble lines: the cue that it is about to tip
    p.rect(2, 8, 3, 1, k[0]).rect(15, 9, 3, 1, k[0]).rect(8, 10, 4, 1, k[0]);
  } else {
    p.line(1, 0, 4, 18, k[3]).line(2, 0, 5, 18, k[3]).line(3, 0, 6, 18, k[0]);
    p.rect(1, 0, 2, 2, g[3]);
  }
  return p;
}

/** A wooden ladder over the backdrop. */
export function ladder(pal: Pal, bg: P): P {
  const p = tile(bg);
  const w = pal.r('wood');
  p.rect(3, 0, 3, 20, w[2]).rect(3, 0, 1, 20, w[4]).rect(14, 0, 3, 20, w[2]).rect(16, 0, 1, 20, w[1]);
  for (const y of [3, 10, 17]) p.rect(6, y, 8, 2, w[3]).rect(6, y + 1, 8, 1, w[1]);
  return p;
}

/** A doorway (the way in, or the way on): dark inside, a wooden frame; `half` 0 top, 1 bottom; `out` adds an arrow. */
export function doorway(pal: Pal, bg: P, half: 0 | 1, out: boolean): P {
  const p = tile(bg);
  const w = pal.r('cab');
  const inside = out ? pal.c('warm', 2) : pal.c('ink', 1);
  p.rect(2, half ? 0 : 3, 16, half ? 20 : 17, w[1]);
  p.rect(4, half ? 0 : 5, 12, half ? 20 : 15, inside);
  if (!half) p.rect(2, 3, 16, 2, w[3]);
  if (out && half === 0) {
    const ink = pal.c('ink', 0);
    p.rect(6, 11, 6, 2, ink).line(12, 8, 15, 12, ink).line(12, 15, 15, 12, ink).line(12, 9, 14, 12, ink).line(12, 14, 14, 12, ink);
  }
  if (out && half === 1) p.rect(4, 0, 12, 20, inside).rect(4, 0, 12, 1, pal.c('warm', 3));
  return p;
}

/** A window pane (2x2 tiles): the sky outside (the look colors it), a wooden frame; `moon` puts the round light in. */
export function windowTile(pal: Pal, bg: P, q: 0 | 1 | 2 | 3, moon = false): P {
  const p = tile(bg);
  const s = pal.r('sky');
  const k = pal.r('cab');
  const left = q % 2 === 0;
  const top = q < 2;
  const x0 = left ? 2 : 0;
  const y0 = top ? 2 : 0;
  const w = left ? 18 : 18;
  const h = top ? 18 : 18;
  p.rect(x0, y0, w, h, k[1]);
  for (let y = y0 + 2; y < y0 + h - (top ? 0 : 2); y++)
    for (let x = x0 + (left ? 2 : 0); x < x0 + w - (left ? 0 : 2); x++) p.set(x, y, s[Math.min(s.length - 1, 1 + Math.floor((y + (top ? 0 : 20)) / 8))]);
  // the cross bar between panes is drawn on the inner edges
  if (left) p.rect(18, y0, 2, h, k[2]);
  if (top) p.rect(x0, 18, w, 2, k[2]);
  if (moon && q === 1) {
    p.disc(9, 9, 4.6, pal.c('warm', 2)).disc(8, 8, 3.2, pal.c('warm', 3));
    p.set(10, 11, pal.c('warm', 1)).set(7, 10, pal.c('warm', 1));
  }
  return p;
}

/** A star washer: a steel ring with ten little teeth, a glint (10 points). */
export function washer(pal: Pal, bg: P): P {
  const p = tile(bg);
  const s = pal.r('steel');
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    p.disc(10 + Math.cos(a) * 6.2, 10 + Math.sin(a) * 6.2, 1.2, s[1]);
  }
  p.disc(10, 10, 5.6, s[2]).disc(10, 10, 4.4, s[3]).disc(10, 10, 2.2, bg.get(10, 10));
  p.ring(10, 10, 5.6, s[0]);
  p.set(7, 7, s[4]).set(8, 6, s[4]);
  return p;
}

export type Icon =
  | 'bracket'
  | 'knob'
  | 'foot'
  | 'tube'
  | 'eyepiece'
  | 'finder'
  | 'cap'
  | 'legs'
  | 'lens'
  | 'circle'
  | 'square'
  | 'triangle'
  | 'rattle'
  | 'plate'
  | 'cup'
  | 'mat';

/** Draws an icon, about 14x14, centered on (cx, cy): `fill` its main color ramp, or one ink color for an outline. */
export function icon(pal: Pal, p: P, kind: Icon, cx: number, cy: number, how: 'thing' | 'outline'): void {
  const { c, r } = pal;
  const ink = c('ink', 0);
  const o = how === 'outline';
  const st = r('steel');
  const col = (k: number, ramp = st) => (o ? ink : ramp[k]);
  const under = p.get(cx, cy);
  switch (kind) {
    case 'bracket':
      p.rect(cx - 5, cy - 5, 3, 11, col(2)).rect(cx - 5, cy + 3, 11, 3, col(2));
      if (!o)
        p.rect(cx - 5, cy - 5, 1, 11, st[4])
          .set(cx - 4, cy - 2, st[0])
          .set(cx + 2, cy + 4, st[0]);
      break;
    case 'knob':
      p.disc(cx, cy, 5, col(2, r('wood'))).disc(cx, cy, o ? 3.5 : 2.5, o ? under : r('wood')[4]);
      break;
    case 'foot':
      p.rect(cx - 5, cy - 5, 10, 10, col(1, r('wood'))).rect(cx - 3, cy - 3, 6, 6, o ? under : r('wood')[3]);
      break;
    case 'tube':
      for (let k = -6; k <= 6; k += 1) p.rect(cx + k, cy - 3, 1, 6, o ? ink : k % 3 === 0 ? r('blue')[1] : r('blue')[3]);
      if (!o) p.rect(cx - 6, cy - 3, 13, 1, r('blue')[4]);
      break;
    case 'eyepiece':
      p.rect(cx - 2, cy - 6, 5, 9, col(1)).rect(cx - 4, cy + 3, 9, 3, col(2));
      if (!o) p.rect(cx - 1, cy - 6, 1, 9, st[4]).rect(cx - 1, cy - 7, 3, 1, c('glass', 3));
      break;
    case 'finder':
      p.rect(cx - 6, cy - 2, 10, 4, col(2, r('teal'))).rect(cx + 4, cy - 3, 3, 6, col(1));
      if (!o) p.set(cx - 6, cy, c('glass', 3)).rect(cx - 5, cy - 2, 9, 1, c('teal', 4));
      break;
    case 'cap':
      p.disc(cx, cy, 5.5, col(1, r('red'))).disc(cx, cy, 3.5, o ? under : r('red')[3]);
      break;
    case 'legs':
      p.line(cx, cy - 6, cx - 5, cy + 6, col(2, r('wood'))).line(cx, cy - 6, cx + 5, cy + 6, col(2, r('wood')));
      p.line(cx, cy - 6, cx, cy + 6, col(1, r('wood'))).rect(cx - 2, cy - 7, 5, 2, col(2));
      break;
    case 'lens':
      p.disc(cx, cy, 6.5, o ? ink : c('gold', 1))
        .disc(cx, cy, 5.2, o ? ink : c('gold', 3))
        .disc(cx, cy, o ? 4.5 : 4.2, o ? under : c('glass', 1));
      if (!o)
        p.disc(cx, cy, 3, c('glass', 2))
          .line(cx - 2, cy, cx, cy - 2, c('glass', 3))
          .set(cx + 2, cy + 2, c('glass', 3));
      break;
    case 'circle':
      p.ring(cx, cy, 5, col(4, r('gold'))).ring(cx, cy, 4, col(3, r('gold')));
      break;
    case 'square':
      p.frame(cx - 5, cy - 5, 11, 11, col(4, r('gold'))).frame(cx - 4, cy - 4, 9, 9, col(3, r('gold')));
      break;
    case 'triangle':
      p.line(cx, cy - 5, cx - 6, cy + 5, col(4, r('gold')))
        .line(cx, cy - 5, cx + 6, cy + 5, col(4, r('gold')))
        .line(cx - 6, cy + 5, cx + 6, cy + 5, col(4, r('gold')))
        .line(cx, cy - 4, cx - 5, cy + 4, col(3, r('gold')));
      break;
    case 'rattle': {
      // a brass luggage tag with a string hole, and three wavy rattle marks beside it: the colander went this way
      const g = r('gold');
      p.rect(cx - 6, cy - 4, 9, 9, o ? ink : g[1]).rect(cx - 5, cy - 3, 7, 7, o ? under : g[3]);
      p.line(cx + 3, cy - 4, cx + 5, cy, o ? ink : g[1]).line(cx + 3, cy + 4, cx + 5, cy, o ? ink : g[1]);
      p.disc(cx - 2, cy, 1.2, o ? ink : g[0]);
      if (!o) p.rect(cx - 5, cy - 3, 7, 1, g[5]);
      p.line(cx + 7, cy - 5, cx + 8, cy - 3, col(1))
        .line(cx + 7, cy - 1, cx + 9, cy - 1, col(1))
        .line(cx + 7, cy + 3, cx + 8, cy + 5, col(1));
      break;
    }
    case 'plate':
      p.disc(cx, cy, 6, o ? ink : r('white')[1])
        .disc(cx, cy, 4.5, o ? under : r('white')[3])
        .ring(cx, cy, 3, o ? ink : r('white')[1]);
      break;
    case 'cup':
      p.rect(cx - 4, cy - 4, 8, 8, col(2, r('teal'))).rect(cx + 4, cy - 2, 3, 4, col(1, r('teal')));
      if (!o) p.rect(cx - 4, cy - 4, 8, 1, c('teal', 4)).rect(cx + 5, cy - 1, 1, 2, p.get(0, 0));
      break;
    case 'mat':
      p.rect(cx - 6, cy - 4, 13, 8, col(2, r('green')));
      if (!o) for (let x = cx - 5; x < cx + 7; x += 3) p.rect(x, cy - 4, 1, 8, c('green', 4));
      break;
  }
}

/** A part to pick up: the icon over the backdrop. */
export function thing(pal: Pal, bg: P, kind: Icon): P {
  const p = tile(bg);
  icon(pal, p, kind, 10, 10, 'thing');
  return p;
}

/**
 * A socket: a padded little door with the outline of the part it takes (solid until it gets one). The outline's
 * shape tells the parts apart as well as the color does.
 */
export function socket(pal: Pal, kind: Icon): P {
  const p = cabinet(pal);
  const k = pal.r('cab');
  p.rect(3, 3, 14, 14, pal.c('parch', 3));
  icon(pal, p, kind, 10, 10, 'outline');
  p.frame(3, 3, 14, 14, k[0]);
  return p;
}

/** The socket once it took its part: an open frame with the part fitted at the top (walk through). */
export function fitted(pal: Pal, bg: P, kind: Icon): P {
  const p = tile(bg);
  const k = pal.r('cab');
  p.rect(0, 0, 3, 20, k[2]).rect(17, 0, 3, 20, k[2]).rect(0, 0, 20, 3, k[2]);
  p.rect(0, 0, 1, 20, k[3]).rect(19, 0, 1, 20, k[1]);
  icon(pal, p, kind, 10, 9, 'thing');
  return p;
}

/** The lintel over a socket: the frame's top over the backdrop (walk under it). */
export function lintel(pal: Pal, bg: P): P {
  const p = tile(bg);
  const k = pal.r('cab');
  p.rect(0, 0, 20, 6, k[1]).rect(0, 0, 20, 1, k[3]).rect(0, 6, 3, 14, k[2]).rect(17, 6, 3, 14, k[2]);
  p.rect(7, 1, 6, 4, pal.c('gold', 3)).rect(7, 1, 6, 1, pal.c('gold', 5));
  return p;
}

/** A pit's soft bottom: a cushion one row lower than the floor (a missed hop lands softly; hop out). */
export function cushion(pal: Pal, bg: P): P {
  const p = tile(bg);
  const b = pal.r('blue');
  p.rect(0, 8, 20, 12, b[1]).rect(1, 8, 18, 3, b[3]).rect(1, 8, 18, 1, b[4]);
  for (const x of [5, 10, 15]) p.set(x, 13, b[0]);
  return p;
}

/** A lamp hanging from the ceiling (the bright middle of its ring of light). */
export function lamp(pal: Pal, bg: P): P {
  const p = tile(bg);
  const w = pal.r('warm');
  p.rect(9, 0, 2, 6, pal.c('ink', 1));
  p.rect(4, 6, 12, 5, pal.c('green', 1)).rect(5, 6, 10, 1, pal.c('green', 3));
  p.rect(6, 11, 8, 2, w[3]).rect(8, 13, 4, 1, w[2]);
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

/** A pad on the floor marked with a shape: step on it to set a shutter (a stamp shows it took). */
export function pad(pal: Pal, bg: P, kind: Icon, set: boolean): P {
  const p = tile(bg);
  const k = pal.r('cab');
  p.rect(2, 14, 16, 6, set ? pal.c('gold', 2) : k[3]).rect(2, 14, 16, 1, set ? pal.c('gold', 4) : k[4]);
  icon(pal, p, kind, 10, 7, set ? 'thing' : 'outline');
  if (set) p.rect(9, 0, 2, 2, pal.c('warm', 3));
  return p;
}

/** A railing over the night (passable: it only keeps the eye on the roof's edge). */
export function rail(pal: Pal, bg: P): P {
  const p = tile(bg);
  const s = pal.r('steel');
  p.rect(0, 4, 20, 2, s[2]).rect(0, 4, 20, 1, s[3]);
  for (const x of [3, 13]) p.rect(x, 6, 2, 14, s[1]);
  return p;
}

/** A planter box with a winter shrub (solid; stand on it). */
export function planter(pal: Pal, bg: P, top: boolean): P {
  const p = tile(bg);
  const w = pal.r('wood');
  const l = pal.r('leaf');
  if (top) {
    p.disc(10, 13, 8, l[1]).disc(8, 11, 5, l[2]).disc(13, 12, 4, l[2]).set(7, 8, l[3]).set(12, 9, l[3]);
    p.rect(0, 16, 20, 4, w[2]).rect(0, 16, 20, 1, w[4]);
  } else {
    p.rect(0, 0, 20, 20, w[2]).rect(0, 0, 1, 20, w[4]).rect(19, 0, 1, 20, w[0]).rect(0, 9, 20, 1, w[1]);
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

/** The supper table: a cloth-covered top (a ledge), a leg, or a place laid on it. */
export function table(pal: Pal, bg: P, part: 'top' | 'leg'): P {
  const p = tile(bg);
  const b = pal.r('blue');
  const w = pal.r('white');
  if (part === 'top') {
    p.rect(0, 0, 20, 4, w[3]).rect(0, 4, 20, 6, w[2]);
    for (let x = 0; x < 20; x += 4) p.rect(x, 0, 2, 10, b[3]);
    for (let y = 0; y < 10; y += 4) p.rect(0, y, 20, 2, b[2]);
    p.rect(0, 10, 20, 1, b[0]);
  } else p.rect(8, 0, 4, 20, pal.c('wood', 2)).rect(8, 0, 1, 20, pal.c('wood', 4));
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
