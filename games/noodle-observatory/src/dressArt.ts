// The pictures that dress a room (dress.ts puts them on the map): what lies under the floor (the kitchen's lower
// cupboards, drawers and oven; the lens room's tiled wainscot; the loft's joists; the house's brick front under the
// roof), the things on a wall (a clock, a calendar, Nell's drawing, hung spoons, a pan, a star chart), a cast
// shadow under a shelf, cupboard fronts in a few kinds for the walls, and the night sky deepening up high with its
// slow-twinkling stars. Every picture is a whole 20x20 block drawn over the place's own backdrop.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { gradient, rampShift } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Pal } from '../../kit/starter/palette';

type P = Pixels;
const tile = (bg: P): P => new Pixels(20, 20).blit(bg, 0, 0);

/** Every ramp a backdrop or prop is drawn in: a shadow steps any of them one shade darker. */
export const SHADE_RAMPS = [
  'butter',
  'cab',
  'stone',
  'white',
  'glass',
  'sky',
  'wood',
  'blue',
  'slate',
  'night',
  'warm',
  'parch',
  'brick',
  'teal',
  'red',
  'gold',
  'steel',
  'leaf',
  'green',
];

/** `p` with a cast shadow: one shade darker where `level` says (0..1), dithered. */
export function shaded(pal: Pal, p: P, level: (x: number, y: number) => number, steps = -1): P {
  return rampShift(
    tile(p),
    SHADE_RAMPS.map((n) => pal.r(n)),
    steps,
    level,
  );
}

/** The backdrop just under a shelf: the shelf's shadow, darkest at the top. */
export const underShelf = (pal: Pal, bg: P): P => shaded(pal, bg, (_x, y) => 0.55 - y / 14);

/** The kitchen's lower cupboards under the counter: a pair of drawers (half 0 left, 1 right). */
export function drawer(pal: Pal, half: 0 | 1): P {
  const k = pal.r('cab');
  const p = new Pixels(20, 20, k[2]);
  p.rect(0, 0, 20, 3, k[0]).rect(0, 3, 20, 1, k[3]).rect(0, 19, 20, 1, k[1]);
  p.rect(half ? 0 : 1, 4, 19, 14, k[3])
    .rect(half ? 0 : 2, 5, 17, 12, k[2])
    .rect(half ? 0 : 2, 5, 17, 1, k[4]);
  if (half === 0) p.rect(0, 3, 1, 17, k[1]);
  else p.rect(19, 3, 1, 17, k[1]);
  // the long pull across the middle of the pair
  const g = pal.r('gold');
  if (half === 0) p.rect(14, 10, 6, 2, g[2]).rect(14, 10, 6, 1, g[4]);
  else p.rect(0, 10, 6, 2, g[2]).rect(0, 10, 6, 1, g[4]);
  return p;
}

/** A lower cupboard door, two blocks tall (`row` 0 top, 1 bottom); `hinge` is the side it opens from. */
export function door(pal: Pal, row: 0 | 1, hinge: 'left' | 'right'): P {
  const k = pal.r('cab');
  const p = new Pixels(20, 20, k[2]);
  const top = row === 0;
  p.rect(1, top ? 1 : 0, 18, top ? 19 : 18, k[1]);
  p.rect(2, top ? 2 : 0, 16, top ? 18 : 17, k[2]);
  // a raised panel inside the frame
  p.rect(4, top ? 4 : 0, 12, top ? 16 : 14, k[3]).rect(5, top ? 5 : 0, 10, top ? 15 : 13, k[2]);
  if (top) p.rect(4, 4, 12, 1, k[4]);
  else p.rect(4, 14, 12, 1, k[0]);
  if (top) p.rect(0, 0, 20, 1, k[0]);
  else p.rect(0, 18, 20, 2, k[0]);
  // the knob, low on the top half by the opening edge
  if (top) {
    const x = hinge === 'left' ? 16 : 3;
    p.disc(x, 16, 1.5, pal.c('gold', 3)).set(x, 15, pal.c('gold', 5));
  }
  return p;
}

