// Level 14's background blocks: backstage at the Klown Klub's Big Top at night. The tent's
// canvas in dark violet stripes, the rigging overhead, the stage floor, black velvet wings
// where the spotlights wait between sweeps (the two home blocks of each light give birth to
// its sweep), the lights' tracks, draped prop tables to flop under, prop crates, a scenery
// flat lashed down by its foot, the riser with its crate step, Klown Klub members setting up
// (Professor Pratfall at the light board, Juggles practicing, Honker with the party horns),
// and the cake table, whose long tablecloth hides Gwinn's spot.
import { Pixels } from '../../../kit/pixels';
import { blob, micro, speckle } from '../art/draw';
import { Tiles } from './level';
import { boxFace, c, copy, r } from '../blocks/tiles';
import { floorboards, sign, wideSign } from './common';
import { art } from './parts';
import { KLUB } from '../sprites/klubfolk';
import { juggler } from '../sprites/folks';
import { leoOn } from '../sprites/leo';

export const G = 40;

/** The tent's canvas: dark violet stripes with soft folds. */
export function tent(): Pixels {
  const p = new Pixels(20, 20);
  speckle(p, 0, 0, 10, 20, r('purple'), 0, 1, 3, 0.1);
  speckle(p, 10, 0, 10, 20, r('lilac'), 0, 1, 4, 0.1);
  p.rect(9, 0, 1, 20, c('ink', 0)).rect(19, 0, 1, 20, c('purple', 0));
  return p;
}

/** The foot of the scenery flat (its back: a wood frame over canvas), or the gap once it swings up. */
export function flatPanel(up = false): Pixels {
  const p = up ? copy(tent()) : new Pixels(20, 20, c('paint', 0));
  if (up) {
    // the chewed rope's ends, hanging from the flat above
    p.line(6, 0, 7, 6, c('hay', 2)).line(13, 0, 12, 4, c('hay', 2));
    return p;
  }
  p.rect(0, 0, 3, 20, c('wood', 2)).rect(17, 0, 3, 20, c('wood', 2)).rect(0, 16, 20, 4, c('wood', 2));
  p.line(3, 16, 16, 3, c('wood', 1));
  p.rect(14, 18, 4, 2, c('metal', 1));
  return p;
}

