// The felt egg: shiny teal felt with silver wave stitches, a red felt rocket with an orange
// yarn flame, and a band of chrome sequins around the middle. It is a Pick-up block (G), so
// it rides along in Dex's pockets (the inventory) and into the saved game. Every block set
// keeps it at the same number, EGG_BLOCK, because the inventory holds only block numbers.
// Picking it up also counts CTR.tomorrow, which opens the hatch in the launch pad's closet.
import { Pixels, rng } from '../../../kit/pixels';
import { BlockSet, SOLID } from './book';
import { T, oval, outline, shadeAt } from '../art/draw';
import { C, PAL } from '../art/pal';
import { CTR, EGG_BLOCK } from '../ids';
import { on, type Floor } from './shared';

/** The egg alone on a transparent square (also shown big on its postcard). */
export function eggPic(): Pixels {
  const p = new Pixels(20, 20, T);
  const teal = PAL.r('teal');
  const r = rng(2000);
  const cx = 10;
  const cy = 9.5;
  const inside = (x: number, y: number) => {
    const ny = (y + 0.5 - cy) / 7.8;
    // Narrower at the top, like an egg.
    const rx = 6.2 * (ny < 0 ? 1 + 0.2 * ny : 1);
    const nx = (x + 0.5 - cx) / rx;
    return nx * nx + ny * ny <= 1 ? [nx, ny] : undefined;
  };
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const n = inside(x, y);
      if (!n) continue;
      const [nx, ny] = n;
      const z = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      // Felt: soft light from the upper left, and a fuzz of stray fibers.
      const l = (0.6 * z - 0.4 * nx - 0.5 * ny + 0.35) / 1.2 + (r() - 0.5) * 0.35;
      p.set(x, y, shadeAt(teal, 1, 5, l, x, y));
    }
  const inEgg = (x: number, y: number) => !!inside(x, y);
  const put = (x: number, y: number, c: number) => {
    if (inEgg(x, y)) p.set(x, y, c);
  };
  // Silver wave stitching, dashed like running stitch, above and below.
  for (let x = 4; x < 17; x++) {
    if (x % 3 === 2) continue;
    put(x, 3 + Math.round(Math.sin(x * 1.3)), C('chrome', 6));
    put(x, 15 + Math.round(Math.sin(x * 1.3 + 1)), C('chrome', 6));
  }
  // The band of chrome sequins: alternating glints.
  for (let x = 3; x < 18; x++) {
    put(x, 12, x % 2 ? C('chrome', 7) : C('chrome', 4));
    put(x, 13, x % 2 ? C('chrome', 3) : C('chrome', 6));
  }
  // The red felt rocket, with fins, a porthole and a flame of orange yarn.
  p.rect(9, 6, 3, 4, C('red', 2)).rect(9, 6, 1, 4, C('red', 3));
  p.set(10, 5, C('red', 3)).set(10, 4, C('red', 4));
  p.set(10, 7, C('glass', 3));
  p.set(8, 9, C('red', 1)).set(12, 9, C('red', 1));
  p.set(9, 10, C('orange', 3)).set(10, 10, C('gold', 4)).set(11, 10, C('orange', 3)).set(10, 11, C('orange', 2));
  // A glint on the shiny felt.
  p.set(6, 6, C('teal', 5)).set(6, 7, C('teal', 5)).set(7, 5, C('teal', 5));
  outline(p, C('teal', 0));
  // It hovers a little, like everything in the year 2000.
  const sh = new Pixels(20, 20, T);
  oval(sh, 10, 18.6, 5, 1.2, C('grey', 1));
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (p.get(x, y) === T && sh.get(x, y) !== T) p.set(x, y, sh.get(x, y));
  return p;
}

/** Puts the egg at EGG_BLOCK in a set: a Pick-up block that leaves `floor` behind. */
export function addEgg(set: BlockSet, floor: Floor): void {
  set.skipTo(EGG_BLOCK);
  set.add('egg', on(floor, 7).blit(eggPic(), 0, 0, T), { obj: true, effect: CTR.tomorrow, eamt: 1, score: 2000, touch: floor });
  if (set.id('egg') !== EGG_BLOCK) throw new Error('The egg is not at EGG_BLOCK');
}

/** A round chrome hatch with a red rocket on it: shut, or open on a teal glow. */
function hatch(open: number): Pixels {
  const p = on('concrete');
  p.disc(10, 10, 9, C('chrome', 2)).ring(10, 10, 8.5, C('chrome', 6));
  if (open < 0) {
    p.disc(10, 10, 6.5, C('teal', 1)).ring(10, 10, 6.5, C('chrome', 4));
    p.rect(9, 6, 3, 6, C('red', 2)).set(10, 5, C('red', 3)).set(10, 8, C('glass', 3));
    p.set(8, 11, C('red', 1)).set(12, 11, C('red', 1)).set(10, 12, C('orange', 3)).set(10, 13, C('gold', 4));
    for (const [x, y] of [
      [10, 1],
      [10, 18],
      [1, 10],
      [18, 10],
    ])
      p.set(x, y, C('chrome', 7));
    return p;
  }
  for (let y = 2; y < 19; y++)
    for (let x = 2; x < 19; x++) {
      const d = Math.hypot(x + 0.5 - 10, y + 0.5 - 10);
      if (d > 7) continue;
      const swirl = (Math.atan2(y - 10, x - 10) / Math.PI + d / 4 + open / 2) % 1;
      p.set(x, y, shadeAt(PAL.r('teal'), 2, 5, Math.abs(swirl) * (1 - d / 9) + 0.2, x, y));
    }
  p.disc(10, 10, 1.5, C('grey', 7));
  return p;
}

/** The closet hatch: shut until CTR.tomorrow has counted the egg, then a swirling way through. */
export function addHatch(set: BlockSet): void {
  set.add('hatch', hatch(-1), { solid: SOLID, effect: CTR.tomorrow, eamt: -1, touch: 'hatchOpen' });
  set.add('hatchOpen', hatch(0), { next: 'hatchOpen2', ntime: 2 });
  set.add('hatchOpen2', hatch(1), { next: 'hatchOpen', ntime: 2 });
}
