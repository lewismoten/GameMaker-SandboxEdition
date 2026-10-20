// Level 1: Doc Leo's Backyard. A morning lesson in hopping, barking, digging and
// fetching: up the garden boxes, along the clothesline, past the squirrel and Gwin's
// garbage-can mess, up the old oak for Doc Leo's hat, and under the back fence.
import { Pixels, rng } from '../kit/pixels';
import { blob, micro } from './draw';
import { CRITTERS } from './critters';
import { FLIP } from './mons';
import { POWER } from './ids';
import { P } from './pal';
import { LevelMap, Tiles, newBestiary, type Level } from './level';
import {
  bricks,
  boxFace,
  branch,
  buried,
  c,
  canvas,
  cloud,
  cut,
  dirt,
  grassTop,
  hedge,
  leaves,
  plankFence,
  r,
  siding,
  sky,
  trunk,
  tuft,
  tunnel,
  windowOn,
} from './tiles';

export const GROUND = 40;

/** Sky band for map row y. */
export const bandOf = (y: number) => (y <= 30 ? 0 : y <= 33 ? 1 : y <= 36 ? 2 : 3);

export function sign(base: Pixels, words: string, arrow?: 'up' | 'down'): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  p.rect(9, 12, 2, 8, c('wood', 1));
  p.rect(0, 1, 20, 12, c('wood', 3)).frame(0, 1, 20, 12, c('wood', 0));
  p.rect(1, 2, 18, 1, c('wood', 4));
  const w = words.length * 4 - 1 + (arrow ? 4 : 0);
  const x = 10 - Math.floor(w / 2);
  micro(p, x, 5, words, c('ink', 0));
  if (arrow) {
    const ax = x + w - 2;
    p.rect(ax, 4, 1, 7, c('red', 2));
    const tip = arrow === 'up' ? 4 : 10;
    const dir = arrow === 'up' ? 1 : -1;
    p.set(ax - 1, tip + dir, c('red', 2))
      .set(ax + 1, tip + dir, c('red', 2))
      .set(ax - 2, tip + 2 * dir, c('red', 2))
      .set(ax + 2, tip + 2 * dir, c('red', 2));
  }
  return p;
}

