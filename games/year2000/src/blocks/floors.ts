// Floors and grounds: each a function that paints a fresh 20x20 square, so items and
// decorations can be laid on top of the right ground.
import { Pixels, rng } from '../../../kit/pixels';
import { shadeAt, speckle } from '../art/draw';
import { C, PAL } from '../art/pal';

export type Painter = (seed?: number) => Pixels;

const R = PAL.r;

export const FLOORS: Record<string, Painter> = {
  /** Lawn mowed into stripes by the robot. */
  grass: (seed = 1) => {
    const p = new Pixels(20, 20);
    speckle(p, 0, 0, 20, 20, R('green'), 2, 1, seed, 0.3);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (Math.floor(x / 5) % 2 === 0 && (x + y) % 3 === 0) p.set(x, y, C('green', 3));
    const r = rng(seed + 9);
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(r() * 19);
      const y = Math.floor(r() * 18);
      p.set(x, y, C('green', 4)).set(x, y + 1, C('green', 3));
    }
    return p;
  },
  flowers: (seed = 3) => {
    const p = FLOORS.grass(seed);
    const r = rng(seed);
    for (let i = 0; i < 6; i++) {
      const x = 2 + Math.floor(r() * 16);
      const y = 2 + Math.floor(r() * 16);
      const c = [C('pink', 4), C('gold', 4), C('purple', 4)][i % 3];
      p.set(x, y, c)
        .set(x - 1, y, c)
        .set(x + 1, y, c)
        .set(x, y - 1, c)
        .set(x, y + 1, c)
        .set(x, y, C('gold', 5));
    }
    return p;
  },
  /** Moving-sidewalk-ready concrete, with chrome seams. */
  sidewalk: () => {
    const p = new Pixels(20, 20);
    speckle(p, 0, 0, 20, 20, R('concrete'), 3, 1, 5, 0.18);
    p.rect(0, 0, 20, 1, C('concrete', 1)).rect(0, 0, 1, 20, C('concrete', 1));
    p.rect(0, 10, 20, 1, C('concrete', 2)).rect(10, 0, 1, 20, C('concrete', 2));
    return p;
  },
  /** A hover-street: dark asphalt with a glowing teal center line. */
  road: () => {
    const p = new Pixels(20, 20);
    speckle(p, 0, 0, 20, 20, R('asphalt'), 1, 1, 7, 0.2);
    return p;
  },
  roadH: () => {
    const p = FLOORS.road();
    p.rect(2, 9, 7, 2, C('teal', 4)).rect(12, 9, 7, 2, C('teal', 4));
    p.rect(2, 9, 7, 1, C('teal', 5)).rect(12, 9, 7, 1, C('teal', 5));
    return p;
  },
  roadV: () => {
    const p = FLOORS.road();
    p.rect(9, 2, 2, 7, C('teal', 4)).rect(9, 12, 2, 7, C('teal', 4));
    return p;
  },
  /** The Skyway: riveted chrome deck plates. */
  deck: (seed = 11) => {
    const p = new Pixels(20, 20);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('chrome'), 3, 5, (x + y) / 38, x, y));
    p.rect(0, 0, 20, 1, C('chrome', 6)).rect(0, 0, 1, 20, C('chrome', 6)).rect(0, 19, 20, 1, C('chrome', 2)).rect(19, 0, 1, 20, C('chrome', 2));
    for (const [x, y] of [
      [3, 3],
      [16, 3],
      [3, 16],
      [16, 16],
    ])
      p.set(x, y, C('chrome', 7)).set(x + 1, y + 1, C('chrome', 1));
    if (seed % 2) for (let i = 6; i < 14; i += 2) p.rect(6, i, 8, 1, C('chrome', 2));
    return p;
  },
  /** A hover lane on the Skyway: a dark glowing strip. */
  lane: () => {
    const p = new Pixels(20, 20);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('purple'), 0, 1, 0.3 + 0.7 * (1 - Math.abs(y - 9.5) / 10), x, y));
    const r = rng(13);
    for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 18), C('purple', 3));
    p.rect(2, 19, 6, 1, C('chrome', 3)).rect(12, 19, 6, 1, C('chrome', 3));
    return p;
  },
  laneLine: () => {
    const p = FLOORS.lane();
    p.rect(0, 0, 20, 1, C('pink', 3)).rect(3, 0, 6, 1, C('pink', 5)).rect(13, 0, 4, 1, C('pink', 5));
    return p;
  },
  /** Mall floor: big pale pink tiles with teal grout (calm enough for the shoppers to stand out). */
  tile: () => {
    const p = new Pixels(20, 20, C('pink', 5));
    p.rect(0, 0, 20, 1, C('teal', 4)).rect(0, 0, 1, 20, C('teal', 4));
    p.set(1, 1, C('grey', 7)).set(10, 10, C('grey', 7));
    return p;
  },
  /** Arcade carpet: the black carpet with neon squiggles every arcade had. */
  carpet: (seed = 21) => {
    const p = new Pixels(20, 20, C('night', 1));
    const r = rng(seed);
    const cols = [C('pink', 3), C('teal', 4), C('gold', 4), C('purple', 4), C('neon', 2)];
    for (let i = 0; i < 6; i++) {
      let x = Math.floor(r() * 20);
      let y = Math.floor(r() * 20);
      const c = cols[i % cols.length];
      const kind = i % 3;
      for (let k = 0; k < 5; k++) {
        p.set(x, y, c);
        if (kind === 0) x++;
        else if (kind === 1) {
          x++;
          y += k % 2 ? 1 : -1;
        } else y++;
        x = (x + 20) % 20;
        y = (y + 20) % 20;
      }
    }
    return p;
  },
  /** The phone company: polished marble. */
  marble: (seed = 31) => {
    const p = new Pixels(20, 20);
    speckle(p, 0, 0, 20, 20, R('paper'), 1, 1, seed, 0.15);
    const r = rng(seed);
    let x = r() * 20;
    for (let y = 0; y < 20; y++) {
      x += r() * 2 - 1;
      p.set(x, y, C('concrete', 3));
    }
    p.rect(0, 0, 20, 1, C('concrete', 3)).rect(0, 0, 1, 20, C('concrete', 3));
    return p;
  },
  beach: (seed = 41) => {
    const p = new Pixels(20, 20);
    speckle(p, 0, 0, 20, 20, R('gold'), 4, 1, seed, 0.3);
    return p;
  },
  shag: (seed = 45) => {
    const p = new Pixels(20, 20);
    speckle(p, 0, 0, 20, 20, R('orange'), 2, 1, seed, 0.5);
    return p;
  },
  /** Inside the TV: the snow you get between channels, turned down so the static ghosts show. */
  static: (seed = 51) => {
    const p = new Pixels(20, 20);
    const r = rng(seed);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, C('grey', 1 + Math.floor(r() * 3)));
    return p;
  },
  seafloor: (seed = 61) => {
    const p = new Pixels(20, 20);
    speckle(p, 0, 0, 20, 20, R('teal'), 1, 1, seed, 0.3);
    for (let y = 0; y < 20; y += 5) for (let x = 0; x < 20; x++) if (Math.sin(x / 2 + y) > 0.7) p.set(x, y, C('teal', 3));
    return p;
  },
  jungle: (seed = 71) => {
    const p = new Pixels(20, 20);
    speckle(p, 0, 0, 20, 20, R('green'), 1, 1, seed, 0.35);
    return p;
  },
  concrete: (seed = 81) => {
    const p = new Pixels(20, 20);
    speckle(p, 0, 0, 20, 20, R('concrete'), 2, 1, seed, 0.25);
    for (const [x, y] of [
      [4, 7],
      [14, 15],
    ])
      p.set(x, y, C('concrete', 0));
    return p;
  },
  /** Moon dust: fine grey with boot prints and pebbles. */
  moon: (seed = 91) => {
    const p = new Pixels(20, 20);
    speckle(p, 0, 0, 20, 20, R('moon'), 3, 1, seed, 0.3);
    const r = rng(seed);
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(r() * 18);
      const y = Math.floor(r() * 18);
      p.set(x, y, C('moon', 5)).set(x + 1, y + 1, C('moon', 1));
    }
    return p;
  },
  moonprint: (seed = 93) => {
    const p = FLOORS.moon(seed);
    for (const [x, y] of [
      [5, 3],
      [12, 11],
    ])
      p.rect(x, y, 3, 5, C('moon', 2))
        .rect(x, y + 1, 3, 1, C('moon', 1))
        .rect(x, y + 3, 3, 1, C('moon', 1));
    return p;
  },
  /** The Moon School gym: varnished boards. */
  gym: (seed = 101) => {
    const p = new Pixels(20, 20);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) p.set(x, y, y % 5 === 0 ? C('wood', 2) : (x * 7 + Math.floor(y / 5) * 13) % 23 === 0 ? C('wood', 2) : C('wood', 3));
    void seed;
    return p;
  },
  gymLine: () => {
    const p = FLOORS.gym();
    p.rect(0, 9, 20, 2, C('red', 3));
    return p;
  },
  metal: () => {
    const p = new Pixels(20, 20);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, (x + y) % 4 === 0 ? C('chrome', 2) : C('chrome', 3));
    p.rect(0, 0, 20, 1, C('chrome', 4)).rect(0, 0, 1, 20, C('chrome', 4));
    return p;
  },
};
