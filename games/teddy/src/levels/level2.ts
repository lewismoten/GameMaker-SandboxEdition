// Level 2: Maple Street, late morning. Sidewalk, porches, sprinklers that come and go,
// a cat who will not move until somebody barks, kids who want a high five, a yard sale
// with boxes floating on balloons, and Doc Leo's bow tie up on a porch roof.
//
// The blocks are in level2Tiles.ts, the monsters in level2Beasts.ts; this file lays out the map.
import { rng } from '../../../kit/pixels';
import { over } from '../art/draw';
import { LevelMap, type Level } from './level';
import { bandOf } from './level1Tiles';
import { cut } from '../blocks/tiles';
import { G, streetTiles } from './level2Tiles';
import { streetBeasts } from './level2Beasts';

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
  // The Dog House: a tiny little library on the lawn out front.
  m.set(14, 37, 'libRoofL').set(15, 37, 'libRoofR');
  m.set(14, 38, 'libBooks').set(15, 38, 'libDrawer');
  m.set(14, 39, 'libRocksL').set(15, 39, 'libRocksR');
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
  // Lawn sprinkler B, with Gwinn playing in it.
  m.set(48, 38, 'sprayBhOff').set(49, 38, 'sprayBhOff').set(50, 38, 'sprayBhOff').set(51, 38, 'sprayBhOff');
  m.set(48, 39, 'sprayBlOff').set(49, 39, 'sprayBlOff').set(50, 39, 'sprayBheadOff').set(51, 39, 'sprayBlOff');
  m.mon(47, 39, 'gwinnSplash');
  // Gwinn's mess: the recycling bins.
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
  // Inside the Dog House, kept deep under the street where nothing else goes: a high five
  // from the rock cubby reaches the roof over the red door, the scene's way in.
  const [rx, ry] = [40, 62];
  m.rect(rx - 12, ry - 8, 40, 25, 'dhWall');
  m.rect(rx, ry, 16, 8, 'dhBack');
  m.rect(rx, ry + 8, 16, 1, 'dhFloor');
  m.set(rx, ry + 6, 'dhBook0T').set(rx, ry + 7, 'dhBook0B');
  m.set(rx + 1, ry + 6, 'dhBook1T').set(rx + 1, ry + 7, 'dhBook1B');
  m.set(rx + 3, ry + 6, 'dhBook2T').set(rx + 3, ry + 7, 'dhBook2B');
  m.set(rx + 5, ry + 7, 'dhPageL').set(rx + 6, ry + 7, 'dhPageR');
  m.rect(rx + 8, ry + 5, 4, 1, 'dhShelf');
  m.set(rx + 8, ry + 3, 'dhBook3T').set(rx + 8, ry + 4, 'dhBook3B');
  m.set(rx + 9, ry + 3, 'dhBook1T').set(rx + 9, ry + 4, 'dhBook1B');
  m.set(rx + 10, ry + 4, 'keepsake');
  m.set(rx + 11, ry + 3, 'dhBook2T').set(rx + 11, ry + 4, 'dhBook2B');
  m.set(rx + 15, ry + 6, 'dhDoorT').set(rx + 15, ry + 7, 'dhDoorB');
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
    nook: { door: { x: 15, y: 37 }, room: { x: rx + 2, y: ry + 7 }, out: { x: rx + 15, y: ry + 7 }, back: { x: 16, y: 39 }, title: 'The Dog House', card: 'doghouse.lst' },
  };
}