export function backyardTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) {
    t.air(`sky${k}`, sky(k));
    for (let part = 0; part < 3; part++) t.air(`cloud${k}${part}`, cloud(k, part, k * 3 + 1));
  }
  // The lawn and the ground under it.
  t.wall('grass', grassTop(1));
  t.wall('grass2', grassTop(2));
  t.wall('dirt', dirt(3));
  t.wall('dirt2', dirt(4));
  t.wall('deep', dirt(5, true));
  t.wall('dirtRock', buried('rock', 51));
  t.wall('dirtRoots', buried('roots', 52));
  t.wall('dirtFossil', buried('fossil', 53, true));
  t.wall('dirtBall', buried('ball', 54));
  t.wall('dirtWorm', buried('worm', 55));
  t.air('tuft', tuft(sky(3), 11));
  t.air('tuft2', tuft(sky(3), 12));
  t.air('flowerP', tuft(sky(3), 13, 'pink'));
  t.air('flowerY', tuft(sky(3), 14, 'purple'));
  t.air('tunnel', tunnel(6));
  t.air('tunnel2', tunnel(7));
  t.air('hole', tunnel(8));
  // A hedge across the back of the yard (scenery).
  t.air('hedgeTop', hedge(true, 21));
  t.air('hedgeTop2', hedge(true, 22));
  t.air('hedge', hedge(false, 23));
  t.air('hedge2', hedge(false, 24));
  t.wall('hedgeWall', hedge(false, 25));

  // Doc Leo's house.
  t.wall('house', siding('siding'));
  t.wall('houseWin', windowOn(siding('siding'), false, 'red'));
  t.wall(
    'houseDoor',
    (() => {
      const p = siding('siding');
      p.rect(3, 0, 14, 20, c('wood', 2)).frame(3, 0, 14, 20, c('wood', 0));
      p.rect(13, 10, 2, 2, c('gold', 2));
      return p;
    })(),
  );
  t.wall(
    'houseRoof',
    (() => {
      const p = sky(1);
      for (let y = 0; y < 20; y++) p.rect(0, y, 20 - Math.floor(y / 2) + 10, 1, y % 4 === 3 ? c('roof', 0) : c('roof', 2));
      return p;
    })(),
  );
  t.wall('chimney', bricks(9));

  // Teddy's doghouse: a red roof (stand on it) over a little wall with a door.
  const dog = canvas(2, 2, (bx, by) => (by === 0 ? t.pic('hedge') : tuft(sky(3), 30 + bx)));
  for (let y = 0; y < 20; y++) {
    const half = Math.floor(y * 1.0);
    dog.rect(20 - half - 2, 4 + y, half * 2 + 4, 1, y % 3 === 0 ? c('red', 1) : c('red', 2));
  }
  dog.rect(4, 20, 32, 20, c('wood', 3));
  for (let x = 4; x < 36; x += 5) dog.rect(x, 20, 1, 20, c('wood', 1));
  blob(dog, 20, 32, 7, 9, [c('ink', 0), c('ink', 0), c('ink', 1)], 0, 2, 0.2);
  dog.rect(13, 32, 15, 8, c('ink', 0));
  micro(dog, 11, 21, 'TEDDY', c('paint', 3));
  const [[rl, rr], [wl, wr]] = cut(dog);
  t.ledge('dogRoofL', rl);
  t.ledge('dogRoofR', rr);
  t.air('dogWallL', wl);
  t.air('dogWallR', wr);

  // The vegetable garden: boxes to hop up, tomato plants.
  t.wall('box', boxFace('wood', 3, 40));
  t.wall(
    'boxSoil',
    (() => {
      const p = boxFace('wood', 3, 41);
      p.rect(1, 1, 18, 4, c('dirt', 1));
      return p;
    })(),
  );
  const tomato = (() => {
    const p = new Pixels(20, 20, 255);
    p.rect(9, 2, 2, 18, c('wood', 2));
    for (const [x, y] of [
      [5, 6],
      [14, 9],
      [6, 13],
      [13, 15],
    ])
      blob(p, x, y, 4, 3, r('leaf'), 1, 3);
    for (const [x, y] of [
      [4, 9],
      [15, 12],
      [7, 16],
    ])
      blob(p, x, y, 2.2, 2.2, r('red'), 1, 3);
    return p;
  })();
  t.on('tomatoT', tomato, 'hedgeTop');
  t.on('tomatoH', tomato, 'hedge');

  // The clothesline: poles (scenery), the line (stand on it), laundry below.
  t.air(
    'pole',
    (() => {
      const p = sky(2);
      p.rect(9, 0, 3, 20, c('metal', 2)).rect(9, 0, 1, 20, c('metal', 4));
      return p;
    })(),
  );
  const pole = new Pixels(20, 20, 255).rect(9, 0, 3, 20, c('metal', 2)).rect(9, 0, 1, 20, c('metal', 4));
  t.on('poleT', pole, 'hedgeTop');
  t.on('poleH', pole, 'hedge');
  t.ledge(
    'poleTop',
    (() => {
      const p = sky(2);
      p.rect(9, 2, 3, 18, c('metal', 2)).rect(2, 2, 17, 2, c('metal', 3));
      return p;
    })(),
  );
  t.ledge(
    'line',
    (() => {
      const p = sky(2);
      p.rect(0, 2, 20, 1, c('paint', 1));
      return p;
    })(),
  );
  t.ledge(
    'lineSock',
    (() => {
      const p = sky(2);
      p.rect(0, 2, 20, 1, c('paint', 1));
      p.rect(5, 1, 2, 3, c('wood', 1));
      p.rect(5, 3, 4, 9, c('red', 2)).rect(5, 10, 8, 4, c('red', 2)).rect(5, 6, 4, 2, c('paint', 3));
      p.rect(13, 1, 2, 3, c('wood', 1));
      p.rect(12, 3, 5, 12, c('blue', 2)).rect(12, 3, 5, 2, c('blue', 3));
      return p;
    })(),
  );
  t.air(
    'sheet',
    (() => {
      const p = new Pixels(20, 20);
      p.px.set(t.pic('hedgeTop').px);
      p.rect(0, 0, 20, 14, c('paint', 3));
      for (let x = 0; x < 20; x += 6) p.rect(x, 0, 2, 14, c('pink', 2));
      p.rect(0, 13, 20, 1, c('paint', 1));
      return p;
    })(),
  );
  t.wall(
    'basket',
    (() => {
      const p = sky(3);
      p.rect(1, 6, 18, 14, c('wood', 3));
      for (let y = 6; y < 20; y += 3) p.rect(1, y, 18, 1, c('wood', 1));
      for (let x = 1; x < 19; x += 4) p.rect(x, 6, 1, 14, c('wood', 2));
      p.rect(2, 3, 16, 3, c('paint', 3)).rect(4, 2, 6, 2, c('blue', 3));
      return p;
    })(),
  );

  // Gwin's mess: garbage cans, one standing, two on their sides, trash everywhere.
  const can = (tipped: boolean) => {
    const p = tuft(sky(3), tipped ? 51 : 52);
    if (tipped) {
      p.rect(0, 8, 18, 12, c('metal', 2));
      for (let x = 2; x < 18; x += 4) p.rect(x, 8, 1, 12, c('metal', 1));
      p.rect(0, 8, 18, 1, c('metal', 4));
      p.rect(18, 7, 2, 13, c('metal', 3));
      p.rect(14, 16, 6, 4, c('paint', 2)).set(17, 15, c('yellow', 3)).set(15, 15, c('red', 2));
    } else {
      p.rect(3, 4, 14, 16, c('metal', 2));
      for (let x = 5; x < 17; x += 4) p.rect(x, 4, 1, 16, c('metal', 1));
      p.rect(2, 2, 16, 3, c('metal', 4)).rect(8, 0, 4, 2, c('metal', 3));
    }
    return p;
  };
  t.wall('can', can(false));
  t.wall('canTipped', can(true));
  t.on(
    'canStack',
    (() => {
      const p = can(true);
      const sk = tuft(sky(3), 51);
      return p.map((x, y, v) => (v === sk.get(x, y) ? 255 : v));
    })(),
    'hedge',
    'wall',
  );
  t.air(
    'trash',
    (() => {
      const p = tuft(sky(3), 53);
      p.rect(2, 16, 4, 3, c('paint', 3)).rect(9, 17, 3, 2, c('yellow', 2)).rect(14, 15, 4, 4, c('red', 1)).set(15, 16, c('paint', 3));
      p.line(6, 19, 9, 15, c('wood', 2));
      return p;
    })(),
  );

  // The old oak: trunk, branches to stand on, leaves all around.
  for (let k = 0; k < 4; k++) t.air(`leaf${k}`, leaves(60 + k, sky(k)));
  t.air('leafDark', leaves(65, new Pixels(20, 20, c('leaf', 0))));
  t.air('trunk', trunk(sky(3)));
  t.air('trunkLeaf', trunk(leaves(66, new Pixels(20, 20, c('leaf', 0)))));
  t.air(
    'roots',
    (() => {
      const p = trunk(tuft(sky(3), 67));
      p.rect(2, 16, 16, 4, c('wood', 1)).rect(0, 18, 20, 2, c('wood', 0));
      return p;
    })(),
  );
  for (let k = 1; k < 4; k++) t.ledge(`branch${k}`, branch(leaves(70 + k, sky(k))));
  t.wall(
    'stump',
    (() => {
      const p = tuft(sky(3), 75);
      p.rect(3, 6, 14, 14, c('wood', 2));
      p.rect(3, 6, 14, 3, c('wood', 4)).rect(5, 7, 10, 1, c('wood', 3));
      for (let y = 9; y < 20; y += 3) p.set(4 + (y % 5), y, c('wood', 0));
      return p;
    })(),
  );
  t.prop('hat', 'hat', 'leaf1');

  // The back fence (too tall to hop) and the soft dirt under it.
  t.wall('fence', plankFence(false));
  t.wall('fenceTop', plankFence(true));

  // Hint signs on stakes.
  t.air('signHop', sign(tuft(sky(3), 80), 'HOP', 'up'));
  t.air('signWoof', sign(tuft(sky(3), 81), 'WOOF!'));
  t.air('signDig', sign(tuft(sky(3), 82), 'DIG', 'down'));
  t.air('signFetch', sign(tuft(sky(3), 83), 'F!'));
  t.air('signCar', sign(tuft(sky(3), 84), 'TOWN'));

  // The alley: a gravel lane and the Klown Car.
  t.klownCar(
    (bx, by) => (by === 0 ? t.pic('hedge') : tuft(sky(3), 90 + bx)),
    'hat',
    t.pic('hedgeTop'),
    (by) => (by === 0 ? t.pic('hedge') : tuft(sky(3), 95)),
  );
  return t;
}

