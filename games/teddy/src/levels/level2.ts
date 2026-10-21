// Level 2: Maple Street, late morning. Sidewalk, porches, sprinklers that come and go,
// a cat who will not move until somebody barks, kids who want a high five, a yard sale
// with boxes floating on balloons, and Doc Leo's bow tie up on a porch roof.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, micro, over, speckle } from '../art/draw';
import { CRITTERS } from '../sprites/critters';
import { FLIP } from '../characters/mons';
import { POWER } from '../ids';
import { GRAV, LevelMap, Tiles, newBestiary, type Level } from './level';
import { balloonBox, balloonProp, crate, hand, kid, mailCarrier, mailTruck } from '../sprites/folks';
import { propSprite } from '../sprites/klown';
import { CTR } from '../ids';
import { bandOf, sign } from './level1';
import { bricks, c, canvas, cloud, copy, cut, dirt, hedge, leaves, picket, r, siding, sky, trunk, tuft, windowOn } from '../blocks/tiles';

const G = 40;

/** Concrete sidewalk slabs. */
function sidewalk(seed: number): Pixels {
  const p = new Pixels(20, 20);
  speckle(p, 0, 0, 20, 20, r('stone'), 3, 1, seed, 0.2);
  p.rect(0, 0, 20, 2, c('stone', 4)).rect(0, 2, 20, 1, c('stone', 2));
  p.rect(seed % 2 ? 19 : 9, 0, 1, 20, c('stone', 1));
  p.rect(0, 16, 20, 4, c('stone', 2)).rect(0, 16, 20, 1, c('stone', 4));
  return p;
}

function road(dashes: boolean, seed: number): Pixels {
  const p = new Pixels(20, 20);
  speckle(p, 0, 0, 20, 20, r('asphalt'), 1, 1, seed, 0.3);
  if (dashes) p.rect(2, 9, 12, 2, c('yellow', 3));
  return p;
}

/** House walls in four colors; windows; a door; the roof; porch parts. */
function wallOf(color: string): Pixels {
  return color === 'brick' ? bricks(5) : siding(color);
}