/** The oven, 2x2 (`q` 0..3): a dark glass door with a warm glow inside and a handle bar along the top. */
export function oven(pal: Pal, q: 0 | 1 | 2 | 3): P {
  const s = pal.r('steel');
  const w = pal.r('warm');
  const p = new Pixels(40, 40, s[2]);
  p.rect(0, 0, 40, 2, s[0]).rect(0, 38, 40, 2, s[0]).rect(0, 0, 1, 40, s[3]).rect(39, 0, 1, 40, s[1]);
  // the dials and the handle
  for (const x of [8, 16, 24, 32]) p.disc(x, 5, 1.6, pal.c('ink', 1)).set(x, 4, s[4]);
  p.rect(5, 10, 30, 2, s[4]).rect(5, 12, 30, 1, s[0]);
  // the window: dark glass, a warm glow low down, a glint
  p.rect(6, 15, 28, 18, pal.c('ink', 1));
  gradient(p, 7, 16, 26, 16, w, 0, 2);
  p.rect(7, 16, 26, 6, pal.c('ink', 1)).rect(7, 22, 26, 1, w[0]);
  p.line(9, 17, 13, 17, s[3]);
  return p.crop((q % 2) * 20, (q >> 1) * 20, 20, 20);
}

/** The toe kick under the cupboards (dark), or the kitchen floor below it: soft two-tone squares. */
export function kitchenLow(pal: Pal, kind: 'kick' | 'floor'): P {
  const s = pal.r('stone');
  if (kind === 'kick') {
    const p = new Pixels(20, 20, s[1]);
    p.rect(0, 0, 20, 7, pal.c('cab', 0)).rect(0, 7, 20, 1, s[3]);
    for (let x = 0; x < 20; x++) for (let y = 8; y < 20; y++) if (((x >> 3) + (y >> 3)) % 2) p.set(x, y, s[2]);
    return p;
  }
  const p = new Pixels(20, 20, s[1]);
  for (let x = 0; x < 20; x++) for (let y = 0; y < 20; y++) if (((x / 10) | 0) % 2 === ((y / 10) | 0) % 2) p.set(x, y, s[2]);
  p.set(4, 13, s[0]).set(15, 4, s[3]);
  return p;
}

/** The lens room's tiled wall below the mat (pale glass tiles), or its baseboard. */
export function wainscot(pal: Pal, kind: 'tile' | 'base'): P {
  const g = pal.r('glass');
  const st = pal.r('stone');
  const p = new Pixels(20, 20, g[1]);
  if (kind === 'base') return p.rect(0, 0, 20, 4, st[1]).rect(0, 4, 20, 16, st[1]).rect(0, 4, 20, 1, st[3]);
  for (const y of [0, 10]) p.rect(0, y, 20, 1, st[2]);
  for (const x of [0, 10]) p.rect(x, 0, 1, 20, st[2]);
  p.rect(1, 1, 8, 1, g[2]).rect(11, 11, 8, 1, g[2]).set(2, 2, g[3]).set(12, 12, g[3]);
  return p;
}

/** Under the loft's floor: the joists (`kind` beam), the boards' ends between them (gap) and the dark below. */
export function joists(pal: Pal, kind: 'beam' | 'gap' | 'dark'): P {
  const k = pal.r('cab');
  const p = new Pixels(20, 20, k[0]);
  if (kind === 'dark') return p.set(5, 9, k[1]).set(15, 15, k[1]);
  if (kind === 'beam') p.rect(6, 0, 8, 20, k[1]).rect(6, 0, 1, 20, k[2]).rect(13, 0, 1, 20, pal.c('ink', 1));
  else p.rect(0, 0, 20, 4, k[1]).rect(0, 4, 20, 1, pal.c('ink', 1));
  return p;
}

/** The house's front under the roof terrace: a stone cornice, plain brick, and windows lit warm or dark. */
export function facade(pal: Pal, kind: 'cornice' | 'brick' | 'lit' | 'dark'): P {
  const b = pal.r('brick');
  const s = pal.r('stone');
  const p = new Pixels(20, 20, b[1]);
  for (let y = 0; y < 20; y += 5) {
    p.rect(0, y, 20, 1, b[0]);
    for (let x = (y / 5) % 2 ? 5 : 0; x < 20; x += 10) p.rect(x, y, 1, 5, b[0]);
  }
  if (kind === 'cornice') return p.rect(0, 0, 20, 6, s[2]).rect(0, 0, 20, 1, s[4]).rect(0, 6, 20, 2, s[0]).rect(0, 8, 20, 1, pal.c('ink', 1));
  if (kind === 'brick') return p.set(4, 12, b[2]).set(13, 3, b[2]);
  // a window with a stone sill and lintel
  p.rect(4, 2, 12, 2, s[3]).rect(3, 16, 14, 2, s[3]).rect(3, 18, 14, 1, s[0]);
  if (kind === 'lit') {
    const w = pal.r('warm');
    p.rect(5, 4, 10, 12, w[2]).rect(5, 4, 10, 4, w[3]);
    // curtains drawn to the sides, a cross bar
    p.rect(5, 4, 2, 12, pal.c('red', 2)).rect(13, 4, 2, 12, pal.c('red', 2)).rect(9, 4, 2, 12, pal.c('cab', 1));
  } else {
    p.rect(5, 4, 10, 12, pal.c('night', 1)).rect(9, 4, 2, 12, pal.c('cab', 0)).set(7, 6, pal.c('night', 3));
  }
  return p;
}

