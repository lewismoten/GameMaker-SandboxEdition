// The halls of the five later graduations (the first one is the default hall): a gym, a castle hall, a theater, a
// lab and a gallery. Each overrides the floor, the stage, the ceiling strip, the drape colors and hangs two or three
// wall pieces above the balcony. Drawn with the Starters' shared ramps only, so the palette gains nothing.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from './palette';
import type { HallTheme } from './graduationTheme';

const wall = (pal: Pal): Pixels => new Pixels(20, 20, skyOf(pal));

/** Moving and Pushing: a school gym, with a court to walk on, a hoop and a ball on the wall. */
export const GYM: HallTheme = {
  drape: 'blue',
  rail: 'blue',
  floor: (pal) => {
    const { c } = pal;
    const p = new Pixels(20, 20, c('wood', 3));
    for (const x of [4, 9, 14, 19]) p.rect(x, 0, 1, 20, c('wood', 2));
    p.rect(0, 0, 20, 10, c('wood', 4)).rect(0, 0, 20, 1, c('white', 3)).rect(0, 9, 20, 1, c('wood', 2));
    p.rect(0, 1, 20, 3, c('blue', 3)).rect(0, 4, 20, 1, c('white', 3));
    for (const x of [4, 9, 14, 19]) p.rect(x, 5, 1, 4, c('wood', 3));
    return p;
  },
  stage: (pal) => {
    const { c } = pal;
    const p = new Pixels(20, 20, c('blue', 2));
    p.rect(0, 0, 20, 4, c('wood', 4)).rect(0, 3, 20, 1, c('wood', 3)).rect(0, 4, 20, 2, c('white', 3));
    p.rect(0, 6, 20, 1, c('blue', 1)).rect(0, 12, 20, 1, c('blue', 1)).rect(0, 18, 20, 2, c('blue', 1));
    p.rect(2, 8, 16, 2, c('blue', 3));
    return p;
  },
  valance: (pal) => {
    const { c } = pal;
    const p = wall(pal);
    p.rect(0, 0, 20, 12, c('blue', 2)).rect(0, 0, 20, 2, c('blue', 3)).rect(0, 5, 20, 2, c('white', 3));
    for (let x = 0; x < 20; x += 5) p.rect(x, 2, 1, 3, c('blue', 1)).rect(x, 7, 1, 5, c('blue', 1));
    p.rect(0, 12, 20, 2, c('blue', 1));
    return p;
  },
  bunting: (pal) => [pal.c('red', 2), pal.c('white', 3), pal.c('blue', 3), pal.c('orange', 3)],
  decor: {
    hoop: (pal) => {
      const { c } = pal;
      const p = wall(pal);
      p.rect(2, 1, 16, 10, c('white', 3)).frame(2, 1, 16, 10, c('stone', 2)).frame(6, 4, 8, 5, c('red', 2));
      p.rect(7, 11, 6, 1, c('orange', 2)).rect(7, 11, 6, 1, c('orange', 3));
      for (let k = 0; k < 6; k++) p.line(7 + k, 12, 8 + (k % 3), 17, c('white', 2));
      p.rect(8, 17, 4, 1, c('white', 1));
      return p;
    },
    ball: (pal) => {
      const { c } = pal;
      const p = wall(pal);
      p.rect(9, 1, 2, 4, c('ink', 1));
      p.disc(10, 11, 7, c('orange', 3)).ring(10, 11, 7, c('orange', 1));
      p.line(3, 11, 17, 11, c('orange', 1)).line(10, 4, 10, 18, c('orange', 1));
      p.disc(7, 8, 2, c('orange', 4));
      return p;
    },
  },
  decorOrder: ['hoop', 'ball'],
};