export function streetTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  for (let k = 0; k < 2; k++) for (let part = 0; part < 3; part++) t.air(`cloud${k}${part}`, cloud(k, part, k * 5 + 2));
  t.wall('walk', sidewalk(1));
  t.wall('walk2', sidewalk(2));
  t.wall('road', road(false, 3));
  t.wall('roadLine', road(true, 4));
  t.wall('deep', dirt(5, true));
  t.wall(
    'bed',
    (() => {
      const p = dirt(6);
      p.rect(0, 0, 20, 3, c('dirt', 4));
      return p;
    })(),
  );
  t.air('hedgeTop', hedge(true, 21));
  t.air('hedge', hedge(false, 23));
  t.wall('hedgeWall', hedge(false, 25));
  t.air('lawn', tuft(new Pixels(20, 20, c('grass', 2)), 31));
  t.air(
    'arch',
    (() => {
      const p = hedge(false, 26);
      p.rect(2, 4, 16, 16, c('leaf', 0));
      blob(p, 10, 6, 8, 5, [c('leaf', 0)], 0, 0);
      return tuft(p, 34);
    })(),
  );
  t.air('lawnFence', picket(tuft(new Pixels(20, 20, c('grass', 2)), 32), true));
  t.air('lawnFlower', tuft(new Pixels(20, 20, c('grass', 2)), 33, 'pink'));

  // Houses: walls and windows per color; shared roof, door and porch pieces.
  const colors = ['siding', 'paint', 'brick', 'yellow'];
  for (const col of colors) {
    t.air(`wall_${col}`, wallOf(col));
    t.air(`win_${col}`, windowOn(wallOf(col), false, col === 'yellow' ? 'blue' : 'red'));
    const post = copy(wallOf(col));
    post.rect(8, 0, 4, 20, c('paint', 3)).rect(8, 0, 1, 20, c('paint', 1));
    t.air(`post_${col}`, post);
    const door = canvas(1, 2, () => wallOf(col));
    door.rect(3, 4, 14, 36, c('red', 1)).frame(3, 4, 14, 36, c('ink', 0));
    door.rect(6, 8, 8, 8, c('sky', 6)).rect(13, 24, 2, 2, c('gold', 2));
    t.air(`doorTop_${col}`, door.crop(0, 0, 20, 20));
    t.air(`doorBot_${col}`, door.crop(0, 20, 20, 20));
  }
  const roofRow = (left: boolean, right: boolean, eave: boolean) => {
    const p = sky(1);
    for (let y = 0; y < 20; y++) {
      const inset = eave ? 0 : Math.max(0, 19 - y);
      const x0 = left ? inset : 0;
      const x1 = right ? 20 - inset : 20;
      for (let x = x0; x < x1; x++) p.set(x, y, (y + (x >> 2)) % 5 === 4 ? c('roof', 0) : c('roof', y < 2 ? 3 : 2));
    }
    if (eave) p.rect(0, 16, 20, 4, c('paint', 2)).rect(0, 16, 20, 1, c('paint', 3));
    return p;
  };
  t.air('roofL', roofRow(true, false, false));
  t.air('roof', roofRow(false, false, false));
  t.air('roofR', roofRow(false, true, false));
  t.air('eave', roofRow(false, false, true));
  // the porch roof is an awning you can stand on; the porch floor is a step
  t.ledge(
    'awning',
    (() => {
      const p = sky(2);
      for (let x = 0; x < 20; x++) p.rect(x, 0, 1, 10, (x >> 2) % 2 ? c('paint', 3) : c('green', 1));
      p.rect(0, 10, 20, 2, c('green', 0));
      for (let x = 0; x < 20; x += 4) blob(p, x + 2, 11, 2, 2, (x >> 2) % 2 ? [c('paint', 2), c('paint', 3)] : [c('green', 0), c('green', 1)], 0, 1);
      return p;
    })(),
  );
  t.wall(
    'porch',
    (() => {
      const p = new Pixels(20, 20, c('wood', 2));
      for (let y = 0; y < 20; y += 5) p.rect(0, y, 20, 1, c('wood', 0));
      p.rect(0, 0, 20, 3, c('wood', 4));
      return p;
    })(),
  );

  // Sprinklers: the lawn and hedge blocks over them spray for a while, then rest. The
  // spray doesn't hurt; it blasts Teddy back the way he came (gravity to the left).
  const spray = (base: Pixels, on: boolean, seed: number, head: boolean) => {
    const p = copy(base);
    if (head) p.rect(8, 16, 4, 4, c('metal', 2)).rect(9, 14, 2, 2, c('metal', 4));
    if (on) {
      const R = rng(seed);
      for (let i = 0; i < 40; i++) {
        const x = Math.floor(R() * 20);
        const y = Math.floor(R() * 20);
        p.set(x, y, c('water', 3)).set(x, y + 1, c('water', 2));
      }
    }
    return p;
  };
  const lawn = t.pic('lawn');
  const hedgeP = t.pic('hedge');
  for (const ph of ['A', 'B']) {
    const offFor = ph === 'A' ? 40 : 30;
    const onFor = ph === 'A' ? 26 : 30;
    t.air(`spray${ph}hOff`, spray(hedgeP, false, 1, false), { next: `spray${ph}hOn`, ntime: offFor });
    t.air(`spray${ph}hOn`, spray(hedgeP, true, 2, false), { next: `spray${ph}hOff`, ntime: onFor, grav: GRAV.down | GRAV.left });
    t.air(`spray${ph}lOff`, spray(lawn, false, 3, false), { next: `spray${ph}lOn`, ntime: offFor });
    t.air(`spray${ph}lOn`, spray(lawn, true, 4, false), { next: `spray${ph}lOff`, ntime: onFor, grav: GRAV.down | GRAV.left });
    t.air(`spray${ph}headOff`, spray(lawn, false, 5, true), { next: `spray${ph}headOn`, ntime: offFor });
    t.air(`spray${ph}headOn`, spray(lawn, true, 6, true), { next: `spray${ph}headOff`, ntime: onFor, grav: GRAV.down | GRAV.left });
  }

  // Street furniture.
  t.wall(
    'hydrant',
    (() => {
      const p = copy(lawn);
      p.rect(6, 6, 8, 14, c('red', 2)).rect(5, 4, 10, 3, c('red', 3)).rect(8, 2, 4, 2, c('red', 3)).rect(3, 10, 14, 3, c('red', 1));
      p.rect(7, 7, 2, 12, c('red', 3));
      return p;
    })(),
  );
  t.wall(
    'table',
    (() => {
      const p = copy(lawn);
      p.rect(0, 3, 20, 3, c('wood', 4)).rect(0, 6, 20, 1, c('wood', 1));
      p.rect(2, 7, 2, 13, c('wood', 1)).rect(16, 7, 2, 13, c('wood', 1));
      p.rect(3, 0, 5, 3, c('blue', 2)).rect(11, 1, 6, 2, c('yellow', 2)).rect(13, 0, 2, 1, c('red', 2));
      return p;
    })(),
  );
  t.air('saleSign', sign(lawn, 'SALE'));
  t.air(
    'busSign',
    (() => {
      const p = copy(lawn);
      p.rect(9, 4, 2, 16, c('metal', 2));
      p.rect(3, 0, 14, 8, c('blue', 2)).frame(3, 0, 14, 8, c('paint', 3));
      micro(p, 5, 2, 'BUS', c('paint', 3));
      return p;
    })(),
  );
  t.wall(
    'bench',
    (() => {
      const p = copy(lawn);
      p.rect(0, 2, 20, 3, c('green', 1)).rect(0, 7, 20, 3, c('green', 1)).rect(0, 2, 20, 1, c('green', 2));
      p.rect(2, 10, 2, 10, c('metal', 1)).rect(16, 10, 2, 10, c('metal', 1));
      return p;
    })(),
  );
  t.air(
    'mailbox',
    (() => {
      const p = copy(lawn);
      p.rect(9, 9, 2, 11, c('wood', 1));
      blob(p, 10, 6, 6, 4, r('blue'), 0, 3);
      p.rect(4, 6, 12, 4, c('blue', 2));
      p.rect(15, 2, 1, 5, c('red', 2)).rect(15, 2, 3, 2, c('red', 2));
      return p;
    })(),
  );
  const bin = (tipped: boolean) => {
    const p = copy(lawn);
    if (tipped) {
      p.rect(0, 9, 17, 11, c('blue', 2)).rect(17, 8, 3, 12, c('blue', 1));
      for (let x = 2; x < 17; x += 4) p.rect(x, 9, 1, 11, c('blue', 1));
      p.rect(13, 16, 7, 4, c('paint', 3)).rect(16, 14, 3, 2, c('green', 2));
    } else {
      p.rect(3, 4, 14, 16, c('blue', 2)).rect(2, 2, 16, 3, c('blue', 3));
      for (let x = 5; x < 17; x += 4) p.rect(x, 5, 1, 15, c('blue', 1));
    }
    return p;
  };
  t.wall('bin', bin(false));
  t.wall('binTipped', bin(true));
  t.air(
    'litter',
    (() => {
      const p = copy(lawn);
      p.rect(2, 16, 5, 4, c('paint', 3)).rect(10, 17, 4, 3, c('green', 2)).rect(15, 15, 3, 5, c('paint', 2));
      micro(p, 3, 16, 'N', c('ink', 1));
      return p;
    })(),
  );

  // A maple tree (Maple Street, after all).
  for (let k = 0; k < 4; k++) t.air(`leaf${k}`, leaves(80 + k, sky(k)));
  t.air('trunk', trunk(t.pic('hedge')));
  t.air('trunkLawn', trunk(lawn));
  t.air('trunkTop', trunk(leaves(85, sky(2))));

  // Kids on the porches (their hands are monsters), the mail carrier.
  t.on('kidBoy', kid('boy'), 'wall_brick');
  t.on('kidGirl', kid('girl'), 'wall_siding');
  t.on('kidGirl2', kid('girl'), 'wall_yellow');
  const mc = mailCarrier();
  t.on('mailTop', mc.crop(0, 0, 20, 20), 'hedge');
  t.on('mailBot', mc.crop(0, 20, 20, 20), 'lawn');

  t.klownCar(
    (_bx, by) => (by === 0 ? t.pic('hedge') : t.pic('lawn')),
    'tie',
    t.pic('hedgeTop'),
    (by) => (by === 0 ? t.pic('hedge') : t.pic('lawn')),
  );
  return t;
}

