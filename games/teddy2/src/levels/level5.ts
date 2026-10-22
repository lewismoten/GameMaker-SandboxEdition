// Level 5: MEANWHILE... Gwinn on the Farm, at dawn, where the hay wagon stopped for the
// driver's breakfast. Gwinn hops the chicken yard (so many rubber chickens!), rides the hay
// elevator up into the barn loft, knocks the bales flat with her zoomies, wades through the
// pig wallow, BOOFs the goat away from the pasture gate and chews its rope, scatters the
// crows, and hops into a Ferris wheel car riding on the Fair's truck. She can smell the
// corn dogs from here.
//
// The blocks are in level5Tiles.ts, the monsters in level5Beasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { G, farmTiles, skyAt } from './level5Tiles';
import { farmBeasts } from './level5Beasts';

export function farm(): Level {
  const bs = farmTiles();
  const beasts = farmBeasts();
  const m = new LevelMap(bs, beasts, 'sky0');
  m.rect(0, 0, 100, G, (_x, y) => skyAt(y));
  for (const [cx, cy] of [
    [8, 27],
    [40, 26],
    [62, 28],
    [84, 27],
  ])
    for (let part = 0; part < 3; part++) m.set(cx + part, cy, `cloud${part}`);
  m.rect(0, G, 100, 1, (x) => (x < 10 ? 'lane' : x > 72 && x < 88 ? 'road' : 'grass'));
  m.rect(0, G + 1, 100, 3, 'dirt');
  m.rect(0, G + 4, 100, 56, 'deep');
  for (let x = 0; x < 100; x++) if (x > 9 && x < 73) m.set(x, 39, x % 6 === 1 ? 'flower' : 'tuft');

  // The chicken yard: low rails at each end, the coop.
  m.set(9, 39, 'signEggs');
  m.set(11, 39, 'rail').set(21, 39, 'rail');
  m.set(13, 38, 'coop00').set(14, 38, 'coop10').set(13, 39, 'coop01').set(14, 39, 'coop11');
  // The barn, x 23..38: cut open; the hay elevator up to the loft; bales in the loft.
  const b0 = 23;
  const b1 = 38;
  m.rect(b0, 30, b1 - b0 + 1, 10, 'barnIn');
  m.set(b0 - 1, 29, 'roofL');
  m.rect(b0, 29, b1 - b0 + 1, 1, 'roof');
  m.set(b1 + 1, 29, 'roofR');
  m.set(b0, 28, 'roofL');
  m.rect(b0 + 1, 28, b1 - b0 - 1, 1, 'roof');
  m.set(b1, 28, 'roofR');
  m.rect(b0, 33, b1 - b0 + 1, 1, 'loft');
  m.rect(b1, 34, 1, 6, 'barnWall');
  m.set(b1, 32, 'loftDoor');
  m.rect(b1, 30, 1, 2, 'barnWall');
  m.set(b0 + 1, 38, 'cow00').set(b0 + 2, 38, 'cow10').set(b0 + 1, 39, 'cow01').set(b0 + 2, 39, 'cow11');
  // the belt runs from the floor at x 27 up to the loft's edge at x 32
  for (let k = 0; k < 6; k++) {
    const x = 27 + k;
    const y = 39 - k;
    m.set(x, y, 'belt0');
    m.set(x + 1, y, 'beltAir0');
    if (y - 1 > 33) m.set(x, y - 1, 'beltAir0');
  }
  m.set(b0 + 2, 32, 'hay').set(b0 + 3, 32, 'hay');
  // Outside the loft door: a hay pile to land on; the wallow.
  m.rect(40, 39, 1, 1, 'tuft');
  const w0 = 42;
  for (let x = w0; x < w0 + 8; x++) {
    m.set(x, 39, 'sky3');
    m.set(x, G, 'mud0').set(x, G + 1, 'mudDeep0').set(x, G + 2, 'dirt');
  }
  // The pasture fence and gate, x 56 (the rope is a monster).
  const fx = 56;
  m.set(fx, 34, 'fenceTop');
  for (let y = 35; y < 39; y++) m.set(fx, y, 'fence');
  m.set(fx, 39, 'gate');
  // The pumpkins and the scarecrow.
  for (const x of [60, 62, 63, 66, 68]) m.set(x, 39, 'pumpkin');
  m.set(64, 38, 'scareTop').set(64, 39, 'scareBot');
  // The farm stand and the Fair's ride truck.
  m.set(71, 38, 'stand00').set(72, 38, 'stand10').set(71, 39, 'stand01').set(72, 39, 'stand11');
  const truck = 76;
  m.rect(truck, 39, 6, 1, 'flatbed');
  m.set(truck + 2, 37, 'carL0').set(truck + 3, 37, 'carR0').set(truck + 2, 38, 'gondola').set(truck + 3, 38, 'carR1');
  m.set(truck + 6, 38, 'cab00').set(truck + 7, 38, 'cab10').set(truck + 6, 39, 'cab01').set(truck + 7, 39, 'cab11');
  m.rect(88, 26, 4, 14, 'silo');
  m.rect(92, 30, 8, 10, 'hedgeWall');
  m.rect(92, 29, 8, 1, 'hedgeTop');
  m.rect(0, 30, 1, 10, 'hedgeWall');
  m.set(0, 29, 'hedgeTop');

  // Monsters.
  m.mon(15, 39, 'hen');
  m.mon(18, 39, 'henB');
  m.mon(12, 37, 'rooster');
  m.mon(35, 32, 'bales');
  m.mon(44, 40, 'pig');
  m.mon(fx - 1, 39, 'goat');
  m.mon(fx, 39, 'rope');
  m.mon(67, 36, 'crow');
  m.mon(61, 35, 'crow');
  for (const [x, y] of [
    [13, 35],
    [27, 31],
    [70, 35],
  ])
    m.mon(x, y, 'poodle');
  const treats: [number, number][] = [
    [5, 39],
    [7, 39],
    [12, 39],
    [16, 39],
    [19, 39],
    [24, 36],
    [29, 39],
    [33, 39],
    [25, 32],
    [29, 32],
    [33, 32],
    [36, 32],
    [43, 38],
    [46, 38],
    [49, 38],
    [52, 39],
    [58, 39],
    [61, 39],
    [65, 39],
    [69, 39],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  for (const [x, y] of [
    [71, 37],
    [72, 37],
  ])
    m.treat(x, y, 'bone');
  m.mark('start', 4, 39);
  m.mark('exit', truck + 2, 38);
  return {
    file: 'farm',
    hero: 'gwinn',
    title: 'Gwinn on the Farm',
    time: 'morning',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [22, 35],
    pose: [29, 37, 'gwinnRun1'],
    outro: 'truck.fli',
  };
}