/** Heroes and Foes: a castle hall: flagstones and a red runner, battlements, arched windows and shields. */
export const CASTLE: HallTheme = {
  drape: 'brick',
  rail: 'stone',
  floor: (pal) => {
    const { c } = pal;
    const p = new Pixels(20, 20, c('stone', 2));
    p.rect(0, 10, 20, 1, c('stone', 1)).rect(0, 19, 20, 1, c('stone', 1)).rect(9, 11, 1, 8, c('stone', 1)).rect(4, 0, 1, 10, c('stone', 1)).rect(14, 0, 1, 10, c('stone', 1));
    p.rect(0, 0, 20, 10, c('red', 2)).rect(0, 0, 20, 1, c('red', 4)).rect(0, 9, 20, 1, c('red', 0));
    p.rect(0, 1, 20, 1, c('gold', 3)).rect(0, 7, 20, 1, c('gold', 3));
    for (const x of [3, 9, 15]) p.rect(x, 3, 2, 3, c('red', 3));
    p.rect(0, 11, 20, 1, c('stone', 3));
    return p;
  },
  stage: (pal) => {
    const { c } = pal;
    const p = new Pixels(20, 20, c('stone', 3));
    p.rect(0, 0, 20, 4, c('stone', 4)).rect(0, 4, 20, 1, c('gold', 2)).rect(0, 5, 20, 1, c('gold', 4));
    p.rect(0, 11, 20, 1, c('stone', 1)).rect(0, 17, 20, 1, c('stone', 1)).rect(9, 6, 1, 5, c('stone', 1)).rect(4, 12, 1, 5, c('stone', 1)).rect(14, 12, 1, 5, c('stone', 1));
    return p;
  },
  subfloor: (pal) => {
    const { c } = pal;
    const p = new Pixels(20, 20, c('stone', 1));
    p.rect(0, 6, 20, 1, c('stone', 0)).rect(0, 13, 20, 1, c('stone', 0)).rect(10, 0, 1, 6, c('stone', 0)).rect(4, 7, 1, 6, c('stone', 0)).rect(15, 14, 1, 6, c('stone', 0));
    return p;
  },
  valance: (pal) => {
    const { c } = pal;
    const p = wall(pal);
    p.rect(0, 6, 20, 8, c('stone', 2)).rect(0, 6, 20, 1, c('stone', 4)).rect(0, 13, 20, 1, c('stone', 1));
    for (const x of [0, 10]) p.rect(x, 1, 6, 5, c('stone', 2)).rect(x, 1, 6, 1, c('stone', 4)).rect(x + 5, 1, 1, 5, c('stone', 1));
    p.rect(8, 8, 1, 5, c('stone', 1));
    return p;
  },
  bunting: (pal) => [pal.c('green', 2), pal.c('gold', 4), pal.c('red', 2), pal.c('white', 3)],
  decor: {
    window: (pal) => {
      const { c } = pal;
      const p = wall(pal);
      p.rect(3, 1, 14, 18, c('stone', 3));
      p.rect(5, 6, 10, 13, c('blue', 0)).disc(10, 6, 5, c('blue', 0)).rect(5, 12, 10, 7, c('blue', 1));
      p.rect(7, 4, 6, 1, c('blue', 2)).rect(6, 8, 8, 1, c('blue', 1));
      p.frame(3, 1, 14, 18, c('stone', 1)).rect(3, 18, 14, 2, c('stone', 4));
      p.set(15, 5, c('white', 3)).set(14, 4, c('white', 3));
      return p;
    },
    shield: (pal) => {
      const { c } = pal;
      const p = wall(pal);
      for (let y = 0; y < 16; y++) {
        const half = y < 10 ? 7 : 7 - Math.floor((y - 10) * 1.2);
        p.rect(10 - half, 2 + y, half * 2, 1, y % 16 < 8 ? c('gold', 3) : c('red', 2));
      }
      p.rect(3, 2, 14, 2, c('gold', 4));
      for (let y = 0; y < 16; y++) {
        const half = y < 10 ? 7 : 7 - Math.floor((y - 10) * 1.2);
        p.set(10 - half, 2 + y, c('ink', 1)).set(9 + half, 2 + y, c('ink', 1));
      }
      p.rect(3, 2, 14, 1, c('ink', 1));
      // a diagonal band and a star: no cross
      for (let k = 0; k < 14; k++) p.rect(3 + k, 6 + Math.floor(k * 0.6), 3, 1, c('white', 3));
      p.set(10, 15, c('gold', 4)).set(9, 16, c('gold', 4)).set(11, 16, c('gold', 4));
      return p;
    },
  },
  decorOrder: ['window', 'shield', 'window'],
};