export function streetBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS)) if (name.startsWith('cat')) b.pic(name, px, name === 'catRun' ? {} : { solid: 15 });
  b.pic('hand', hand());
  b.pic('balloon1', balloonBox(0));
  b.pic('balloon2', balloonBox(1));
  b.pic('crate', crate(), { solid: 15 });
  b.pic('tieB1', balloonProp(propSprite('tie'), 0)).pic('tieB2', balloonProp(propSprite('tie'), 1));
  b.pic('tie', propSprite('tie'));
  b.pic('tieGot', propSprite('tie'), { effect: CTR.props, eamt: 1, score: 100 });
  const [t0, t1] = mailTruck(0);
  const [u0, u1] = mailTruck(1);
  b.pic('truckB0', t0).pic('truckF0', t1).pic('truckB1', u0).pic('truckF1', u1);
  // A cat loafing on the sidewalk: not moving for anybody... except a dog who barks.
  b.add('cat', {
    pics: [
      ['cat1', 30],
      ['cat2', 4],
    ],
    power: POWER.blocker,
    becomes: 'catRun',
    upscore: 50,
  });
  b.add('catRun', {
    pics: [['catRun', 50]],
    power: 0,
    path: [
      [3, 0, 7],
      [5, -4, 7],
    ],
    end: -1,
  });
  b.add('hand', { pics: [['hand', 50]], power: POWER.balloon, becomes: 'treatFall', upscore: 25 });
  b.add('balloonBox', {
    pics: [
      ['balloon1', 9],
      ['balloon2', 9],
    ],
    power: POWER.balloon,
    becomes: 'crateFall',
    upscore: 25,
  });
  b.add('crateFall', { pics: [['crate', 50]], power: POWER.friend, path: [[0, 1, 4]], end: -1, becomes: 'crate' });
  b.add('crate', { pics: [['crate', 50]], power: POWER.friend, end: -2 });
  // Doc Leo's bow tie, caught on yard-sale balloons under a porch roof: high five them.
  b.add('tieBalloon', {
    pics: [
      ['tieB1', 9],
      ['tieB2', 9],
    ],
    power: POWER.balloon,
    becomes: 'tieFall',
    upscore: 50,
  });
  b.add('tieFall', { pics: [['tie', 50]], power: POWER.pickup + 1, path: [[0, 1, 3]], end: -1, becomes: 'tieGot' });
  b.add('tieGot', { pics: [['tieGot', 50]], power: POWER.pickup + 1 });
  // The mail truck drives right all the way around town (the map wraps).
  b.add('truckBack', {
    pics: [
      ['truckB0', 2],
      ['truckB1', 2],
    ],
    power: POWER.friend + 50,
    path: [[100, 0, 3]],
    end: -2,
  });
  b.add('truckFront', {
    pics: [
      ['truckF0', 2],
      ['truckF1', 2],
    ],
    power: POWER.friend + 50,
    path: [[100, 0, 3]],
    end: -2,
  });
  b.add('gwinSplash', {
    pics: [
      ['gwin1', 3],
      ['gwin2', 3],
      ['gwin3', 3],
      ['gwin2', 3],
    ],
    power: 90,
    path: [
      [4, 0, 4, 0],
      [0, 0, 4, FLIP],
    ],
    becomes: 'gwinGone',
  });
  return b;
}

