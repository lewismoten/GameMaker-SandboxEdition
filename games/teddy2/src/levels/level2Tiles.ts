// Level 2's background blocks: the end of Maple Street with The Dog House, Main Street's
// brick storefronts (awnings to stand on, shop windows, signs), the Town Commons with its
// white gazebo (green roof, a weathervane with Gwinn's leash tangled on it), the electric
// company's bucket truck, the bank and the charging station where THE CHEZ waits, a tall
// hedge, and behind it Gwinn's secret digging spot and her den full of loot.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, micro, speckle } from '../art/draw';
import { GRAV, Tiles } from './level';
import { bricks, c, canvas, cloud, copy, cut, dirt, grassTop, hedge, leaves, picket, r, sky, trunk, tuft, windowOn } from '../blocks/tiles';
import { dogHouseLibrary } from '../sprites/library';
import { halves } from '../sprites/people';
import { townCrier } from '../sprites/townfolk';
import { propOn } from '../sprites/klown';
import { road, sidewalk, sign } from './common';
import { CTR } from '../ids';

export const G = 40;

/** The sky band of map row y (the town's ground is at row 40), and its block. */
export const bandRow = (y: number) => (y <= 31 ? 0 : y <= 33 ? 1 : y <= 36 ? 2 : 3);
export const skyAt = (y: number) => `sky${bandRow(y)}`;
const skyRow = (y: number) => sky(bandRow(y));