/** Story and Finish: a theater: boards, red velvet, spotlights and gold stars. */
export const THEATER: HallTheme = {
  drape: 'red',
  rail: 'red',
  floor: (pal) => {
    const { c } = pal;
    const p = new Pixels(20, 20, c('wood', 1));
    p.rect(0, 0, 20, 20, c('wood', 1)).rect(0, 6, 20, 1, c('wood', 0)).rect(0, 13, 20, 1, c('wood', 0)).rect(7, 0, 1, 6, c('wood', 0)).rect(3, 7, 1, 6, c('wood', 0)).rect(15, 14, 1, 6, c('wood', 0));
    p.rect(3, 0, 14, 20, c('red', 2)).rect(3, 0, 1, 20, c('gold', 3)).rect(16, 0, 1, 20, c('gold', 3));
    for (const y of [4, 12]) p.rect(8, y, 4, 2, c('red', 3));
    p.rect(0, 0, 20, 1, c('wood', 3));
    return p;
  },
  stage: (pal) => {
    const { c } = pal;
    const p = new Pixels(20, 20, c('wood', 2));
    p.rect(0, 0, 20, 4, c('wood', 3)).rect(0, 3, 20, 1, c('wood', 2)).rect(0, 4, 20, 1, c('gold', 2)).rect(0, 5, 20, 1, c('gold', 4));
    for (let x = 2; x < 20; x += 6) p.rect(x, 7, 2, 2, c('white', 3));
    p.rect(0, 11, 20, 1, c('wood', 1)).rect(0, 17, 20, 1, c('wood', 1)).rect(9, 12, 1, 5, c('wood', 1));
    return p;
  },
  bunting: (pal) => [pal.c('gold', 4), pal.c('white', 3), pal.c('gold', 3), pal.c('red', 3)],
  decor: {
    spot: (pal) => {
      const { c } = pal;
      const p = wall(pal);
      p.rect(7, 1, 6, 5, c('ink', 1)).rect(6, 6, 8, 3, c('ink', 2)).rect(8, 0, 4, 1, c('stone', 3));
      for (let y = 0; y < 10; y++) p.rect(7 - Math.floor(y * 0.7), 9 + y, 6 + Math.floor(y * 1.4), 1, y % 2 ? c('white', 2) : c('white', 3));
      return p;
    },
    star: (pal) => {
      const { c } = pal;
      const p = wall(pal);
      p.disc(10, 10, 8, c('red', 2)).ring(10, 10, 8, c('gold', 3)).ring(10, 10, 7, c('gold', 4));
      p.draw(5, 5, ['.....#.....', '....###....', '...#####...', '###########', '.#########.', '..#######..', '..#######..', '.####.####.', '.###...###.', '.#.......#.'], { '#': c('gold', 5) });
      return p;
    },
  },
  decorOrder: ['spot', 'star'],
};

