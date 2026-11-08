// Dressing a room after its plan is painted (place.ts): what lies under the floor, a few things hung on the walls,
// cupboard fronts of mixed kinds, shadows under shelves, and the deep night sky over the roof with its twinkling
// stars. Dressing only ever replaces plain backdrop, plain wall and the solid ground below the floor, so nothing on
// Nell's way changes; a picked variant comes from a hash of its spot, so a wall never shows one stamp repeated and
// two builds come out the same. addDress puts the pictures in a place's block set; dressRoom paints them.
import { ORIGIN } from '../../kit/starter/map';
import type { Book } from '../../kit/starter/book';
import { SOLID, type Rules } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import type { Place as PlaceName } from './art';
import {
  cupboardFront,
  door,
  drawer,
  facade,
  glassCupboard,
  ground,
  snowfall,
  joists,
  kitchenLow,
  oven,
  skyHigh,
  underShelf,
  wainscot,
  wallProp,
  type WallProp,
} from './dressArt';
import { G, type Place } from './place';
import type { Timed } from './level';

/** Ticks a twinkling star stays dim, then bright. */
export const TWINKLE = { dim: 90, bright: 26 } as const;

/** The things hung on each place's walls. */
const PROPS: Partial<Record<PlaceName, WallProp[]>> = {
  cupboard: ['clock', 'calendar', 'drawing', 'spoons', 'pan'],
  lens: ['diagram', 'clock'],
  loft: ['chart', 'drawing'],
  bakery: ['chalk', 'braid', 'clock'],
};

/** Ticks a frame of falling snow lasts. */
export const SNOW_TICKS = 14;

/**
 * Adds a place's dressing pictures to its block set (after the backdrop `bg` and the wall). `air` is the rule the place's backdrop has (the pantry's still air lets the ring roll up through it).
 */
export function addDress(book: Book, pal: Pal, place: PlaceName, timed: Timed[], air: Rules): void {
  const bg = book.pics.get('bg')!;
  if (place === 'yard' || place === 'bakery') {
    if (place === 'bakery') book.add('shade', underShelf(pal, bg), air);
  } else if (place !== 'roof') {
    book.add('wall1', cupboardFront(pal, 1), { solid: SOLID });
    book.add('wall2', cupboardFront(pal, 2), { solid: SOLID });
    book.add('shade', underShelf(pal, bg), air);
  }
  for (const k of PROPS[place] ?? []) book.add(`prop.${k}`, wallProp(pal, bg, k), air);
  if (place === 'cupboard') {
    book.add('ceil1', glassCupboard(pal), { solid: SOLID });
    book.add('ceil2', cupboardFront(pal, 1), { solid: SOLID });
    book.add('drawL', drawer(pal, 0), { solid: SOLID });
    book.add('drawR', drawer(pal, 1), { solid: SOLID });
    book.add('doorL0', door(pal, 0, 'left'), { solid: SOLID });
    book.add('doorL1', door(pal, 1, 'left'), { solid: SOLID });
    book.add('doorR0', door(pal, 0, 'right'), { solid: SOLID });
    book.add('doorR1', door(pal, 1, 'right'), { solid: SOLID });
    for (const q of [0, 1, 2, 3] as const) book.add(`oven${q}`, oven(pal, q), { solid: SOLID });
    book.add('kick', kitchenLow(pal, 'kick'), { solid: SOLID });
    book.add('kfloor', kitchenLow(pal, 'floor'), { solid: SOLID });
  } else if (place === 'lens') {
    book.add('wains', wainscot(pal, 'tile'), { solid: SOLID });
    book.add('wbase', wainscot(pal, 'base'), { solid: SOLID });
  } else if (place === 'loft') {
    book.add('joist', joists(pal, 'beam'), { solid: SOLID });
    book.add('jgap', joists(pal, 'gap'), { solid: SOLID });
    book.add('jdark', joists(pal, 'dark'), { solid: SOLID });
  } else if (place === 'yard') {
    for (const k of ['earth', 'stone'] as const) book.add(k, ground(pal, k), { solid: SOLID });
    for (const f of [0, 1, 2]) book.add(`snow${f}`, snowfall(pal, f), air);
    timed.push(
      { name: 'snow0', next: 'snow1', ticks: SNOW_TICKS },
      { name: 'snow1', next: 'snow2', ticks: SNOW_TICKS },
      { name: 'snow2', next: 'snow0', ticks: SNOW_TICKS },
    );
  } else if (place === 'bakery') {
    for (const k of ['boards', 'cellar'] as const) book.add(`cel.${k}`, ground(pal, k), { solid: SOLID });
    book.add('cel.dark', joists(pal, 'dark'), { solid: SOLID });
  }
  if (place === 'roof' || place === 'yard') {
    for (const s of [0, 1, 2, 3]) book.add(`deep${s}`, skyHigh(pal, 'deep', s), air);
    book.add('deep2b', skyHigh(pal, 'deep', 2, true), air);
    book.add('deepMid', skyHigh(pal, 'mid', 0), air);
    timed.push({ name: 'deep2', next: 'deep2b', ticks: TWINKLE.dim }, { name: 'deep2b', next: 'deep2', ticks: TWINKLE.bright });
  }
  if (place === 'roof') for (const k of ['cornice', 'brick', 'lit', 'dark'] as const) book.add(`fac.${k}`, facade(pal, k), { solid: SOLID });
}

