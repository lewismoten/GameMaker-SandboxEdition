// Level 3: Puddlewick Park, in the afternoon. A hill with a squirrel tree, a sandbox to
// dig through, a fountain whose jet lifts Teddy over the tall hedge, kids who give out
// treats (and Doc Leo's shoes) for a good sit, geese guarding the covered bridge over the
// duck pond, flying discs, and Gwinn rolling in the mud by the picnic tables.
//
// The blocks are in level3Tiles.ts, the monsters in level3Beasts.ts; this file lays out the map.
import { rng } from '../../../kit/pixels';
import { LevelMap, type Level } from './level';
import { bandOf } from './level1Tiles';
import { G, parkTiles } from './level3Tiles';
import { parkBeasts } from './level3Beasts';

export function park(): Level {
  const bs = parkTiles();
  const beasts = parkBeasts();
  // the girl with the flying disc throws it every few seconds
  const fk = bs.def('discKid');
  fk.birthMon = beasts.id('flyingDisc');
  fk.birthTime = 54;
  const m = new LevelMap(bs, beasts, 'sky0');
  const R = rng(13);
  const pick = (...names: string[]) => names[Math.floor(R() * names.length)];
  m.rect(0, 0, 100, G, (_x, y) => `sky${bandOf(y)}`);
  for (const [cx, cy] of [
    [8, 27],
    [26, 26],
    [44, 29],
    [61, 26],
    [80, 28],
  ])
    for (let part = 0; part < 3; part++) m.set(cx + part, cy, `cloud${Math.min(1, bandOf(cy))}${part}`);
  m.rect(0, 37, 100, 1, 'farTop');
  m.rect(0, 38, 100, 1, 'far');
  m.rect(0, 39, 100, 1, () => pick('lawn', 'lawn', 'lawnFlower', 'lawnFlower2'));
  m.rect(0, G, 100, 1, () => pick('grass', 'grass2'));
  m.rect(0, G + 1, 100, 3, () => pick('dirt', 'dirt', 'dirt', 'dirt', 'dirtRock', 'dirtRoots', 'dirtWorm'));
  m.rect(0, G + 4, 100, 100 - G - 4, 'deep');
  // park walls at both ends (the map wraps)
  m.rect(0, 30, 4, 10, 'hedgeWall');
  m.rect(0, 29, 4, 1, 'hedgeTopWall');
  m.rect(88, 30, 12, 10, 'hedgeWall');
  m.rect(88, 29, 12, 1, 'hedgeTopWall');

  // A small hill with the squirrel tree.
  m.rect(8, 39, 6, 1, 'grass');
  m.rect(9, 38, 4, 1, 'grass2');
  for (let y = 30; y < 37; y++) for (let x = 7; x < 15; x++) if (Math.abs(x - 11) + Math.abs(y - 32) < 5) m.set(x, y, `leaf${bandOf(y)}`);
  m.set(11, 34, 'trunkTop').set(11, 35, 'trunkTop').set(11, 36, 'trunkTop').set(11, 37, 'trunk');
  m.rect(9, 35, 2, 1, 'branch2');
  m.rect(12, 33, 2, 1, 'branch1');

  // The sandbox (dig through the soft sand to a treat cache under it).
  m.set(16, G, 'sandFrame').set(22, G, 'sandFrame');
  m.rect(17, G, 5, 1, 'sand');
  m.rect(18, G, 2, 1, 'sandHole');
  m.rect(17, G + 1, 7, 1, 'sandHole');
  m.set(23, G, 'sandHole');
  m.set(21, 39, 'bucket');

  // The fountain beside the tall hedge: its jet lifts Teddy over.
  m.set(25, 39, 'rim');
  for (let y = 31; y < 40; y++)
    for (const x of [26, 27]) {
      const top = y === 31;
      const name = y === 39 ? 'jetLawn_0' : y >= 37 ? (top ? 'jetTop3_0' : 'jetFar_0') : `jet${top ? 'Top' : ''}${Math.max(1, bandOf(y))}_0`;
      m.set(x, y, name);
    }
  m.rect(28, 32, 3, 8, 'hedgeWall');
  m.rect(28, 31, 3, 1, 'hedgeTopWall');
  m.set(33, 39, 'parkSign');

  // Kids on the bench: one has Doc Leo's shoes, both would love to see a sit.
  m.set(35, 39, 'bench').set(36, 39, 'bench');
  m.set(35, 38, 'kidBench').set(36, 38, 'kidBench2');
  m.mon(37, 37, 'askShoes');
  m.mon(34, 37, 'askSit');
  m.set(32, 38, 'lampTop').set(32, 39, 'lamp');

  // The duck pond and the covered bridge. A rock by the near bank lets a wet dog out of
  // the water; the far bank is too high to climb out of it, so the geese must be faced.
  const p0 = 43;
  const p1 = 56;
  m.rect(p0, 39, p1 - p0 + 1, 1, (x) => `surface_${x % 2}`);
  m.rect(p0, G, p1 - p0 + 1, 4, (x, y) => `pond_${(x + y) % 2}`);
  m.rect(p0, G + 4, p1 - p0 + 1, 1, 'pondBed');
  m.set(p0 - 1, 39, 'rock').rect(p0 - 1, G, 1, 5, 'bank');
  m.rect(p1 + 1, 37, 2, 3, 'bank');
  m.rect(p1 + 1, 36, 2, 1, 'bankTop');
  m.rect(p1 + 1, G, 2, 5, 'bank');
  // stairs up, the bridge (its walkway is one block high), stairs down
  for (let i = 0; i < 3; i++) m.rect(p0 - 4 + i, 39 - i, 1, i + 1, 'stair');
  m.rect(p0 - 1, 37, p1 - p0 + 2, 1, 'bridge');
  m.rect(p0 - 1, 36, p1 - p0 + 2, 1, 'bridgeInside');
  m.rect(p0 - 1, 35, p1 - p0 + 1, 1, 'bridgeRoof');
  for (let i = 0; i < 4; i++) m.rect(p1 + 3 + i, 36 + i, 1, 4 - i, 'stair');
  m.mon(p0 + 4, 36, 'goose');
  m.mon(p0 + 9, 36, 'goose');
  m.mon(p0 + 2, 39, 'duck');
  m.mon(p0 + 8, 39, 'duck');

  // The picnic, the girl with the flying disc, Gwinn in the mud.
  m.set(65, 39, 'picnic').set(66, 39, 'basket').set(68, G, 'mud').set(69, G, 'mud').set(70, G, 'mud');
  m.mon(67, 39, 'gwinnMud');
  m.set(76, 39, 'discKid');
  m.set(74, 38, 'lampTop').set(74, 39, 'lamp');

  // The park gate, Pockets and the Klown Car.
  const car = 84;
  m.set(car - 2, 37, 'pocketsWant')
    .set(car - 2, 38, 'pocketsHead')
    .set(car - 2, 39, 'pocketsBody');
  m.set(car, 38, 'carRoofL')
    .set(car + 1, 38, 'carRoofR')
    .set(car, 39, 'carDoor')
    .set(car + 1, 39, 'carBack');
  m.rect(87, 32, 1, 8, 'gatePost');
  m.set(87, 31, 'gateTop');

  m.mon(12, 32, 'squirrel');
  m.mon(18, G, 'plug');
  m.mon(19, G, 'plug');
  m.mon(20, G + 2, 'buried');
  const treats: [number, number][] = [
    [7, 39],
    [9, 37],
    [10, 37],
    [9, 34],
    [12, 32],
    [13, 32],
    [15, 39],
    [17, G + 1],
    [19, G + 1],
    [20, G + 1],
    [21, G + 1],
    [22, G + 1],
    [24, 39],
    [26, 33],
    [27, 33],
    [29, 30],
    [30, 30],
    [33, 38],
    [p0 + 2, 36],
    [p0 + 6, 36],
    [p0 + 7, 36],
    [p0 + 11, 36],
    [p0 + 12, 36],
    [p1 + 1, 35],
    [p1 + 2, 35],
    [63, 38],
    [64, 38],
    [71, 39],
    [72, 39],
    [78, 39],
    [79, 39],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  // Doc Leo's balloon dogs, floated loose from the suitcase: up high, worth a detour.
  for (const [x, y] of [
    [12, 32],
    [30, 30],
    [p1 + 2, 35],
  ])
    m.mon(x, y, 'poodle');
  m.mark('start', 5, 39);
  m.mark('exit', car, 39);
  return {
    file: 'park',
    title: 'Puddlewick Park',
    time: 'afternoon',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [31, 35],
    pose: [37, 39, 'frontBeg'],
  };
}