export function stageTiles(): Tiles {
  const t = new Tiles();
  const bg = tent();
  t.air('tent', bg);
  t.air(
    'tentTop',
    (() => {
      const p = new Pixels(20, 20, c('ink', 0));
      for (let x = 0; x < 20; x++) {
        const y = 12 + Math.round(3 * Math.sin((x / 20) * Math.PI));
        p.rect(x, y, 1, 20 - y, x < 10 ? c('purple', 0) : c('lilac', 0));
      }
      p.rect(9, 12, 1, 8, c('ink', 0));
      return p;
    })(),
  );
  // the rigging overhead: dark, with lines running up to the fly gallery
  t.air(
    'rig',
    (() => {
      const p = new Pixels(20, 20, c('ink', 0));
      p.rect(4, 0, 1, 20, c('hay', 0)).rect(15, 0, 1, 20, c('ink', 1));
      return p;
    })(),
  );
  t.air(
    'sandbag',
    (() => {
      const p = new Pixels(20, 20, c('ink', 0));
      p.rect(4, 0, 1, 8, c('hay', 0));
      blob(p, 4, 12, 3, 4, r('hay'), 0, 1);
      return p;
    })(),
  );
  t.wall('floor', floorboards(5, 'wood'));
  t.wall(
    'under',
    (() => {
      const p = new Pixels(20, 20, c('ink', 0));
      p.rect(0, 0, 20, 2, c('wood', 0)).rect(8, 2, 3, 18, c('wood', 0));
      return p;
    })(),
  );
  t.wall(
    'tentWall',
    (() => {
      const p = new Pixels(20, 20, c('red', 0));
      for (let y = 0; y < 20; y += 5) p.rect(0, y, 20, 1, c('red', 1));
      p.rect(9, 0, 2, 20, c('ink', 0));
      return p;
    })(),
  );

  // Black velvet wings: the lights wait behind them between sweeps.
  const wing = (() => {
    const p = new Pixels(20, 20, c('ink', 1));
    for (const x of [3, 9, 15]) p.rect(x, 0, 2, 20, c('ink', 0));
    return p;
  })();
  t.air('wing', wing);
  t.air(
    'wingTop',
    (() => {
      const p = copy(wing);
      p.rect(0, 0, 20, 4, c('red', 0)).rect(0, 4, 20, 1, c('gold', 0));
      return p;
    })(),
  );

  // The lights' track: a rail at the bottom of the block (the trolley rides under it), and a
  // rise where the climbing light's track steps up.
  const rail = (p: Pixels) => p.rect(0, 17, 20, 2, c('metal', 2)).rect(0, 19, 20, 1, c('metal', 0));
  t.air('track', rail(copy(bg)));
  t.air(
    'trackUp',
    (() => {
      const p = rail(copy(bg));
      p.rect(8, 0, 4, 19, c('metal', 1)).rect(9, 0, 2, 19, c('metal', 2));
      return p;
    })(),
  );

  // A draped prop table (scenery: she walks in front of it, and fits flat under it).
  t.air(
    'propTable',
    (() => {
      const p = copy(bg);
      p.rect(0, 3, 20, 3, c('wood', 2)).rect(0, 3, 20, 1, c('wood', 3));
      p.rect(0, 6, 20, 5, c('red', 1));
      for (let x = 1; x < 20; x += 4) p.rect(x, 6, 2, 6, c('red', 2));
      p.rect(1, 11, 2, 9, c('wood', 1)).rect(17, 11, 2, 9, c('wood', 1));
      return p;
    })(),
  );
  // Prop crates (solid): stencilled PROPS.
  t.wall(
    'crate',
    (() => {
      const p = boxFace('wood', 2, 7);
      micro(p, 2, 8, 'PROPS', c('ink', 0));
      return p;
    })(),
  );
  // A road case (stacked, and the crate step up to the riser), and the riser's skirted front.
  const roadCase = (label?: string) => {
    const p = new Pixels(20, 20, c('ink', 1));
    p.frame(0, 0, 20, 20, c('metal', 2)).rect(0, 0, 3, 3, c('metal', 3)).rect(17, 0, 3, 3, c('metal', 3));
    if (label) micro(p, 10 - Math.floor((label.length * 4 - 1) / 2), 8, label, c('paint', 2));
    else p.rect(7, 8, 6, 3, c('metal', 2));
    return p;
  };
  t.wall('roadCase', roadCase());
  t.wall('caseAmp', roadCase('AMP'));
  t.wall('caseLamp', roadCase('LX'));
  const skirt = (top: boolean) => {
    const p = new Pixels(20, 20, c('blue', 0));
    for (let x = 0; x < 20; x += 5) p.rect(x, 0, 2, 20, c('blue', 1));
    if (top) p.rect(0, 0, 20, 4, c('wood', 3)).rect(0, 4, 20, 1, c('wood', 0));
    return p;
  };
  t.wall('riserTop', skirt(true));
  t.wall('riser', skirt(false));

  // The scenery flat (its back to us, too tall to hop), lashed to the floor by its foot.
  t.wall(
    'flat',
    (() => {
      const p = new Pixels(20, 20, c('paint', 0));
      p.rect(0, 0, 3, 20, c('wood', 2)).rect(17, 0, 3, 20, c('wood', 2));
      p.line(3, 19, 16, 0, c('wood', 1));
      return p;
    })(),
  );
  t.wall(
    'flatTop',
    (() => {
      const p = new Pixels(20, 20, c('ink', 0));
      p.rect(0, 6, 20, 14, c('paint', 0)).rect(0, 6, 20, 3, c('wood', 2));
      p.rect(9, 0, 2, 6, c('hay', 1));
      return p;
    })(),
  );
  t.air('flatGap', flatPanel(true));

  // Professor Pratfall at the light board, testing the lights.
  t.air(
    'board',
    (() => {
      const p = copy(bg);
      p.rect(1, 6, 18, 14, c('ink', 1)).rect(1, 6, 18, 2, c('metal', 2));
      for (let x = 3; x < 18; x += 3) p.rect(x, 9, 1, 8, c('ink', 0)).rect(x - 1, 10 + ((x * 7) % 6), 3, 2, c('metal', 3));
      p.set(4, 18, c('red', 3)).set(8, 18, c('green', 2)).set(12, 18, c('yellow', 3));
      return p;
    })(),
  );
  const two = (name: string, pose: Pixels, def = {}) => {
    const [a, b] = leoOn(pose, bg, bg);
    t.air(`${name}Top`, a, def);
    t.air(`${name}Bot`, b, def);
  };
  two('pratfall', KLUB.pratfall);
  two('honker', KLUB.honker);
  for (const ph of [0, 1]) {
    const [a, b] = leoOn(juggler(ph), bg, bg);
    t.air(`juggles${ph}Top`, a, { next: `juggles${1 - ph}Top`, ntime: 7 });
    t.air(`juggles${ph}Bot`, b, { next: `juggles${1 - ph}Bot`, ntime: 7 });
  }
  // a box of party horns beside Honker
  t.air(
    'horns',
    (() => {
      const p = copy(bg);
      p.rect(3, 10, 14, 10, c('wood', 3)).frame(3, 10, 14, 10, c('wood', 0));
      for (const [x, col] of [
        [5, 'red'],
        [9, 'yellow'],
        [13, 'blue'],
      ] as const)
        p.line(x, 9, x + 2, 3, c(col, 2)).rect(x + 2, 2, 2, 2, c(col, 3));
      return p;
    })(),
  );

  // Party bunting over the riser.
  t.air(
    'bunting',
    (() => {
      const p = copy(bg);
      p.line(0, 3, 19, 3, c('paint', 2));
      for (const [x, col] of [
        [2, 'red'],
        [8, 'yellow'],
        [14, 'blue'],
      ] as const)
        for (let k = 0; k < 6; k++) p.rect(x + Math.floor(k / 2), 4 + k, 5 - 2 * Math.floor(k / 2), 1, c(col, 2));
      return p;
    })(),
  );

  // The cake table: a three-tier birthday cake on a long tablecloth (3 x 4 blocks; the
  // bottom row is the cloth, down to the riser). The middle of the cloth is Gwinn's spot.
  art(
    t,
    'cake',
    3,
    4,
    () => bg,
    (p) => {
      // the table top and its cloth
      p.rect(0, 56, 60, 4, c('paint', 3)).rect(0, 59, 60, 1, c('paint', 1));
      p.rect(0, 60, 60, 20, c('paint', 2));
      for (let x = 2; x < 60; x += 6) p.rect(x, 60, 2, 20, c('paint', 3));
      p.rect(0, 77, 60, 3, c('pink', 2));
      // the cloth parted a little in the middle: Gwinn's spot, a dark gap and a cushion
      p.rect(25, 62, 10, 18, c('ink', 0)).line(24, 62, 22, 79, c('paint', 1)).line(35, 62, 37, 79, c('paint', 1));
      p.rect(26, 75, 8, 4, c('red', 1)).rect(26, 75, 8, 1, c('red', 2));
      // three tiers of frosting, with candles on top
      const tier = (x0: number, y0: number, w: number, h: number) => {
        p.rect(x0, y0, w, h, c('frost', 1)).rect(x0, y0, w, 2, c('frost', 2));
        for (let x = x0 + 1; x < x0 + w - 1; x += 4) p.rect(x, y0 + 2, 2, 2 + ((x >> 2) % 2), c('frost', 2));
        p.rect(x0, y0 + h - 2, w, 2, c('pink', 2));
        for (let x = x0 + 3; x < x0 + w - 2; x += 6) p.set(x, y0 + h - 5, c('red', 2)).set(x + 1, y0 + h - 5, c('blue', 3));
      };
      tier(6, 42, 48, 14);
      tier(13, 30, 34, 12);
      tier(20, 20, 20, 10);
      for (const x of [23, 28, 33, 37]) p.rect(x, 13, 2, 7, c(x % 2 ? 'blue' : 'yellow', 2)).rect(x, 10, 2, 3, c('glow', 3));
    },
  );

  // Signs.
  const pair = (name: string, words: string) => {
    const [a, b] = wideSign(bg, words);
    t.air(`${name}L`, a);
    t.air(`${name}R`, b);
  };
  pair('signSpot', 'LIGHTS:\n4: FLOP');
  pair('signRope', 'ROPE:\n1: CHEW');
  t.air('signShh', sign(bg, 'SHH!'));
  return t;
}