/** A cupboard front in one of three kinds, for walls: a door knob left or right, or two drawers. */
export function cupboardFront(pal: Pal, v: 0 | 1 | 2): P {
  const k = pal.r('cab');
  const p = new Pixels(20, 20, k[2]);
  p.rect(0, 0, 20, 1, k[3]).rect(0, 19, 20, 1, k[0]).rect(0, 0, 1, 20, k[3]).rect(19, 0, 1, 20, k[1]);
  const g = pal.r('gold');
  if (v === 2) {
    for (const y of [2, 11])
      p.rect(3, y, 14, 7, k[1])
        .rect(4, y + 1, 12, 5, k[2])
        .rect(4, y + 1, 12, 1, k[3])
        .rect(8, y + 3, 4, 1, g[3]);
    return p;
  }
  p.rect(3, 3, 14, 14, k[1]).rect(4, 4, 12, 12, k[2]).rect(4, 4, 12, 1, k[3]);
  const x = v === 0 ? 14 : 5;
  return p.disc(x, 10, 1.4, g[4]).set(x, 9, g[5]);
}

/** The glass-fronted upper cupboard along the ceiling: plates stood on edge and a row of cups behind the glass. */
export function glassCupboard(pal: Pal): P {
  const k = pal.r('cab');
  const p = new Pixels(20, 20, k[1]);
  p.rect(0, 19, 20, 1, k[0]).rect(2, 0, 16, 18, pal.c('glass', 0));
  p.rect(2, 9, 16, 1, k[2]);
  for (const x of [3, 7, 11]) p.disc(x + 2, 5, 3, pal.c('white', 3)).ring(x + 2, 5, 3, pal.c('blue', 3));
  for (const x of [3, 9, 14]) p.rect(x, 13, 3, 4, pal.c('red', 3)).rect(x, 13, 3, 1, pal.c('white', 3));
  p.line(3, 1, 7, 17, pal.c('glass', 2));
  return p;
}

export type WallProp = 'clock' | 'calendar' | 'drawing' | 'spoons' | 'pan' | 'chart' | 'diagram' | 'chalk' | 'braid';