export function backyardBeasts() {
  const b = newBestiary();
  for (const [name, px] of Object.entries(CRITTERS)) if (name.startsWith('squirrel')) b.pic(name, px, { hp: -8 });
  b.add('squirrel', {
    pics: [
      ['squirrel1', 3],
      ['squirrel2', 3],
    ],
    power: POWER.pest,
    path: [
      [2, 0, 2, 0],
      [0, 0, 2, FLIP],
    ],
    becomes: 'squirrelRun',
    upscore: 25,
  });
  b.add('squirrelRun', {
    pics: [['squirrelRun', 2]],
    power: 0,
    path: [
      [4, -1, 7],
      [7, -6, 7],
    ],
    end: -1,
  });
  b.add('gwinMess', {
    pics: [
      ['gwin1', 3],
      ['gwin2', 3],
      ['gwin3', 3],
      ['gwin2', 3],
    ],
    power: 90,
    path: [
      [5, 0, 4, 0],
      [5, 0, 1, 0],
      [0, 0, 4, FLIP],
      [0, 0, 1, FLIP],
    ],
    becomes: 'gwinGone',
  });
  return b;
}

export function backyard(): Level {
  const bs = backyardTiles();
  const beasts = backyardBeasts();
  const m = new LevelMap(bs, beasts, 'sky0');
  const R = rng(7);
  const pick = (...names: string[]) => names[Math.floor(R() * names.length)];
  // Sky by bands, a few clouds, the ground, the dirt.
  m.rect(0, 0, 100, GROUND, (_x, y) => `sky${bandOf(y)}`);
  for (const [cx, cy] of [
    [6, 28],
    [19, 31],
    [33, 27],
    [44, 32],
    [62, 29],
    [78, 31],
    [90, 28],
  ])
    for (let part = 0; part < 3; part++) m.set(cx + part, cy, `cloud${bandOf(cy)}${part}`);
  m.rect(0, GROUND, 100, 1, () => pick('grass', 'grass2'));
  m.rect(0, GROUND + 1, 100, 4, () => pick('dirt', 'dirt2', 'dirt', 'dirt2', 'dirt', 'dirt2', 'dirtRock', 'dirtRoots', 'dirtWorm'));
  for (const [x, y, k] of [
    [12, 43, 'dirtFossil'],
    [37, 42, 'dirtBall'],
    [58, 43, 'dirtFossil'],
  ] as [number, number, string][])
    m.set(x, y, k);
  m.rect(0, GROUND + 5, 100, 100 - GROUND - 5, 'deep');
  m.rect(0, 37, 100, 1, () => pick('hedgeTop', 'hedgeTop2'));
  m.rect(0, 38, 100, 1, () => pick('hedge', 'hedge2'));
  m.rect(0, 39, 100, 1, () => pick('tuft', 'tuft', 'tuft2', 'flowerP', 'flowerY'));

  // The house on the left (the map wraps: its far side shows past x = 99).
  const house = (x0: number, w: number) => {
    m.rect(x0, 30, w, 10, 'house');
    m.rect(x0, 29, w, 1, 'houseRoof');
    for (let x = x0 + 1; x < x0 + w; x += 2) {
      m.set(x, 32, 'houseWin');
      m.set(x, 35, 'houseWin');
    }
  };
  house(88, 12);
  house(0, 5);
  m.set(4, 38, 'houseDoor').set(4, 39, 'houseDoor');
  m.set(2, 28, 'chimney');

  // Teddy's doghouse.
  m.set(7, 38, 'dogRoofL').set(8, 38, 'dogRoofR').set(7, 39, 'dogWallL').set(8, 39, 'dogWallR');
  m.set(10, 39, 'signHop');

  // The garden: boxes 1 and 2 high, tomatoes.
  m.set(14, 39, 'boxSoil').set(14, 38, 'tomatoH');
  m.set(16, 39, 'box').set(16, 38, 'boxSoil').set(16, 37, 'tomatoT');
  m.set(18, 39, 'boxSoil');

  // The clothesline: a basket and crate to climb, the line to walk.
  m.set(23, 39, 'basket');
  m.set(24, 39, 'box').set(24, 38, 'box');
  m.rect(25, 36, 7, 1, 'line');
  m.set(27, 36, 'lineSock').set(30, 36, 'lineSock');
  m.set(25, 36, 'poleTop').set(25, 37, 'poleT').set(25, 38, 'poleH');
  m.set(31, 36, 'poleTop').set(31, 37, 'poleT').set(31, 38, 'poleH');
  m.set(28, 37, 'sheet').set(29, 37, 'sheet');

  // The squirrel's stretch, and a hint.
  m.set(34, 39, 'signWoof');

  // Gwin's garbage-can mess.
  m.set(42, 39, 'canTipped').set(44, 39, 'trash').set(46, 39, 'can').set(47, 39, 'trash').set(49, 39, 'canTipped').set(46, 38, 'canStack');

  // The old oak, with Doc Leo's hat in the top branches.
  const oak = 56;
  m.rect(oak - 4, 28, 9, 9, (x, y) => (Math.abs(x - oak) + Math.abs(y - 32) > 6 ? `sky${bandOf(y)}` : `leaf${bandOf(y)}`));
  m.rect(oak - 2, 30, 5, 5, (x, y) => (Math.abs(x - oak) + Math.abs(y - 32) < 3 ? 'leafDark' : `leaf${bandOf(y)}`));
  m.rect(oak, 33, 1, 6, (_x, y) => (y < 37 ? 'trunkLeaf' : 'trunk'));
  m.set(oak, 39, 'roots');
  m.set(oak - 4, 39, 'stump');
  m.set(oak - 5, 39, 'signFetch');
  m.rect(oak - 3, 37, 3, 1, 'branch3');
  m.rect(oak - 1, 35, 3, 1, 'branch2');
  m.rect(oak - 3, 33, 3, 1, 'branch1');
  m.set(oak - 2, 32, 'hat');

  // The back fence: four boards high. Soft dirt at its foot leads under it.
  const fence = 66;
  m.rect(fence, 36, 3, 1, 'fenceTop');
  m.rect(fence, 37, 3, 3, 'fence');
  m.set(fence - 3, 39, 'signDig');
  m.rect(fence - 2, GROUND, 2, 1, 'hole');
  m.rect(fence - 2, GROUND + 1, 8, 1, (x) => (x % 2 ? 'tunnel' : 'tunnel2'));
  m.set(fence + 5, GROUND, 'hole');

  // The alley and the Klown Car.
  m.set(fence + 7, 39, 'signCar');
  const car = fence + 11;
  m.set(car - 2, 37, 'pocketsWant')
    .set(car - 2, 38, 'pocketsHead')
    .set(car - 2, 39, 'pocketsBody');
  m.set(car, 38, 'carRoofL')
    .set(car + 1, 38, 'carRoofR')
    .set(car, 39, 'carDoor')
    .set(car + 1, 39, 'carBack');
  m.rect(car + 3, 30, 5, 10, 'hedgeWall');
  m.rect(car + 3, 29, 5, 1, () => pick('hedgeTop', 'hedgeTop2'));

  // Monsters: treats along the way, buried bones, the squirrel, Gwin, the soft dirt.
  const treats: [number, number][] = [
    [11, 39],
    [12, 39],
    [14, 37],
    [16, 36],
    [18, 38],
    [19, 38],
    [26, 35],
    [27, 35],
    [28, 35],
    [29, 35],
    [30, 35],
    [38, 38],
    [39, 38],
    [53, 36],
    [56, 34],
    [57, 34],
    [53, 32],
    [61, 39],
    [66, 41],
    [68, 41],
    [70, 41],
    [72, 39],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  // Doc Leo's balloon dogs, floated loose from the suitcase: up high, worth a detour.
  for (const [x, y] of [[16, 36], [30, 35], [57, 34]]) m.mon(x, y, 'poodle');
  m.mon(21, GROUND, 'buried');
  m.mon(40, GROUND, 'buried');
  m.mon(61, GROUND, 'buried');
  m.mon(35, 39, 'squirrel');
  m.mon(oak, 34, 'squirrel');
  m.mon(43, 39, 'gwinMess');
  m.mon(fence - 2, GROUND, 'plug');
  m.mon(fence - 1, GROUND, 'plug');
  m.mark('start', 6, 39);
  m.mark('exit', car, 39);
  void P;
  return {
    file: 'backyard',
    title: "Doc Leo's Backyard",
    time: 'morning',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [13, 35],
    pose: [19, 39, 'walk1'],
  };
}