export function street(): Level {
  const bs = streetTiles();
  const beasts = streetBeasts();
  const m = new LevelMap(bs, beasts, 'sky0');
  const R = rng(11);
  const pick = (...names: string[]) => names[Math.floor(R() * names.length)];
  m.rect(0, 0, 100, G, (_x, y) => `sky${bandOf(y)}`);
  for (const [cx, cy] of [
    [4, 27],
    [21, 30],
    [37, 26],
    [55, 29],
    [70, 27],
    [90, 30],
  ])
    for (let part = 0; part < 3; part++) m.set(cx + part, cy, `cloud${Math.min(1, bandOf(cy))}${part}`);
  m.rect(0, 37, 100, 1, 'hedgeTop');
  m.rect(0, 38, 100, 1, 'hedge');
  m.rect(0, 39, 100, 1, (x) => (x % 7 === 3 ? 'lawnFlower' : x % 2 ? 'lawnFence' : 'lawn'));
  m.rect(0, G, 100, 1, () => pick('walk', 'walk2'));
  m.rect(0, G + 1, 100, 1, 'road');
  m.rect(0, G + 2, 100, 1, (x) => (x % 3 ? 'road' : 'roadLine'));
  m.rect(0, G + 3, 100, 100 - G - 3, 'deep');

  /** A house: facade rows 30..38, roof 28..29, an optional porch (awning at 36, floor at 39). */
  const house = (x0: number, w: number, col: string, porch?: [number, number], door = Math.floor(w / 2)) => {
    m.rect(x0, 30, w, 9, `wall_${col}`);
    for (let x = x0 + 1; x < x0 + w - 1; x += 2) {
      m.set(x, 31, `win_${col}`);
      if (Math.abs(x - (x0 + door)) > 1) m.set(x, 34, `win_${col}`);
    }
    m.set(x0 + door, 37, `doorTop_${col}`).set(x0 + door, 38, `doorBot_${col}`);
    m.set(x0, 28, 'roofL');
    m.rect(x0 + 1, 28, w - 2, 1, 'roof');
    m.set(x0 + w - 1, 28, 'roofR');
    m.rect(x0, 29, w, 1, 'eave');
    if (porch) {
      const [a, b] = porch;
      m.rect(a, 36, b - a + 1, 1, 'awning');
      m.set(a, 37, `post_${col}`).set(a, 38, `post_${col}`).set(b, 37, `post_${col}`).set(b, 38, `post_${col}`);
      m.rect(a, 39, b - a + 1, 1, 'porch');
    }
  };

  m.rect(0, 30, 5, 10, 'hedgeWall');
  m.rect(88, 30, 12, 10, 'hedgeWall');
  m.rect(0, 29, 5, 1, 'hedgeTop');
  m.rect(88, 29, 12, 1, 'hedgeTop');

  // House 1 (blue) with a girl on the porch.
  house(8, 8, 'siding', [10, 13]);
  m.set(11, 38, 'kidGirl');
  m.mon(11, 37, 'hand');
  // Lawn sprinkler A.
  m.set(17, 38, 'sprayAhOff').set(18, 38, 'sprayAhOff').set(19, 38, 'sprayAhOff').set(20, 38, 'sprayAhOff');
  m.set(17, 39, 'sprayAlOff').set(18, 39, 'sprayAheadOff').set(19, 39, 'sprayAlOff').set(20, 39, 'sprayAlOff');
  m.set(22, 39, 'hydrant');

  // House 2 (white): the yard sale, a box on balloons, the bow tie on the porch roof.
  house(24, 10, 'paint', [28, 33], 3);
  m.set(25, 39, 'saleSign');
  m.set(26, 39, 'table').set(27, 39, 'table');
  m.mon(27, 37, 'balloonBox');
  m.mon(32, 37, 'tieBalloon');

  // A tall hedge arch between the houses, and a cat napping right in it.
  m.rect(35, 29, 2, 10, 'hedgeWall');
  m.rect(35, 28, 2, 1, 'hedgeTop');
  m.set(35, 39, 'arch').set(36, 39, 'arch');
  m.mon(36, 39, 'cat');

  // House 3 (brick) with a boy on the porch.
  house(38, 9, 'brick', [40, 43]);
  m.set(41, 38, 'kidBoy');
  m.mon(41, 37, 'hand');
  // Lawn sprinkler B, with Gwin playing in it.
  m.set(48, 38, 'sprayBhOff').set(49, 38, 'sprayBhOff').set(50, 38, 'sprayBhOff').set(51, 38, 'sprayBhOff');
  m.set(48, 39, 'sprayBlOff').set(49, 39, 'sprayBlOff').set(50, 39, 'sprayBheadOff').set(51, 39, 'sprayBlOff');
  m.mon(47, 39, 'gwinSplash');
  // Gwin's mess: the recycling bins.
  m.set(53, 39, 'binTipped').set(54, 39, 'litter').set(56, 39, 'bin').set(57, 39, 'litter').set(58, 39, 'binTipped');

  // The mail carrier, a maple tree and a garden bed with bones buried in it.
  m.set(60, 38, 'mailTop').set(60, 39, 'mailBot').set(61, 39, 'mailbox');
  for (let y = 30; y < 37; y++) for (let x = 62; x < 67; x++) if (Math.abs(x - 64) + Math.abs(y - 32) < 4) m.set(x, y, `leaf${bandOf(y)}`);
  m.set(64, 35, 'trunkTop').set(64, 36, 'trunkTop').set(64, 37, 'trunk').set(64, 38, 'trunk').set(64, 39, 'trunkLawn');
  m.rect(63, G, 4, 1, 'bed');

  // House 4 (yellow) with a girl on the porch.
  house(68, 8, 'yellow', [70, 73]);
  m.set(71, 38, 'kidGirl2');
  m.mon(71, 37, 'hand');

  // The bus stop, Pockets and the Klown Car.
  m.set(77, 39, 'busSign').set(78, 39, 'bench').set(79, 39, 'bench');
  const car = 83;
  m.set(car - 2, 37, 'pocketsWant')
    .set(car - 2, 38, 'pocketsHead')
    .set(car - 2, 39, 'pocketsBody');
  m.set(car, 38, 'carRoofL')
    .set(car + 1, 38, 'carRoofR')
    .set(car, 39, 'carDoor')
    .set(car + 1, 39, 'carBack');

  // The mail truck, forever going around the block.
  m.mon(10, G + 1, 'truckBack').mon(11, G + 1, 'truckFront');
  m.mon(60, G + 1, 'truckBack').mon(61, G + 1, 'truckFront');

  const treats: [number, number][] = [
    [7, 39],
    [9, 39],
    [12, 38],
    [11, 35],
    [12, 35],
    [15, 39],
    [18, 37],
    [19, 37],
    [24, 39],
    [26, 38],
    [27, 38],
    [30, 35],
    [31, 35],
    [34, 39],
    [35, 39],
    [40, 38],
    [42, 38],
    [41, 35],
    [42, 35],
    [45, 39],
    [55, 38],
    [57, 38],
    [62, 39],
    [70, 38],
    [72, 38],
    [71, 35],
    [72, 35],
    [75, 39],
    [78, 38],
    [79, 38],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  // Doc Leo's balloon dogs, floated loose from the suitcase: up high, worth a detour.
  for (const [x, y] of [
    [11, 35],
    [31, 35],
    [72, 35],
  ])
    m.mon(x, y, 'poodle');
  m.mon(64, G, 'buried');
  m.mon(66, G, 'buried');
  m.mark('start', 6, 39);
  m.mark('exit', car, 39);
  void over;
  void cut;
  return {
    file: 'street',
    title: 'Maple Street',
    time: 'noon',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [23, 35],
    pose: [30, 38, 'frontReach'],
  };
}