/** Wiring and Worlds: a lab: tiles, steel and teal panels, a monitor, flasks and circuit boards. */
export const LAB: HallTheme = {
  drape: 'teal',
  rail: 'stone',
  floor: (pal) => {
    const { c } = pal;
    const p = new Pixels(20, 20, c('white', 2));
    p.rect(0, 0, 10, 10, c('teal', 3)).rect(10, 10, 10, 10, c('teal', 3));
    p.rect(0, 0, 20, 1, c('white', 3)).rect(0, 10, 20, 1, c('white', 3)).rect(0, 19, 20, 1, c('white', 1));
    p.rect(2, 3, 6, 4, c('teal', 4)).rect(12, 13, 6, 4, c('teal', 4));
    return p;
  },
  stage: (pal) => {
    const { c } = pal;
    const p = new Pixels(20, 20, c('stone', 3));
    p.rect(0, 0, 20, 4, c('stone', 4)).rect(0, 4, 20, 2, c('teal', 3)).rect(0, 6, 20, 1, c('teal', 1));
    for (const x of [2, 17]) p.set(x, 2, c('stone', 1)).set(x, 10, c('stone', 1)).set(x, 16, c('stone', 1));
    p.rect(0, 12, 20, 1, c('stone', 1)).rect(9, 7, 2, 5, c('stone', 2));
    return p;
  },
  subfloor: (pal) => {
    const { c } = pal;
    const p = new Pixels(20, 20, c('stone', 1));
    p.rect(0, 3, 20, 3, c('stone', 2)).rect(0, 3, 20, 1, c('stone', 3)).rect(0, 12, 20, 3, c('teal', 1)).rect(0, 12, 20, 1, c('teal', 2));
    p.rect(5, 0, 1, 20, c('stone', 0)).rect(14, 0, 1, 20, c('stone', 0));
    return p;
  },
  valance: (pal) => {
    const { c } = pal;
    const p = wall(pal);
    p.rect(0, 0, 20, 4, c('stone', 2)).rect(0, 4, 20, 1, c('stone', 1));
    for (const x of [1, 11]) p.rect(x, 6, 8, 3, c('white', 3)).frame(x, 6, 8, 3, c('stone', 2));
    p.line(0, 12, 6, 14, c('ink', 1)).line(6, 14, 13, 11, c('ink', 1)).line(13, 11, 19, 13, c('ink', 1));
    return p;
  },
  bunting: (pal) => [pal.c('teal', 3), pal.c('white', 3), pal.c('green', 3), pal.c('gold', 3)],
  decor: {
    monitor: (pal) => {
      const { c } = pal;
      const p = wall(pal);
      p.rect(2, 2, 16, 12, c('stone', 2)).frame(2, 2, 16, 12, c('stone', 0)).rect(4, 4, 12, 8, c('ink', 0));
      p.line(4, 8, 7, 8, c('green', 3)).line(7, 8, 8, 5, c('green', 3)).line(8, 5, 10, 11, c('green', 3)).line(10, 11, 11, 8, c('green', 3)).line(11, 8, 15, 8, c('green', 3));
      p.rect(8, 14, 4, 2, c('stone', 1)).rect(5, 16, 10, 2, c('stone', 2));
      return p;
    },
    beaker: (pal) => {
      const { c } = pal;
      const p = wall(pal);
      p.rect(0, 15, 20, 3, c('wood', 2)).rect(0, 15, 20, 1, c('wood', 4));
      p.rect(7, 3, 6, 5, c('white', 2)).frame(7, 3, 6, 5, c('stone', 1));
      for (let y = 0; y < 7; y++) p.rect(7 - Math.floor(y / 1.5), 8 + y, 6 + Math.floor(y / 1.5) * 2, 1, c('white', 2));
      p.rect(5, 12, 10, 3, c('green', 3)).rect(4, 13, 12, 2, c('green', 2)).rect(6, 11, 8, 1, c('green', 3));
      p.set(9, 9, c('white', 3)).set(11, 10, c('white', 3));
      p.rect(7, 1, 6, 2, c('wood', 3));
      return p;
    },
    circuit: (pal) => {
      const { c } = pal;
      const p = wall(pal);
      p.rect(2, 2, 16, 14, c('green', 1)).frame(2, 2, 16, 14, c('green', 0));
      p.line(4, 5, 10, 5, c('gold', 3)).line(10, 5, 10, 12, c('gold', 3)).line(10, 12, 15, 12, c('gold', 3)).line(4, 9, 7, 9, c('gold', 3)).line(13, 4, 13, 8, c('gold', 3));
      p.rect(5, 11, 4, 3, c('ink', 0)).rect(12, 9, 4, 2, c('ink', 0));
      p.set(4, 5, c('red', 3)).set(13, 4, c('green', 4)).set(15, 12, c('gold', 5));
      return p;
    },
  },
  decorOrder: ['monitor', 'beaker', 'circuit'],
};

