// Level 5's background blocks, Downtown at noon: the sidewalk, Biggles Department Store (from
// the first adventure's Downtown) with its fire escape, and the bakery beside it, cut open
// like a dollhouse, with the packing loft upstairs. Inside are the oven, the tray chutes and
// the belts. A belt is air at Teddy's row whose gravity points along it, with the belt itself
// drawn on the solid block under it. A slow belt takes turns between pushing and resting (two
// pictures), so it carries Teddy along gently and he can walk against it. A fast belt pushes
// all the time: there's no walking back on it, and it throws him a long way off its end.
// Under the floor are the pits between the belts and the tray return, a fast belt that
// carries a fallen dog back to the foot of the fast belt above. Also the flour sacks, the
// grates, the baker's racks, the display case, and the baker himself.
import { Pixels } from '../../../kit/pixels';
import { blob, speckle } from '../art/draw';
import { GRAV, Tiles } from './level';
import { bricks, c, cloud, copy, dirt, r, sky, windowOn } from '../blocks/tiles';
import { bandAt, sidewalk, sign, wallpaper, wideSign } from './common';
import { art } from './parts';
import { sack } from '../sprites/river';
import { baker } from '../sprites/bakery';
import { bubble } from '../sprites/townfolk';
import { leoOn } from '../sprites/leo';
import { micro } from '../art/draw';

export const G = 40;
/** The bakery's ceiling row (its roof is the row above). */
export const CEIL = 27;
/** The row Teddy walks on up in the packing loft (and out on the fire escape). */
export const LOFT = 32;
/** How long a slow belt pushes, then rests (block animation ticks). */
export const SLOW = { push: 3, rest: 2 };

/** A belt's top seen edge-on (solid), over the counter or the cellar: rollers and moving cleats. */
function beltBase(ramp: string, phase: number, under: Pixels, left: boolean, fast: boolean): Pixels {
  const p = copy(under);
  p.rect(0, 0, 20, 6, c(ramp, 1)).rect(0, 0, 20, 1, c(ramp, 3)).rect(0, 5, 20, 1, c('ink', 0));
  // cleats (chevrons for the fast belt) moving along with the phase
  const step = fast ? 10 : 5;
  for (let k = 0; k < 20; k += step) {
    const x = (k + (left ? -phase : phase) * (fast ? 5 : 2) + 40) % 20;
    if (fast) {
      const d = left ? -1 : 1;
      p.set(x, 2, c('yellow', 3))
        .set(x + d, 3, c('yellow', 3))
        .set(x, 4, c('yellow', 3));
    } else p.rect(x, 1, 1, 4, c(ramp, 3));
  }
  for (const x of [3, 10, 17]) p.disc(x, 9, 2, c('metal', 2)).set(x, 9, c('ink', 0));
  p.rect(0, 12, 20, 1, c('ink', 0));
  return p;
}

/** The air over a belt: the wall behind, with a little arrow low down showing which way it goes. */
function beltAir(base: Pixels, left: boolean, phase: number, ramp: string): Pixels {
  const p = copy(base);
  const x = 8 + (left ? -phase : phase) * 2;
  const d = left ? -1 : 1;
  for (let i = 0; i < 3; i++) p.set(x - d * i, 16 - i, c(ramp, 3)).set(x - d * i, 16 + i, c(ramp, 3));
  return p;
}

