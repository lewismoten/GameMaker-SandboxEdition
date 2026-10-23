// Level 5's background blocks, the farm where the hay wagon stopped at dawn: the lane, the
// chicken yard and its coop, the red barn cut open (a hay elevator whose belt carries Gwinn
// up to the loft: gravity up and to the right, two pictures taking turns), the pig wallow
// (mud lifts like water), the pasture fence and gate, a scarecrow in the pumpkins, the farm
// stand, and the Fair's ride truck with a Ferris wheel car on its flatbed.
import { Pixels } from '../../../kit/pixels';
import { blob, micro, speckle } from '../art/draw';
import { GRAV, Tiles } from './level';
import { c, canvas, cloud, copy, cut, dirt, grassTop, hedge, plankFence, planks, r, sky, tuft } from '../blocks/tiles';
import { sign, water } from './common';

export const G = 40;
export const bandRow = (y: number) => (y <= 30 ? 0 : y <= 33 ? 1 : y <= 36 ? 2 : 3);
export const skyAt = (y: number) => `sky${bandRow(y)}`;

export function farmTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  for (let part = 0; part < 3; part++) t.air(`cloud${part}`, cloud(0, part, 3));
  t.wall('grass', grassTop(1));
  t.wall('dirt', dirt(3));
  t.wall('deep', dirt(5, true));
  t.air('tuft', tuft(sky(3), 11));
  t.air('flower', tuft(sky(3), 12, 'yellow'));
  t.air('hedgeTop', hedge(true, 21, sky(bandRow(29))));
  t.wall('hedgeWall', hedge(false, 25));
  t.wall(
    'lane',
    (() => {
      const p = dirt(7);
      p.rect(0, 0, 20, 3, c('hay', 1));
      return p;
    })(),
  );
  // low fences (one board high: hop them) and the tall pasture fence
  t.wall(
    'rail',
    (() => {
      const p = sky(3);
      p.rect(8, 4, 4, 16, c('wood', 2)).rect(0, 6, 20, 3, c('wood', 3)).rect(0, 13, 20, 3, c('wood', 3));
      return p;
    })(),
  );
  t.wall('fence', plankFence(false));
  t.wall('fenceTop', plankFence(true));
  t.air(
    'gate',
    (() => {
      const p = plankFence(false);
      p.rect(0, 0, 2, 20, c('ink', 0)).rect(18, 0, 2, 20, c('ink', 0));
      p.line(2, 18, 18, 2, c('wood', 1));
      return p;
    })(),
  );
  // the coop (the canvases below are drawn over the sky of the map rows they stand on)
  const coop = canvas(2, 2, (_bx, by) => sky(bandRow(38 + by)));
  for (let y = 0; y < 14; y++) coop.rect(20 - y - 4, 2 + y, y * 2 + 8, 1, c('roof', 1));
  coop.rect(4, 16, 32, 24, c('red', 1)).rect(4, 16, 32, 2, c('paint', 3));
  coop.rect(16, 26, 8, 14, c('ink', 0)).rect(14, 36, 12, 2, c('wood', 3));
  micro(coop, 8, 20, 'EGGS', c('paint', 3));
  const cc = cut(coop);
  for (let by = 0; by < 2; by++) for (let bx = 0; bx < 2; bx++) t.air(`coop${bx}${by}`, cc[by][bx]);
  t.air('signEggs', sign(sky(3), 'EGGS 1$'));

  // The barn: red boards outside, dark boards inside, a white X on its doors, a gambrel roof.
  t.air('barnIn', planks(31, 'wood', 1));
  t.wall(
    'barnWall',
    (() => {
      const p = planks(32, 'red', 2);
      for (let x = 0; x < 20; x += 5) p.rect(x, 0, 1, 20, c('red', 0));
      return p;
    })(),
  );
  t.ledge(
    'loft',
    (() => {
      const p = copy(t.pic('barnIn'));
      p.rect(0, 0, 20, 4, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 4, 20, 1, c('ink', 0));
      return p;
    })(),
  );
  const roof = (side: 'L' | 'M' | 'R', k: number) => {
    const p = sky(k);
    for (let y = 0; y < 20; y++) {
      const x0 = side === 'L' ? 19 - y : 0;
      const x1 = side === 'R' ? y + 1 : 20;
      for (let x = Math.max(0, x0); x < Math.min(20, x1); x++) p.set(x, y, y % 4 === 3 ? c('roof', 0) : c('roof', 2));
    }
    return p;
  };
  t.air('roofL', roof('L', 0));
  t.air('roof', roof('M', 0));
  t.air('roofR', roof('R', 0));
  t.air(
    'hay',
    (() => {
      const p = copy(t.pic('barnIn'));
      blob(p, 10, 15, 11, 7, r('hay'), 1, 3);
      return p;
    })(),
  );
  t.air(
    'loftDoor',
    (() => {
      const p = copy(t.pic('barnWall'));
      p.rect(3, 2, 14, 18, c('ink', 0)).rect(3, 2, 14, 2, c('paint', 3));
      return p;
    })(),
  );
  // the cow in her stall, chewing (2x2)
  const cow = canvas(2, 2, () => t.pic('barnIn'));
  blob(cow, 18, 26, 14, 8, [c('paint', 2), c('paint', 3)], 0, 1);
  blob(cow, 12, 24, 4, 3, [c('ink', 0)], 0, 0);
  blob(cow, 24, 29, 5, 3, [c('ink', 0)], 0, 0);
  blob(cow, 32, 20, 6, 5, [c('paint', 2), c('paint', 3)], 0, 1);
  cow.rect(34, 14, 2, 3, c('stone', 2)).rect(30, 14, 2, 3, c('stone', 2));
  cow.rect(35, 21, 2, 2, c('ink', 0)).rect(36, 24, 4, 2, c('pink', 2));
  for (const x of [8, 14, 22, 28]) cow.rect(x, 33, 3, 7, c('paint', 2));
  cow.rect(0, 30, 40, 2, c('wood', 3));
  const kc = cut(cow);
  for (let by = 0; by < 2; by++) for (let bx = 0; bx < 2; bx++) t.air(`cow${bx}${by}`, kc[by][bx]);
  // The hay elevator: a belt that carries her up and to the right, to the loft.
  for (const ph of [0, 1])
    t.air(
      `belt${ph}`,
      (() => {
        const p = copy(t.pic('barnIn'));
        for (let k = 0; k < 20; k++) p.set(k, 19 - k, c('metal', 2)).set(k, 18 - k, c('ink', 1));
        for (let k = ph * 3; k < 20; k += 6) p.rect(k, 16 - k, 2, 2, c('hay', 3));
        return p;
      })(),
      { grav: GRAV.up | GRAV.right, next: `belt${1 - ph}`, ntime: 3 },
    );
  for (const ph of [0, 1])
    t.air(`beltAir${ph}`, copy(t.pic('barnIn')), { grav: GRAV.up | GRAV.right, next: `beltAir${1 - ph}`, ntime: 3 });

  // The pig wallow: mud that holds you up like water.
  for (const ph of [0, 1]) {
    const mud = (surface: boolean) => {
      const p = water(surface, ph, surface ? sky(3) : undefined);
      p.map((_x, _y, v) => (v === c('water', 1) ? c('mud', 1) : v === c('water', 2) ? c('mud', 0) : v === c('water', 3) ? c('mud', 2) : v));
      return p;
    };
    t.air(`mud${ph}`, mud(true), { next: `mud${1 - ph}`, ntime: 12 });
    t.air(`mudDeep${ph}`, mud(false), { grav: GRAV.up, next: `mudDeep${1 - ph}`, ntime: 12 });
  }

  // The pumpkin patch and the scarecrow.
  t.air(
    'pumpkin',
    (() => {
      const p = tuft(sky(3), 44);
      blob(p, 10, 15, 7, 5, r('yellow'), 0, 2);
      p.rect(9, 9, 2, 3, c('green', 1));
      return p;
    })(),
  );
  const crow = canvas(1, 2, (_bx, by) => sky(bandRow(38 + by)));
  crow.rect(9, 10, 2, 30, c('wood', 1)).rect(1, 18, 18, 2, c('wood', 1));
  crow.rect(4, 18, 12, 12, c('blue', 1)).rect(6, 30, 8, 4, c('blue', 0));
  blob(crow, 10, 12, 4, 4, r('hay'), 2, 3);
  crow.rect(5, 6, 10, 2, c('wood', 0)).rect(7, 3, 6, 3, c('wood', 0));
  crow.set(8, 12, c('ink', 0)).set(12, 12, c('ink', 0));
  for (const x of [2, 17]) crow.rect(x, 20, 1, 4, c('hay', 3));
  const sc = cut(crow);
  t.air('scareTop', sc[0][0]);
  t.air('scareBot', sc[1][0]);

  // The farm stand (corn dogs!), the road, the Fair's ride truck with a Ferris wheel car.
  const stand = canvas(2, 2, (_bx, by) => sky(bandRow(38 + by)));
  stand.rect(0, 6, 40, 4, c('red', 2)).rect(0, 6, 40, 1, c('red', 3));
  for (let x = 0; x < 40; x += 8) stand.rect(x, 6, 4, 4, c('paint', 3));
  stand.rect(2, 10, 2, 30, c('wood', 1)).rect(36, 10, 2, 30, c('wood', 1));
  stand.rect(0, 26, 40, 14, c('wood', 2)).rect(0, 26, 40, 2, c('wood', 4));
  micro(stand, 4, 30, 'CORN DOGS', c('yellow', 3));
  const stc = cut(stand);
  for (let by = 0; by < 2; by++) for (let bx = 0; bx < 2; bx++) t.air(`stand${bx}${by}`, stc[by][bx]);
  t.wall(
    'road',
    (() => {
      const p = new Pixels(20, 20);
      speckle(p, 0, 0, 20, 20, r('asphalt'), 1, 1, 51, 0.3);
      return p;
    })(),
  );
  // the flatbed (a ledge to stand on) and the cab
  t.ledge(
    'flatbed',
    (() => {
      const p = sky(3);
      p.rect(0, 2, 20, 6, c('metal', 1)).rect(0, 2, 20, 1, c('metal', 3));
      p.disc(10, 15, 5, c('ink', 0));
      p.ring(10, 15, 2, c('metal', 3));
      return p;
    })(),
  );
  const cab = canvas(2, 2, (_bx, by) => sky(bandRow(38 + by)));
  cab.rect(0, 14, 34, 20, c('blue', 2)).rect(0, 14, 24, 2, c('blue', 3)).rect(2, 17, 18, 9, c('sky', 6));
  cab.rect(34, 26, 4, 6, c('ink', 1));
  cab.disc(16, 34, 6, c('ink', 0)).ring(16, 34, 2, c('metal', 3));
  micro(cab, 2, 28, 'FAIR', c('paint', 3));
  const cbc = cut(cab);
  for (let by = 0; by < 2; by++) for (let bx = 0; bx < 2; bx++) t.air(`cab${bx}${by}`, cbc[by][bx]);
  // the Ferris wheel car riding on the flatbed: hop in (the way out)
  const car = canvas(2, 2, (_bx, by) => sky(bandRow(37 + by)));
  car.rect(18, 0, 4, 8, c('metal', 2));
  car.rect(4, 8, 32, 4, c('red', 2));
  for (let y = 12; y < 36; y++) car.rect(6 + Math.floor((y - 12) / 6), y, 28 - 2 * Math.floor((y - 12) / 6), 1, y < 22 ? c('sky', 5) : c('yellow', 2));
  car.rect(4, 22, 32, 2, c('red', 1));
  const crc = cut(car);
  t.air('carL0', crc[0][0]);
  t.air('carR0', crc[0][1]);
  t.air('gondola', crc[1][0]);
  t.air('carR1', crc[1][1]);
  t.wall(
    'silo',
    (() => {
      const p = new Pixels(20, 20, c('metal', 2));
      for (let x = 0; x < 20; x += 4) p.rect(x, 0, 1, 20, c('metal', 1));
      p.rect(0, 9, 20, 1, c('metal', 3));
      return p;
    })(),
  );
  return t;
}
