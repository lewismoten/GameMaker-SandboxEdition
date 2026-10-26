// SKY.MBL: what comes at Grandpa's CitiCar in the Cloud Lane, seen from behind and drawn at
// four sizes: a dot on the horizon, small, nearly there, and full size beside the car. A
// monster shows its sizes in turn as it slides down its lane (skyMonsters.ts), so it seems to
// come closer. Only the two nearest sizes can touch the car, so only they hurt (or help).
import { Pixels } from '../../../kit/pixels';
import { BlockSet, type BlockDef } from '../blocks/book';
import { T, oval, outline } from '../art/draw';
import { micro } from '../art/font';
import { C } from '../art/pal';
import { ITEM_PICS } from '../blocks/items';
import { CTR } from '../ids';
import { ROAD_SIZES, shrinkSprite } from '../../../kit/road3d';

const K = () => C('gray', 0);

/** A hover car from behind: teal, a bubble canopy, red tail lights, a glow where the wheels would be. */
function hoverCar(): Pixels {
  const p = new Pixels(20, 20, T);
  oval(p, 10, 18, 8, 1.6, C('teal', 5));
  for (let y = 4; y < 16; y++)
    for (let x = 2; x < 18; x++) {
      const nx = (x + 0.5 - 10) / 8;
      const ny = (y + 0.5 - 10) / 6;
      if (nx ** 4 + ny ** 4 <= 1) p.set(x, y, C('teal', y < 8 ? 4 : y < 13 ? 3 : 1));
    }
  oval(p, 10, 6.5, 4.5, 3, C('glass', 1));
  p.rect(7, 5, 3, 1, C('glass', 3));
  p.rect(3, 10, 3, 2, C('red', 4)).rect(14, 10, 3, 2, C('red', 4));
  p.rect(4, 13, 12, 2, C('chrome', 5)).rect(4, 14, 12, 1, C('chrome', 2));
  p.rect(9, 9, 2, 3, C('teal', 5));
  outline(p, K());
  return p;
}

/** A hover truck from behind: a tall gold box of faxes with roll-up doors. */
function hoverTruck(): Pixels {
  const p = new Pixels(20, 20, T);
  oval(p, 10, 18.4, 9, 1.4, C('teal', 5));
  p.rect(1, 1, 18, 14, C('gold', 3)).rect(1, 1, 18, 2, C('gold', 5)).rect(1, 13, 18, 2, C('gold', 1));
  for (let y = 5; y < 13; y += 2) p.rect(2, y, 16, 1, C('gold', 2));
  p.rect(10, 3, 1, 10, C('gold', 1));
  p.rect(3, 4, 13, 7, C('paper', 2));
  micro(p, 5, 5, 'FAX', C('red', 2));
  p.rect(1, 15, 3, 2, C('red', 4)).rect(16, 15, 3, 2, C('red', 4));
  p.rect(4, 15, 12, 2, C('chrome', 3));
  outline(p, K());
  return p;
}

/** A lane dash, slanted along its lane line (drawn for the right line; the left one is mirrored). */
function dash(size: number): Pixels {
  const p = new Pixels(20, 20, T);
  const len = [1, 2, 4, 6, 9][size];
  const wide = [1, 1, 2, 2, 3][size];
  for (let i = 0; i < len; i++) {
    const y = 10 - Math.floor(len / 2) + i;
    const x = 10 + Math.round((i - len / 2) * 0.4);
    p.rect(x, y, wide, 1, i === 0 && len > 2 ? C('teal', 5) : C('gray', 7));
  }
  return p;
}

/** A cloud puff: a car swerving off into the clouds. */
function puff(k: number): Pixels {
  const p = new Pixels(20, 20, T);
  const r = 4 + k * 3;
  oval(p, 10 - r / 2, 11, r * 0.7, r * 0.6, C('sky', 6));
  oval(p, 10 + r / 2, 11, r * 0.7, r * 0.6, C('sky', 6));
  oval(p, 10, 9, r * 0.8, r * 0.7, C('gray', 7));
  return p;
}

/** A sparkle: a prize, caught. */
function sparkle(k: number): Pixels {
  const p = new Pixels(20, 20, T);
  const r = 3 + k * 4;
  for (const [dx, dy] of [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ])
    p.line(10, 10, 10 + dx * r, 10 + dy * r, C('gold', 5));
  p.set(10, 10, C('gray', 7));
  if (k)
    for (const [dx, dy] of [
      [3, 3],
      [-3, 3],
      [3, -3],
      [-3, -3],
    ])
      p.set(10 + dx, 10 + dy, C('gold', 4));
  return p;
}

export function buildSkyMonsterBlocks(): BlockSet {
  const s = new BlockSet(100, true);
  const sizes = (name: string, full: Pixels, near: BlockDef) =>
    ROAD_SIZES.forEach(({ scale, bottom }, i) => s.add(`${name}${i}`, shrinkSprite(full, scale, bottom, T), i >= 2 ? near : {}));
  // A bump hurts as on the Skyway: cars 12, trucks 16 (nothing far off can touch the car).
  sizes('car', hoverCar(), { hp: -12 });
  sizes('truck', hoverTruck(), { hp: -16 });
  sizes('page', ITEM_PICS.page(), { effect: CTR.pages, eamt: 1, score: 100 });
  sizes('pill', ITEM_PICS.pill(), { hp: 15, score: 10 });
  for (let i = 0; i < 5; i++) s.add(`dash${i}`, dash(i));
  s.add('puff0', puff(0));
  s.add('puff1', puff(1));
  s.add('sparkle0', sparkle(0));
  s.add('sparkle1', sparkle(1));
  return s;
}