/** A thing hung on a wall, over the backdrop. */
export function wallProp(pal: Pal, bg: P, kind: WallProp): P {
  const p = tile(bg);
  const { c } = pal;
  const ink = c('ink', 1);
  const nail = () => p.set(10, 1, ink);
  if (kind === 'clock') {
    p.disc(10, 10, 7.5, c('cab', 1)).disc(10, 10, 6.2, c('white', 3));
    for (const [x, y] of [
      [10, 5],
      [15, 10],
      [10, 15],
      [5, 10],
    ])
      p.set(x, y, ink);
    p.line(10, 10, 10, 6, ink).line(10, 10, 13, 11, ink);
  } else if (kind === 'calendar') {
    nail();
    p.rect(4, 2, 12, 16, c('white', 3)).rect(4, 2, 12, 4, c('red', 2));
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) p.rect(5 + k * 3, 8 + r * 3, 2, 2, c('stone', 2));
    // one day circled
    p.ring(9.5, 12.5, 2.4, c('red', 2));
  } else if (kind === 'drawing') {
    // Nell's own drawing of the moon, in a frame
    p.rect(3, 3, 14, 13, c('wood', 2)).rect(4, 4, 12, 11, c('parch', 4));
    p.rect(4, 4, 12, 6, c('blue', 3)).disc(11, 7, 2.6, c('gold', 4)).set(6, 6, c('white', 4)).set(8, 8, c('white', 4));
    p.rect(4, 12, 12, 3, c('green', 3));
  } else if (kind === 'spoons') {
    p.rect(2, 3, 16, 1, c('steel', 1));
    // a ladle and a wooden spoon on hooks
    p.rect(6, 4, 1, 9, c('steel', 3)).disc(6, 14, 2.6, c('steel', 2)).rect(4, 12, 5, 1, c('steel', 4));
    p.rect(13, 4, 1, 9, c('wood', 3)).disc(13, 14, 2, c('wood', 2)).set(12, 13, c('wood', 4));
  } else if (kind === 'pan') {
    nail();
    p.rect(9, 2, 2, 7, c('ink', 2)).disc(10, 13, 5.5, c('steel', 0)).disc(10, 13, 4.2, c('steel', 1)).set(8, 11, c('steel', 3));
  } else if (kind === 'chart') {
    // a star chart pinned up: dots joined into a shape
    p.rect(3, 3, 14, 14, c('parch', 3)).rect(3, 3, 14, 1, c('parch', 4));
    const pts: [number, number][] = [
      [6, 7],
      [9, 6],
      [12, 9],
      [14, 13],
      [8, 13],
    ];
    pts.forEach(([x, y], i) => {
      const [nx, ny] = pts[(i + 1) % pts.length];
      p.line(x, y, nx, ny, c('blue', 2));
    });
    for (const [x, y] of pts) p.set(x, y, ink);
    p.set(10, 2, c('red', 2));
  } else if (kind === 'chalk') {
    // a little chalkboard of tomorrow's bakes: lines of chalk
    nail();
    p.rect(2, 3, 16, 13, c('wood', 1)).rect(3, 4, 14, 11, c('ink', 0));
    for (const [y, w] of [
      [6, 10],
      [9, 7],
      [12, 11],
    ])
      p.rect(5, y, w, 1, c('white', 2));
  } else if (kind === 'braid') {
    // a braid of onions hung on a nail
    nail();
    p.rect(10, 2, 1, 15, c('parch', 1));
    for (const [x, y] of [
      [8, 6],
      [12, 8],
      [8, 11],
      [12, 13],
      [10, 16],
    ])
      p.disc(x, y, 2.2, c('orange', 2)).set(x - 1, y - 1, c('orange', 4));
  } else {
    // a diagram of a lens bending light to a point
    p.rect(2, 4, 16, 12, c('white', 4)).rect(2, 4, 16, 1, c('stone', 2));
    p.rect(9, 6, 2, 8, c('glass', 2));
    for (const y of [7, 10, 13]) p.line(3, y, 9, y, c('red', 2)).line(10, y, 16, 10, c('red', 2));
  }
  return p;
}

/** The night sky up high: `deep` the darkest, `mid` dithered between; `star` puts a star in, `bright` lit up. */
export function skyHigh(pal: Pal, band: 'deep' | 'mid', star: number, bright = false): P {
  const s = pal.r('sky');
  const p = new Pixels(20, 20, s[0]);
  if (band === 'mid') gradient(p, 0, 0, 20, 20, s, 0, 1);
  const stars: [number, number][][] = [[], [[6, 8]], [[15, 4]], [[3, 15]]];
  for (const [x, y] of stars[star % 4]) {
    p.set(x, y, pal.c('white', bright ? 4 : 2));
    if (bright)
      p.set(x - 1, y, pal.c('white', 1))
        .set(x + 1, y, pal.c('white', 1))
        .set(x, y - 1, pal.c('white', 1))
        .set(x, y + 1, pal.c('white', 1));
  }
  return p;
}

/** The ground under the snowy yards (frozen earth, a stone now and then) or under the bakery (dark cellar boards). */
export function ground(pal: Pal, kind: 'earth' | 'stone' | 'boards' | 'cellar'): P {
  const d = pal.r('dirt');
  const k = pal.r('cab');
  if (kind === 'earth' || kind === 'stone') {
    const p = new Pixels(20, 20, d[0]);
    p.set(4, 6, d[1]).set(13, 14, d[1]).set(16, 3, d[1]);
    if (kind === 'stone') p.disc(9, 10, 4, pal.c('stone', 1)).disc(8, 9, 2.4, pal.c('stone', 2));
    return p;
  }
  const p = new Pixels(20, 20, k[0]);
  if (kind === 'boards') p.rect(0, 0, 20, 5, k[1]).rect(0, 0, 20, 1, k[2]).rect(0, 5, 20, 1, pal.c('ink', 0)).rect(12, 0, 1, 5, k[0]);
  else p.rect(9, 0, 2, 20, k[1]);
  return p;
}

/** Snow drifting down over the night: frame 0..2 moves the flakes down a few pixels each time. */
export function snowfall(pal: Pal, frame: number): P {
  const p = new Pixels(20, 20, pal.c('sky', 1));
  for (const [x, y] of [
    [4, 3],
    [13, 9],
    [8, 15],
  ])
    p.set((x + frame) % 20, (y + frame * 7) % 20, pal.c('white', 3));
  return p;
}
