// Level 1: Doc Leo's Backyard. A morning lesson in hopping, barking, digging and
// fetching: up the garden boxes, along the clothesline, past the squirrel and Gwinn's
// garbage-can mess, up the old oak for Doc Leo's hat, and under the back fence.
//
// The blocks are in level1Tiles.ts, the monsters in level1Beasts.ts; this file lays out the map.
import { rng } from '../../../kit/pixels';
import { P } from '../art/pal';
import { LevelMap, type Level } from './level';
import { GROUND, backyardTiles, bandOf } from './level1Tiles';
import { backyardBeasts } from './level1Beasts';

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

  // Gwinn's garbage-can mess.
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

  // Monsters: treats along the way, buried bones, the squirrel, Gwinn with Teddy's wobble
  // ball, the soft dirt.
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
  for (const [x, y] of [
    [16, 36],
    [30, 35],
    [57, 34],
  ])
    m.mon(x, y, 'poodle');
  m.mon(21, GROUND, 'buried');
  m.mon(40, GROUND, 'buried');
  m.mon(61, GROUND, 'buried');
  m.mon(35, 39, 'squirrel');
  m.mon(oak, 34, 'squirrel');
  m.mon(41, 39, 'gwinnBall');
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