export function mainTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  for (let part = 0; part < 3; part++) t.air(`cloud${part}`, cloud(0, part, 5));
  t.wall('walk', sidewalk(1));
  t.wall('walk2', sidewalk(2));
  t.wall('pave', sidewalk(3, 'brick'));
  t.wall('road', road(false, 3));
  t.wall('roadLine', road(true, 4));
  t.wall('deep', dirt(5, true));
  t.wall('grass', grassTop(6));
  t.air('lawn', tuft(sky(3), 31));
  t.air('picket', picket(tuft(sky(3), 32), true));
  t.air('hedgeTop', hedge(true, 21));
  t.wall('hedgeWall', hedge(false, 25));
  t.air('leaf', leaves(7, sky(2)));
  t.air('leafLow', leaves(8, sky(3)));
  t.air('trunk', trunk(sky(3)));

  // The Dog House, the tiny library on Maple Street (a book, the paw-knob snack drawer).
  const libOf = (st: { open?: boolean } = {}) => cut(dogHouseLibrary(canvas(2, 3, (_bx, by) => (by < 2 ? sky(3) : t.pic('lawn'))), st));
  const lib = libOf();
  t.air('libRoofL', lib[0][0]);
  t.air('libRoofR', lib[0][1]);
  t.air('libBooks', lib[1][0]);
  t.air('libDrawerOpen', libOf({ open: true })[1][1]);
  t.air('libDrawer', lib[1][1], { effect: CTR.treats, eamt: 3, score: 30, touch: 'libDrawerOpen' });
  t.ledge('libRocksL', lib[2][0]);
  t.ledge('libRocksR', lib[2][1]);
  // a lamp post
  for (const [name, top] of [
    ['lampTop', true],
    ['lampPost', false],
  ] as const) {
    const p = sky(3);
    p.rect(9, top ? 8 : 0, 2, top ? 12 : 20, c('ink', 1));
    if (top) p.rect(6, 1, 8, 7, c('ink', 1)).rect(7, 2, 6, 5, c('glow', 3));
    else p.rect(7, 16, 6, 4, c('ink', 1));
    t.air(name, p);
  }

  // Main Street: two-story brick fronts, a cornice, upstairs windows.
  const brick = bricks(11);
  t.air('brick', brick);
  t.air('brickWin', windowOn(brick, false, 'green'));
  t.air(
    'cornice',
    (() => {
      const p = skyRow(30);
      p.rect(0, 8, 20, 12, c('brick', 1)).rect(0, 8, 20, 3, c('stone', 3)).rect(0, 11, 20, 1, c('stone', 1));
      for (let x = 1; x < 20; x += 4) p.rect(x, 12, 2, 3, c('stone', 2));
      return p;
    })(),
  );
  // shop awnings: stand on them (ledges)
  for (const [name, col] of [
    ['awnRed', 'red'],
    ['awnGreen', 'green'],
    ['awnBlue', 'blue'],
  ] as const)
    t.ledge(
      name,
      (() => {
        const p = copy(brick);
        for (let x = 0; x < 20; x++) p.rect(x, 0, 1, 10, (x >> 2) % 2 ? c('paint', 3) : c(col, 2));
        p.rect(0, 10, 20, 2, c(col, 0));
        for (let x = 0; x < 20; x += 4) blob(p, x + 2, 11, 2, 2, (x >> 2) % 2 ? [c('paint', 2), c('paint', 3)] : [c(col, 1), c(col, 2)], 0, 1);
        return p;
      })(),
    );
  // shop windows with something in them, and doors
  const shopWin = (fill: (p: Pixels) => void) => {
    const p = copy(brick);
    p.rect(1, 2, 18, 18, c('wood', 1)).rect(2, 3, 16, 15, c('sky', 6));
    p.line(4, 15, 9, 4, c('sky', 7));
    fill(p);
    p.rect(1, 17, 18, 3, c('wood', 2));
    return p;
  };
  t.air(
    'winCakes',
    shopWin((p) => {
      blob(p, 7, 13, 4, 3, r('pink'), 1, 3);
      p.rect(5, 9, 4, 2, c('paint', 3)).set(7, 8, c('red', 3));
      blob(p, 14, 14, 3, 2, r('wood'), 2, 4);
    }),
  );
  t.air(
    'winToys',
    shopWin((p) => {
      blob(p, 6, 13, 3, 3, r('red'), 1, 3);
      p.rect(11, 8, 5, 8, c('yellow', 2)).rect(12, 9, 3, 2, c('blue', 2));
      p.line(4, 6, 8, 6, c('purple', 2));
    }),
  );
  t.air(
    'winFloats',
    shopWin((p) => {
      for (const x of [5, 12]) {
        p.rect(x, 8, 4, 8, c('wood', 1)).rect(x, 8, 4, 2, c('paint', 3));
        p.rect(x + 2, 4, 1, 5, c('red', 2));
      }
    }),
  );
  t.air(
    'winBarber',
    shopWin((p) => {
      p.rect(5, 10, 10, 6, c('red', 1)).rect(6, 5, 8, 5, c('red', 2));
      micro(p, 4, 12, '25C', c('paint', 3));
    }),
  );
  const door = canvas(1, 2, () => brick);
  door.rect(3, 6, 14, 34, c('green', 0)).frame(3, 6, 14, 34, c('ink', 0));
  door.rect(5, 9, 10, 12, c('sky', 6)).rect(13, 26, 2, 2, c('gold', 2));
  t.air('doorTop', door.crop(0, 0, 20, 20));
  t.air('doorBot', door.crop(0, 20, 20, 20));
  // the barber's pole
  t.air(
    'pole',
    (() => {
      const p = copy(brick);
      p.rect(7, 0, 6, 20, c('paint', 3));
      for (let y = 0; y < 20; y++) p.rect(7 + ((y + 0) % 6), y, 2, 1, (y >> 1) % 2 ? c('red', 2) : c('blue', 2));
      p.rect(6, 0, 8, 2, c('gold', 2));
      return p;
    })(),
  );
  // shop signs: two blocks wide, words in little letters
  const signboard = (name: string, words: string, col: string) => {
    const p = canvas(2, 1, () => brick);
    p.rect(1, 3, 38, 14, c(col, 1)).frame(1, 3, 38, 14, c('gold', 2));
    micro(p, 20 - Math.floor((words.length * 4 - 1) / 2), 8, words, c('paint', 3));
    const [a, b] = cut(p)[0];
    t.air(`${name}L`, a);
    t.air(`${name}R`, b);
  };
  signboard('sBarber', 'BARBER', 'blue');
  signboard('sBakery', 'BAKERY', 'red');
  signboard('sDime', 'FIVE & DIME', 'green');
  signboard('sSoda', 'ROOT BEER', 'red');
  signboard('sBank', 'BANK', 'ink');
  // the alley's trash cans
  t.wall(
    'can',
    (() => {
      const p = sky(3);
      p.rect(3, 4, 14, 16, c('metal', 2)).rect(2, 3, 16, 2, c('metal', 3));
      for (let x = 5; x < 17; x += 3) p.rect(x, 6, 1, 13, c('metal', 1));
      return p;
    })(),
  );

  // The Town Commons: brick paving, flowers, benches, the gazebo, Founders' Day bunting.
  t.air('beds', tuft(sky(3), 41, 'red'));
  t.air('beds2', tuft(sky(3), 42, 'yellow'));
  t.air(
    'bench',
    (() => {
      const p = sky(3);
      p.rect(1, 9, 18, 2, c('wood', 3)).rect(1, 4, 18, 2, c('wood', 2));
      p.rect(2, 11, 2, 9, c('ink', 1)).rect(16, 11, 2, 9, c('ink', 1));
      return p;
    })(),
  );
  for (const k of [1, 2])
    t.air(
      `bunting${k}`,
      (() => {
        const p = skyRow(34);
        for (let x = 0; x < 20; x++) p.set(x, 2 + Math.round(Math.sin((x / 20) * Math.PI) * 3), c('ink', 1));
        for (let i = 0; i < 4; i++) {
          const x = 2 + i * 5;
          const col = ['red', 'paint', 'blue', 'paint'][i];
          for (let k2 = 0; k2 < 4; k2++) p.rect(x + k2 / 2, 4 + k2, 4 - k2, 1, c(col, col === 'paint' ? 3 : 2));
        }
        return p;
      })(),
    );
  // The gazebo: white, eight-sided (seen from the side: posts and railings), a green roof
  // that rises to a peak with a weathervane, brick steps. Its roof and floor are ledges.
  const roofRow = (k: number, part: 'L' | 'M' | 'R' | 'peak') => {
    const p = sky(k);
    if (part === 'peak') {
      for (let y = 6; y < 20; y++) {
        const half = Math.floor((y - 6) * 0.75);
        p.rect(10 - half, y, half * 2 + 1, 1, y % 4 === 0 ? c('green', 0) : c('green', 1));
      }
      p.rect(9, 0, 2, 6, c('ink', 1)).rect(5, 1, 10, 1, c('ink', 1)).rect(13, 0, 3, 3, c('ink', 1));
      return p;
    }
    for (let y = 0; y < 20; y++) {
      const x0 = part === 'L' ? 19 - y : 0;
      const x1 = part === 'R' ? y + 1 : 20;
      for (let x = Math.max(0, x0); x < Math.min(20, x1); x++) p.set(x, y, (x + y) % 6 === 0 ? c('green', 0) : c('green', y < 2 ? 2 : 1));
    }
    return p;
  };
  t.ledge('gzPeak', roofRow(bandRow(32), 'peak'));
  for (const y of [33, 34, 35]) {
    t.ledge(`gzRoofL${y}`, roofRow(bandRow(y), 'L'));
    if (y > 33) t.ledge(`gzRoof${y}`, roofRow(bandRow(y), 'M'));
    t.ledge(`gzRoofR${y}`, roofRow(bandRow(y), 'R'));
  }
  t.ledge('gzRoof33', roofRow(bandRow(33), 'M'));
  t.air(
    'gzEave',
    (() => {
      const p = roofRow(bandRow(36), 'M');
      for (let x = 0; x < 20; x += 5) for (let k = 0; k < 4; k++) p.rect(x + k, 19 - k, 1, 1, c('paint', 3));
      return p;
    })(),
  );
  const postRail = (k: number, post: boolean, rail: boolean) => {
    const p = sky(k);
    if (post) p.rect(8, 0, 4, 20, c('paint', 3)).rect(8, 0, 1, 20, c('paint', 2));
    if (rail) {
      p.rect(0, 8, 20, 2, c('paint', 3));
      for (let x = 1; x < 20; x += 4) p.rect(x, 10, 1, 10, c('paint', 2));
    }
    // sunburst brackets at the top of each post
    if (post && !rail) for (let i = 0; i < 6; i++) p.set(4 + i, 5 - Math.floor(i / 2), c('paint', 3)).set(15 - i, 5 - Math.floor(i / 2), c('paint', 3));
    return p;
  };
  t.air('gzPostHi', postRail(3, true, false));
  t.air('gzOpenHi', sky(3));
  t.air('gzPost', postRail(3, true, true));
  t.air('gzRail', postRail(3, false, true));
  t.wall(
    'gzFloor',
    (() => {
      const p = sidewalk(7, 'brick');
      p.rect(0, 0, 20, 4, c('paint', 3)).rect(0, 4, 20, 1, c('paint', 1));
      return p;
    })(),
  );
  // Gwinn's pink leash, tangled round the weathervane: fetch it (F) from the roof's peak.
  t.clue('gzLeash', 'leash', 'sky0');
  t.air('signRing', sign(sky(3), 'RING'));

  // The bucket truck: the cab and its boom (the bucket is a monster riding up and down).
  const truck = canvas(3, 2, () => sky(3));
  truck.rect(2, 18, 40, 16, c('paint', 3)).rect(2, 18, 40, 2, c('fur', 0));
  truck.rect(42, 8, 16, 26, c('yellow', 2)).rect(44, 11, 12, 9, c('sky', 6)).rect(42, 8, 16, 1, c('yellow', 3));
  micro(truck, 6, 24, 'POWER CO', c('blue', 1));
  truck.rect(0, 14, 2, 6, c('metal', 2)).line(2, 14, 30, 4, c('metal', 2)).line(2, 15, 30, 5, c('metal', 1));
  for (const x of [12, 48]) {
    blob(truck, x, 35, 5, 5, [c('ink', 0), c('ink', 1)], 0, 1);
    truck.disc(x, 35, 2, c('metal', 3));
  }
  const tc = cut(truck);
  for (let by = 0; by < 2; by++) for (let bx = 0; bx < 3; bx++) t.air(`truck${bx}${by}`, tc[by][bx]);

  // The Town Crier (asleep on his feet, it's early), in his tricorn and hunting shirt.
  const [crTop, crBot] = halves(townCrier(true), sky(3), sky(3));
  t.air('crierTop', crTop);
  t.air('crierBot', crBot);

  // The bank, with a clock; the charging station's sign.
  t.air(
    'bankWall',
    (() => {
      const p = new Pixels(20, 20);
      speckle(p, 0, 0, 20, 20, r('stone'), 3, 1, 71, 0.15);
      for (let y = 4; y < 20; y += 5) p.rect(0, y, 20, 1, c('stone', 2));
      return p;
    })(),
  );
  t.air(
    'column',
    (() => {
      const p = copy(t.pic('bankWall'));
      p.rect(5, 0, 10, 20, c('paint', 3)).rect(5, 0, 2, 20, c('paint', 2)).rect(13, 0, 2, 20, c('paint', 1));
      return p;
    })(),
  );
  t.air(
    'clock',
    (() => {
      const p = copy(t.pic('bankWall'));
      p.disc(10, 10, 8, c('ink', 0)).disc(10, 10, 7, c('paint', 3));
      p.line(10, 10, 10, 5, c('ink', 0)).line(10, 10, 14, 10, c('ink', 0));
      return p;
    })(),
  );
  t.air(
    'evSign',
    (() => {
      const p = sky(3);
      p.rect(9, 10, 2, 10, c('metal', 1));
      p.rect(1, 1, 18, 10, c('red', 2)).frame(1, 1, 18, 10, c('paint', 3));
      micro(p, 3, 3, 'EV', c('paint', 3));
      p.rect(11, 3, 2, 3, c('yellow', 3)).rect(10, 5, 2, 3, c('yellow', 3));
      return p;
    })(),
  );
  t.air(
    'charger',
    (() => {
      const p = sky(3);
      p.rect(6, 4, 8, 16, c('paint', 3)).frame(6, 4, 8, 16, c('ink', 0)).rect(8, 7, 4, 3, c('green', 2));
      p.line(14, 12, 19, 16, c('ink', 0));
      return p;
    })(),
  );

  // Behind the hedge (reached the long way round): Gwinn's secret digging spot.
  t.air('garden', tuft(sky(3), 43, 'purple'));
  t.air(
    'boneSign',
    (() => {
      const p = sign(sky(3), 'MINE');
      return p;
    })(),
  );
  t.air('hole', new Pixels(20, 20, c('dirt', 0)));
  // the den's way in, under the soft dirt: looks like any other dirt from above
  t.air('holeDeep', dirt(10));
  t.wall('dirt', dirt(9));

  // Her den, deep under the hedge: dug-out earth, roots, her loot, and the way back up.
  const den = (() => {
    const p = new Pixels(20, 20);
    speckle(p, 0, 0, 20, 20, r('dirt'), 1, 1, 81, 0.25);
    return p;
  })();
  t.air('den', den);
  t.wall('denWall', dirt(82, true));
  t.wall(
    'denFloor',
    (() => {
      const p = dirt(83);
      p.rect(0, 0, 20, 2, c('dirt', 3));
      return p;
    })(),
  );
  t.air(
    'roots',
    (() => {
      const p = copy(den);
      p.line(3, 0, 6, 9, c('wood', 1)).line(6, 9, 4, 14, c('wood', 1)).line(14, 0, 12, 7, c('wood', 0));
      return p;
    })(),
  );
  // the loot: a tennis ball, a sock, Doc Leo's slipper, a squeaky hedgehog, a wooden spoon
  t.air(
    'loot1',
    (() => {
      const p = copy(den);
      blob(p, 5, 16, 3, 3, r('yellow'), 1, 3);
      p.rect(9, 14, 8, 4, c('red', 2)).rect(9, 14, 8, 1, c('paint', 3)).rect(15, 12, 3, 6, c('red', 2));
      return p;
    })(),
  );
  t.air(
    'loot2',
    (() => {
      const p = copy(den);
      blob(p, 8, 16, 6, 3, r('blue'), 0, 2);
      p.line(12, 17, 19, 10, c('wood', 3)).line(13, 17, 19, 11, c('wood', 2));
      blob(p, 18, 9, 2, 3, r('wood'), 2, 4);
      return p;
    })(),
  );
  t.air(
    'denUp',
    (() => {
      const p = copy(den);
      p.rect(4, 0, 12, 20, c('dirt', 0));
      for (let y = 2; y < 20; y += 5) p.rect(5, y, 10, 1, c('wood', 1));
      return p;
    })(),
  );
  // the felt egg (block 149) on the loot pile
  t.keepsake(den);
  void GRAV;
  void rng;
  void propOn;
  return t;
}