/** Blocks and Showcase: an art gallery: parquet, white plinth, track lights and three paintings. */
export const GALLERY: HallTheme = {
  drape: 'green',
  rail: 'stone',
  floor: (pal) => {
    const { c } = pal;
    const p = new Pixels(20, 20, c('wood', 4));
    for (let k = 0; k < 20; k += 5) {
      p.rect(0, k, 20, 1, c('wood', 3));
      for (let x = (k / 5) % 2 ? 0 : 5; x < 20; x += 10) p.rect(x, k, 1, 5, c('wood', 3));
    }
    p.rect(0, 0, 20, 2, c('wood', 3)).rect(0, 2, 20, 1, c('wood', 4));
    return p;
  },
  stage: (pal) => {
    const { c } = pal;
    const p = new Pixels(20, 20, c('white', 2));
    p.rect(0, 0, 20, 4, c('white', 3)).rect(0, 4, 20, 1, c('gold', 2)).rect(0, 5, 20, 1, c('gold', 4));
    p.rect(0, 11, 20, 1, c('stone', 4)).rect(0, 17, 20, 1, c('stone', 4)).rect(9, 6, 1, 5, c('stone', 4)).rect(4, 12, 1, 5, c('stone', 4)).rect(14, 12, 1, 5, c('stone', 4));
    return p;
  },
  subfloor: (pal) => {
    const { c } = pal;
    const p = new Pixels(20, 20, c('wood', 2));
    p.rect(0, 6, 20, 1, c('wood', 1)).rect(0, 13, 20, 1, c('wood', 1)).rect(10, 0, 1, 6, c('wood', 1)).rect(4, 7, 1, 6, c('wood', 1)).rect(15, 14, 1, 6, c('wood', 1));
    return p;
  },
  valance: (pal) => {
    const { c } = pal;
    const p = wall(pal);
    p.rect(0, 0, 20, 3, c('stone', 1)).rect(0, 3, 20, 1, c('stone', 0));
    for (const x of [3, 13]) {
      p.rect(x + 1, 4, 3, 3, c('ink', 1));
      for (let y = 0; y < 5; y++) p.rect(x - y, 7 + y, 5 + y * 2, 1, c('white', y % 2 ? 2 : 3));
    }
    return p;
  },
  bunting: (pal) => [pal.c('pink', 2), pal.c('sky', 5), pal.c('gold', 4), pal.c('green', 3)],
  decor: {
    hills: (pal) => {
      const { c } = pal;
      const p = wall(pal);
      p.rect(2, 2, 16, 15, c('gold', 3)).rect(3, 3, 14, 13, c('sky', 4));
      p.disc(13, 7, 2, c('gold', 5)).disc(6, 17, 7, c('green', 2)).disc(15, 18, 7, c('green', 3));
      p.rect(3, 16, 14, 1, c('green', 2)).frame(2, 2, 16, 15, c('gold', 1));
      return p;
    },
    shapes: (pal) => {
      const { c } = pal;
      const p = wall(pal);
      p.rect(2, 2, 16, 15, c('gold', 3)).rect(3, 3, 14, 13, c('white', 3)).frame(2, 2, 16, 15, c('gold', 1));
      p.rect(5, 5, 5, 5, c('red', 2)).rect(9, 9, 6, 5, c('blue', 3)).disc(13, 6, 2, c('gold', 4)).rect(5, 12, 3, 2, c('green', 3));
      return p;
    },
    night: (pal) => {
      const { c } = pal;
      const p = wall(pal);
      p.rect(2, 2, 16, 15, c('gold', 3)).rect(3, 3, 14, 13, c('blue', 0)).frame(2, 2, 16, 15, c('gold', 1));
      for (const [x, y] of [[6, 6], [12, 5], [9, 10], [14, 12], [5, 13]]) p.set(x, y, c('gold', 5)).set(x + 1, y, c('gold', 4));
      p.disc(13, 9, 2, c('white', 3));
      return p;
    },
  },
  decorOrder: ['hills', 'shapes', 'night'],
};