/** A spot's hash: the same spot always picks the same variant. */
export function spotHash(x: number, y: number, salt = 0): number {
  let h = (Math.imul(x + 131, 374761393) + Math.imul(y + 71, 668265263) + Math.imul(salt, 2246822519)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Mixes the kinds of cupboard front on the plain walls in a rectangle (when the place has them). */
export function varyWalls(m: Place, x0: number, x1: number, y0: number, y1: number): void {
  const b = m.book;
  if (!b.pics.has('wall1')) return;
  const wall = b.n('wall');
  for (let y = Math.max(-ORIGIN, y0); y <= Math.min(y1, 100 - ORIGIN - 1); y++)
    for (let x = Math.max(-ORIGIN, x0); x <= Math.min(x1, 100 - ORIGIN - 1); x++)
      if (m.get(x, y) === wall) m.set(x, y, ['wall', 'wall1', 'wall2'][spotHash(x, y) % 3]);
}

/** Shades the plain backdrop just below any of `casters` (a shelf, a cupboard front) in a rectangle. */
export function castShadows(m: Place, casters: string[], x0: number, x1: number, y0: number, y1: number): void {
  const b = m.book;
  if (!b.pics.has('shade')) return;
  const from = new Set(casters.filter((n) => b.pics.has(n)).map((n) => b.n(n)));
  const plain = new Set(['bg', 'bg1', 'bg2', 'bg3'].map((n) => b.n(n)));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (from.has(m.get(x, y - 1)) && plain.has(m.get(x, y))) m.set(x, y, 'shade');
}

/** Dresses a room painted from a plan, `w` blocks wide. */
export function dressRoom(m: Place, place: PlaceName, w: number): void {
  const b = m.book;
  const plain = new Set(['bg', 'bg1', 'bg2', 'bg3'].map((n) => b.n(n)));
  const isPlain = (x: number, y: number) => plain.has(m.get(x, y));
  const x0 = -ORIGIN;
  const x1 = Math.min(w + 12, 100 - ORIGIN) - 1;
  const bottom = 100 - ORIGIN - 1;
  const ground = b.n('base');
  /** Paints the ground below the floor, leaving a pit's cushion and anything else that is not plain ground. */
  const under = (x: number, y: number, name: string) => {
    if (m.get(x, y) === ground) m.set(x, y, name);
  };

  // walls: cupboard fronts of three kinds (never on the roof, whose walls are chimneys)
  varyWalls(m, x0, x1, -ORIGIN, G);

  // shadows under the shelves
  castShadows(m, ['shelf', 'tilt0'], 1, w - 2, 1, G - 1);

  // things hung on the wall: far from shelves, ladders and signs, now and then
  const props = PROPS[place] ?? [];
  if (props.length) {
    let last = -9;
    for (let x = 4; x < w - 4; x++) {
      if (x - last < 6 || spotHash(x, 0, 7) % 3) continue;
      const y = 3 + (spotHash(x, 1, 7) % 3);
      let clear = true;
      for (let dy = -1; dy <= 3 && clear; dy++) for (let dx = -1; dx <= 1 && clear; dx++) clear = isPlain(x + dx, y + dy);
      if (!clear) continue;
      m.set(x, y, `prop.${props[spotHash(x, y, 3) % props.length]}`);
      last = x;
    }
  }

  // under the floor
  if (place === 'cupboard') {
    // the ceiling: upper cupboards in pairs, now and then a glass-fronted pair
    for (let x = 1; x < w - 1; x++) {
      const u = Math.floor((x + ORIGIN) / 2);
      if (m.get(x, 0) !== b.n('ceil')) continue;
      m.set(x, 0, spotHash(u, 0, 5) % 4 === 0 ? 'ceil1' : x % 2 ? 'ceil2' : 'ceil');
    }
    let lastOven = -99;
    for (let x = x0; x <= x1; x++) {
      const u = Math.floor((x + ORIGIN) / 2);
      const left = (x + ORIGIN) % 2 === 0;
      const isOven = u - lastOven > 6 && spotHash(u, 0, 11) % 6 === 0 && x > 4;
      if (isOven && left) lastOven = u;
      const ovenHere = u === lastOven;
      under(x, G + 1, left ? 'drawL' : 'drawR');
      if (ovenHere) {
        under(x, G + 2, `oven${left ? 0 : 1}`);
        under(x, G + 3, `oven${left ? 2 : 3}`);
      } else {
        under(x, G + 2, left ? 'doorL0' : 'doorR0');
        under(x, G + 3, left ? 'doorL1' : 'doorR1');
      }
      under(x, G + 4, 'kick');
      for (let y = G + 5; y <= bottom; y++) under(x, y, 'kfloor');
    }
  } else if (place === 'lens') {
    for (let x = x0; x <= x1; x++) {
      for (let y = G + 1; y <= G + 3; y++) under(x, y, 'wains');
      for (let y = G + 4; y <= bottom; y++) under(x, y, 'wbase');
    }
  } else if (place === 'loft') {
    for (let x = x0; x <= x1; x++) for (let y = G + 1; y <= bottom; y++) under(x, y, (x + ORIGIN) % 4 === 0 ? 'joist' : y === G + 1 ? 'jgap' : 'jdark');
  } else if (place === 'roof') {
    for (let x = x0; x <= x1; x++) {
      under(x, G + 1, 'fac.cornice');
      for (let y = G + 2; y <= bottom; y++) {
        const win = (x + ORIGIN) % 4 === 1 && (y - G) % 3 === 0;
        under(x, y, win ? (spotHash(x, y, 2) % 3 ? 'fac.lit' : 'fac.dark') : 'fac.brick');
      }
    }
  } else if (place === 'yard') {
    for (let x = x0; x <= x1; x++) for (let y = G + 1; y <= bottom; y++) under(x, y, spotHash(x, y, 9) % 9 ? 'earth' : 'stone');
    // snow falling here and there in front of the night
    for (let y = 2; y < G; y++) for (let x = 1; x < w - 1; x++) if (isPlain(x, y) && spotHash(x, y, 13) % 7 === 0) m.set(x, y, 'snow0');
  } else if (place === 'bakery') {
    for (let x = x0; x <= x1; x++) {
      under(x, G + 1, 'cel.boards');
      for (let y = G + 2; y <= bottom; y++) under(x, y, (x + ORIGIN) % 5 === 0 ? 'cel.cellar' : 'cel.dark');
    }
  }
  if (place === 'roof' || place === 'yard') {
    // the sky deepens up high, with a scatter of stars (one in four of them twinkles)
    for (let y = -ORIGIN; y <= 1; y++)
      for (let x = x0; x <= x1; x++) {
        if (!isPlain(x, y)) continue;
        if (y === 1) m.set(x, y, 'deepMid');
        else m.set(x, y, `deep${spotHash(x, y, 4) % 4}`);
      }
  }
}
