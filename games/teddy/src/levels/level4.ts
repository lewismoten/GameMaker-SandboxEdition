// Level 4: Downtown at sunset. Pigeons on the awnings, a subway steam vent that blows
// Teddy up to the fire escape where Doc Leo's horn landed, Biggles Department Store
// (spin the revolving doors to get through; Gwin is inside, in the shoe department), a
// sidewalk shed where Juggles the busker's pins come flying (play dead!), the plaza, a
// fruit stand Gwin already knocked over, and the Odeon, where the Klown Car waits.
//
// The blocks are in level4Tiles.ts, the monsters in level4Beasts.ts; this file lays out the map.
import { rng } from '../../../kit/pixels';
import { blob } from '../art/draw';
import { LevelMap, type Level } from './level';
import { bandOf } from './level1';
import { G, cityTiles } from './level4Tiles';
import { cityBeasts } from './level4Beasts';

export function city(): Level {
  const bs = cityTiles();
  const beasts = cityBeasts();
  const jb = bs.def('jugBot');
  jb.birthMon = beasts.id('pin');
  jb.birthTime = 44;
  const pb = bs.def('prestoBot');
  pb.birthMon = beasts.id('dove');
  pb.birthTime = 36;
  const m = new LevelMap(bs, beasts, 'sky0');
  const R = rng(17);
  const pick = (...names: string[]) => names[Math.floor(R() * names.length)];
  m.rect(0, 0, 100, G, (_x, y) => `sky${bandOf(y)}`);
  m.rect(0, 32, 100, 1, () => pick('skylineTop', 'skylineTop2'));
  m.rect(0, 33, 100, 7, () => pick('skyline', 'skyline2'));
  m.rect(0, G, 100, 1, () => pick('walk', 'walk2'));
  m.rect(0, G + 1, 100, 1, 'road');
  m.rect(0, G + 2, 100, 1, (x) => (x % 3 ? 'road' : 'roadLine'));
  m.rect(0, G + 3, 100, 100 - G - 3, 'deep');

  /** A building face behind the sidewalk, rows top..39. */
  const building = (x0: number, w: number, top: number) => {
    m.rect(x0, top, w, 40 - top, 'brick');
    for (let y = top + 1; y < 36; y += 2) for (let x = x0 + 1; x < x0 + w - 1; x += 2) m.set(x, y, R() < 0.6 ? 'brickWin' : 'brickDark');
  };
  // the ends of the street (the map wraps)
  m.rect(0, 22, 4, 18, 'bldg');
  m.rect(86, 22, 14, 18, 'bldg');
  for (let y = 23; y < 38; y += 3) {
    m.set(2, y, 'bldgWin');
    m.set(90, y, 'bldgWin').set(95, y, 'bldgWin');
  }

  // Shops with awnings; pigeons.
  building(5, 11, 30);
  m.set(6, 38, 'shopWin').set(6, 39, 'shopWin').set(7, 39, 'shopDoor').set(8, 38, 'shopWin2').set(8, 39, 'shopWin2');
  m.set(11, 38, 'shopWin').set(11, 39, 'shopWin').set(12, 39, 'shopDoor').set(13, 38, 'shopWin2').set(13, 39, 'shopWin2');
  m.rect(6, 36, 3, 1, 'awnRed');
  m.rect(11, 36, 4, 1, 'awnBlue');
  m.mon(9, 39, 'pigeon');
  m.mon(12, 35, 'pigeon');

  // The subway steam vent and the fire escape with the horn.
  building(16, 8, 26);
  m.set(16, 38, 'subway').set(16, 39, 'subwayRail');
  for (const x of [17, 18]) {
    m.set(x, G, 'grate');
    for (let y = 30; y < 40; y++) m.set(x, y, 'steamB_0');
  }
  m.rect(19, 31, 4, 1, 'fireEscape');
  m.rect(19, 30, 4, 1, 'railing');
  m.set(21, 30, 'horn');
  m.rect(19, 34, 4, 1, 'fireEscape');

  // Biggles Department Store: solid, tall, and the only way on is through it.
  const s0 = 24;
  const s1 = 38;
  m.rect(s0, 22, s1 - s0 + 1, 14, 'store');
  for (let y = 24; y < 35; y += 3) for (let x = s0 + 1; x < s1; x += 2) m.set(x, y, 'storeWin');
  m.rect(s0, 22, s1 - s0 + 1, 1, 'storeTop');
  for (let i = 0; i < 4; i++) m.set(s0 + 5 + i, 35, `storeSign${i}`);
  m.rect(s0, 36, 1, 3, 'store');
  m.rect(s1, 36, 1, 3, 'store');
  m.rect(s0 + 1, 36, s1 - s0 - 1, 4, 'lobby');
  for (let x = s0 + 3; x < s1; x += 4) m.set(x, 36, 'lobbyLamp');
  m.rect(s0 + 1, 36, s1 - s0 - 1, 1, 'store');
  for (let x = s0 + 3; x < s1; x += 4) m.set(x, 37, 'lobbyLamp');
  m.rect(s0, G, s1 - s0 + 1, 1, 'floor');
  m.set(s0, 39, 'doorway').set(s1, 39, 'doorway');
  m.mon(s0, 39, 'revolve');
  m.mon(s1, 39, 'revolve');
  m.set(s0 + 4, 39, 'counter').set(s0 + 9, 39, 'counter');
  m.set(s0 + 6, 39, 'shoes')
    .set(s0 + 7, 39, 'shoes')
    .set(s0 + 11, 39, 'shoes');
  m.mon(s0 + 5, 39, 'gwinStore');

  // The construction site: the sidewalk shed, and Juggles at the far end.
  const c0 = 40;
  const c1 = 48;
  m.rect(c0, 24, c1 - c0 + 1, 14, 'plywood');
  m.set(c0 + 2, 34, 'plywoodSign').set(c0 + 6, 34, 'plywoodSign');
  m.rect(c0, 38, c1 - c0 + 1, 1, 'shedRoof');
  m.rect(c0, 39, c1 - c0 + 1, 1, 'shed');
  building(49, 4, 30);
  m.set(50, 38, 'jugTop').set(50, 39, 'jugBot');

  // The plaza: a steam vent up to the billboard, the hot dog cart, a kid.
  for (let y = 30; y < 40; y++) m.set(55, y, y >= 33 ? 'steamS_0' : `steam${Math.max(1, bandOf(y))}_0`);
  m.set(55, G, 'grate');
  m.rect(56, 31, 3, 1, 'billboard');
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) m.set(56 + x, 28 + y, `bb${x}${y}`);
  m.set(58, 39, 'cart').set(58, 38, 'umbrella');
  m.set(60, 38, 'prestoTop').set(60, 39, 'prestoBot');
  m.set(61, 39, 'bench').set(61, 38, 'kidPlaza');
  m.mon(62, 37, 'askSit');
  m.mon(53, 39, 'pigeon');

  // The fruit stand Gwin knocked over, and Gwin still chasing pigeons.
  m.set(64, 39, 'fruitCrate').set(65, 39, 'apples').set(66, 39, 'apples').set(68, 39, 'fruitCrate').set(68, 38, 'fruitCrate');
  m.mon(69, 39, 'gwinPigeons');

  // The Odeon.
  building(71, 13, 28);
  ['BIG', 'SHOW', 'TO-', 'NIGHT'].forEach((_, i) => m.set(73 + i, 34, `marqueeWord${i}`));
  m.set(72, 34, 'marquee_0').set(77, 34, 'marquee_0');
  m.set(73, 37, 'poster').set(75, 37, 'poster');
  const car = 80;
  m.set(car - 2, 37, 'pocketsWant')
    .set(car - 2, 38, 'pocketsHead')
    .set(car - 2, 39, 'pocketsBody');
  m.set(car, 38, 'carRoofL')
    .set(car + 1, 38, 'carRoofR')
    .set(car, 39, 'carDoor')
    .set(car + 1, 39, 'carBack');

  // The parade marching down the street, two blocks tall, in the near lanes.
  [6, 10, 14, 56, 60, 64].forEach((x, i) => {
    const kind = ['drum', 'banner', 'balloons'][i % 3];
    m.mon(x, G + 1, `${kind}T`).mon(x, G + 2, `${kind}B`);
  });

  const treats: [number, number][] = [
    [6, 39],
    [7, 35],
    [8, 35],
    [12, 35],
    [13, 35],
    [15, 39],
    [20, 30],
    [22, 30],
    [20, 33],
    [21, 33],
    [s0 - 1, 39],
    [s0 + 2, 39],
    [s0 + 3, 39],
    [s0 + 8, 39],
    [s0 + 9, 38],
    [s0 + 12, 39],
    [s0 + 13, 39],
    [c0 + 2, 39],
    [c0 + 4, 39],
    [c0 + 6, 39],
    [52, 39],
    [56, 30],
    [57, 30],
    [58, 30],
    [59, 39],
    [63, 39],
    [67, 39],
    [70, 39],
    [72, 39],
    [74, 39],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  // Doc Leo's balloon dogs, floated loose from the suitcase: up high, worth a detour.
  for (const [x, y] of [
    [13, 35],
    [22, 30],
    [58, 30],
  ])
    m.mon(x, y, 'poodle');
  m.mon(66, G, 'buried');
  m.mark('start', 4, 39);
  m.mark('exit', car, 39);
  void blob;
  return {
    file: 'city',
    title: 'Downtown',
    time: 'sunset',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [36, 35],
    pose: [42, 39, 'dead'],
  };
}