export function bakeryTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  for (let part = 0; part < 3; part++) t.air(`cloud${part}`, cloud(0, part, 17));
  t.wall('walk', sidewalk(71));
  t.wall('deep', dirt(72, true));
  // the storefronts along the street (scenery: Teddy walks in front of them)
  t.air('brick', bricks(73));
  t.air('brickWin', windowOn(bricks(74), true, 'red'));
  t.wall('edge', bricks(75, 'brick', 'ink'));

  // Biggles Department Store's sign, as Downtown always had it.
  art(
    t,
    'biggles',
    4,
    1,
    () => bricks(73),
    (p) => {
      p.rect(1, 3, 78, 14, c('gold', 1)).frame(1, 3, 78, 14, c('ink', 0));
      micro(p, 40 - 13, 8, 'BIGGLES', c('ink', 0));
    },
  );

  // The bakery: a brick front, a striped awning over each door, its name up on the roof.
  t.wall('front', bricks(76, 'brick', 'stone'));
  t.air(
    'doorway',
    (() => {
      const p = new Pixels(20, 20, c('wood', 0));
      p.rect(0, 0, 3, 20, c('wood', 2)).rect(17, 0, 3, 20, c('wood', 2)).rect(0, 0, 20, 2, c('wood', 2));
      return p;
    })(),
  );
  const awning = (base: Pixels) => {
    const p = copy(base);
    for (let x = 0; x < 20; x++) p.rect(x, 0, 1, 7, Math.floor(x / 4) % 2 ? c('paint', 3) : c('pink', 2));
    for (let x = 0; x < 20; x += 4) p.disc(x + 2, 7, 2, Math.floor(x / 4) % 2 ? c('paint', 3) : c('pink', 2));
    return p;
  };
  t.air('awnSky', awning(sky(bandAt(38, G))));
  t.air('awnFront', awning(bricks(76, 'brick', 'stone')));
  t.air(
    'roof',
    (() => {
      const p = bricks(77, 'brick', 'stone');
      p.rect(0, 0, 20, 4, c('stone', 3)).rect(0, 4, 20, 1, c('ink', 0));
      return p;
    })(),
  );
  art(
    t,
    'sBakery',
    4,
    1,
    () => sky(bandAt(29, G)),
    (p) => {
      p.rect(9, 14, 2, 6, c('ink', 1)).rect(69, 14, 2, 6, c('ink', 1));
      p.rect(2, 2, 76, 13, c('pink', 2)).frame(2, 2, 76, 13, c('ink', 0));
      micro(p, 40 - 11, 6, 'BAKERY', c('ink', 0));
    },
  );

  // Inside: white tiles, a tiled ceiling, a checkered floor; the cellar under it.
  const tiles = wallpaper('peach', 'tiles', 78, 'paint');
  t.air('tiles', tiles);
  t.wall(
    'ceiling',
    (() => {
      const p = new Pixels(20, 20, c('stone', 3));
      p.rect(0, 17, 20, 3, c('stone', 1)).rect(0, 0, 1, 17, c('stone', 2));
      return p;
    })(),
  );
  t.wall(
    'floor',
    (() => {
      const p = new Pixels(20, 20, c('stone', 1));
      for (let y = 0; y < 6; y++) for (let x = 0; x < 20; x++) p.set(x, y, (Math.floor(x / 5) + Math.floor(y / 3)) % 2 ? c('ink', 1) : c('paint', 3));
      p.rect(0, 6, 20, 1, c('ink', 0));
      speckle(p, 0, 7, 20, 13, r('stone'), 1, 1, 79, 0.2);
      return p;
    })(),
  );
  const cellar = (() => {
    const p = bricks(80, 'stone', 'ink');
    p.map((_x, _y, v) => (v === c('stone', 3) || v === c('stone', 4) ? c('stone', 1) : v === c('stone', 2) ? c('stone', 0) : v));
    return p;
  })();
  t.air('cellar', cellar);
  t.wall(
    'pitFloor',
    (() => {
      const p = new Pixels(20, 20, c('stone', 1));
      blob(p, 10, 2, 11, 3, [c('fur', 1), c('fur', 2)], 0, 1);
      speckle(p, 0, 5, 20, 15, r('stone'), 1, 1, 81, 0.2);
      return p;
    })(),
  );
  // a flour sack in the cellar (a step up to the grate), and the grate (hop up through it)
  t.on('sack', sack(), 'cellar', 'wall');
  t.ledge(
    'grate',
    (() => {
      const p = copy(cellar);
      p.rect(0, 0, 20, 3, c('metal', 2)).rect(0, 0, 20, 1, c('metal', 4));
      for (let x = 1; x < 20; x += 4) p.rect(x, 3, 2, 3, c('metal', 1));
      return p;
    })(),
  );

  // The belts. The slow ones (green carrying right, blue carrying left) push, then rest;
  // the fast one (red, with chevrons) always pushes, as does the tray return in the cellar.
  const under = (() => {
    const p = new Pixels(20, 20, c('metal', 1));
    p.rect(0, 14, 20, 6, c('stone', 1));
    return p;
  })();
  const slow = (name: string, left: boolean, ramp: string) => {
    const g = left ? GRAV.left : GRAV.right;
    t.air(`${name}0`, beltAir(tiles, left, 0, ramp), { grav: g | GRAV.down, next: `${name}1`, ntime: SLOW.push });
    t.air(`${name}1`, beltAir(tiles, left, 1, ramp), { grav: GRAV.down, next: `${name}0`, ntime: SLOW.rest });
    for (const ph of [0, 1]) t.wall(`${name}Base${ph}`, beltBase(ramp, ph, under, left, false), { next: `${name}Base${1 - ph}`, ntime: 3 });
  };
  slow('slowR', false, 'green');
  slow('slowL', true, 'blue');
  const fast = (name: string, left: boolean, base: Pixels, floor: Pixels) => {
    const g = left ? GRAV.left : GRAV.right;
    for (const ph of [0, 1]) {
      t.air(`${name}${ph}`, beltAir(base, left, ph, 'red'), { grav: g | GRAV.down, next: `${name}${1 - ph}`, ntime: 2 });
      t.wall(`${name}Base${ph}`, beltBase('red', ph, floor, left, true), { next: `${name}Base${1 - ph}`, ntime: 2 });
    }
  };
  fast('fast', false, tiles, under);
  fast('ret', true, cellar, cellar);
  fast('express', true, tiles, under);

  // The oven (its door births the trays of cookies onto the belt) and a tray chute.
  art(
    t,
    'oven',
    2,
    2,
    () => tiles,
    (p) => {
      p.rect(1, 2, 38, 38, c('metal', 1)).frame(1, 2, 38, 38, c('ink', 0));
      p.rect(4, 6, 32, 4, c('metal', 3));
      for (const x of [8, 16, 24, 32]) p.disc(x, 8, 1, c('red', 2));
      p.rect(4, 14, 32, 22, c('ink', 0)).rect(6, 16, 28, 18, c('orange', 1));
      blob(p, 20, 30, 12, 4, [c('orange', 2), c('yellow', 2), c('yellow', 3)], 0, 2);
      p.rect(4, 14, 32, 2, c('metal', 4));
    },
  );
  t.air(
    'pipe',
    (() => {
      const p = copy(tiles);
      p.rect(6, 0, 8, 20, c('metal', 2)).rect(6, 0, 1, 20, c('metal', 4)).rect(13, 0, 1, 20, c('metal', 0));
      return p;
    })(),
  );
  t.air(
    'chute',
    (() => {
      const p = copy(tiles);
      p.rect(6, 0, 8, 6, c('metal', 2));
      for (let y = 6; y < 14; y++) p.rect(6 - (y - 6), y, 8 + (y - 6) * 2, 1, c('metal', y === 13 ? 0 : 2));
      p.rect(0, 13, 20, 1, c('ink', 0));
      return p;
    })(),
  );

  // The packing loft's floor, a flour sack on the express belt, the window out, and Biggles'
  // fire escape (a grating to walk on, its railing behind).
  t.wall(
    'loft',
    (() => {
      const p = copy(under);
      p.rect(0, 0, 20, 4, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 4, 20, 1, c('ink', 0));
      return p;
    })(),
  );
  t.on('sackLoft', sack(), 'tiles', 'wall');
  t.air(
    'window',
    (() => {
      const p = sky(bandAt(LOFT, G));
      p.rect(0, 0, 20, 2, c('wood', 2)).rect(0, 0, 2, 20, c('wood', 2)).rect(18, 0, 2, 20, c('wood', 2));
      return p;
    })(),
  );
  t.ledge(
    'escape',
    (() => {
      const p = new Pixels(20, 20);
      p.px.set(bricks(73).px);
      p.rect(0, 0, 20, 3, c('ink', 1)).rect(0, 0, 20, 1, c('metal', 2));
      for (let x = 2; x < 20; x += 5) p.line(x, 3, x + 4, 12, c('ink', 1));
      return p;
    })(),
  );
  const rail = (base: Pixels) => {
    const p = copy(base);
    p.rect(0, 4, 20, 2, c('ink', 1));
    for (let x = 1; x < 20; x += 6) p.rect(x, 4, 2, 16, c('ink', 1));
    return p;
  };
  t.air('railBrick', rail(bricks(73)));
  t.air('railSky', rail(sky(bandAt(LOFT, G))));

  // The baker's rack (a shelf to hop up through), the display case and the counter.
  t.ledge(
    'rack',
    (() => {
      const p = copy(tiles);
      p.rect(0, 0, 20, 3, c('metal', 3)).rect(0, 3, 20, 1, c('ink', 0));
      p.rect(1, 3, 1, 17, c('metal', 1)).rect(18, 3, 1, 17, c('metal', 1));
      return p;
    })(),
  );
  art(
    t,
    'case',
    2,
    1,
    () => tiles,
    (p) => {
      p.rect(1, 4, 38, 16, c('wood', 2)).rect(2, 4, 36, 9, c('water', 3)).frame(1, 4, 38, 16, c('ink', 0));
      for (const [x, k] of [
        [7, 'pink'],
        [15, 'yellow'],
        [24, 'frost'],
        [32, 'orange'],
      ] as const)
        blob(p, x, 10, 3, 2, [c(k, 1), c(k, 2)], 0, 1);
    },
  );

  // The baker, by the candles (he winks: it's a secret).
  const [bTop, bBot] = leoOn(baker(), tiles, tiles);
  t.air('bakerTop', bTop);
  t.air('bakerBot', bBot);
  t.air('bakerSays', bubble(['SHH!'], tiles));
  t.clue('candles', 'candles', 'tiles');

  // Signs.
  const sayWide = (name: string, base: Pixels, words: string) => {
    const [a, b] = wideSign(base, words);
    t.air(`${name}L`, a);
    t.air(`${name}R`, b);
  };
  sayWide('signRide', tiles, 'BELTS\nCARRY YOU');
  sayWide('signGaps', tiles, 'HOP THE\nGAPS');
  sayWide('signFast', tiles, 'FAST BELT!\nE AT END');
  t.air('signBack', sign(cellar, 'BACK', 'left'));
  sayWide('signExpress', tiles, 'EXPRESS\nHOME');
  t.air('signIn', sign(bricks(73), 'IN'));
  return t;
}
