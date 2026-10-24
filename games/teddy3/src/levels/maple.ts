// Level 2: Maple Street, the first road trip. THE CHEZ starts plugged in at Doc Leo's curb
// (the charger's light pulses: each pulse while it is parked there is one charge). Down the
// street: HONK the geese off the road, BUMP over the speed bump, bump out of a pothole, and
// spend a charge to climb the first hill (no charge, no climb: back to the curb to plug in).
// Then the big hill: two charges, so stop at a charger and wait for two pulses: the only one
// is down on the low road, a lane a step below the street (drive
// down into it, plug in, and BUMP back up). Over the top, more geese and a pothole, and the
// gate of Puddlewick Park.
//
// The blocks are in mapleTiles.ts and roadParts.ts, the monsters in mapleBeasts.ts.
import { LevelMap, type Level } from './level';
import { G, mapleTiles, skyAt } from './mapleTiles';
import { mapleBeasts } from './mapleBeasts';

/** Where things are, for the bot's route. */
export const MAPLE = {
  start: 2,
  geese: 10,
  hump: 16,
  pothole: 21,
  hill1: 27,
  geese2: 46,
  lane: 51,
  laneEnd: 55,
  charger3: 53,
  hill2: 59,
  geese3: 68,
  pothole3: 73,
  exit: 80,
};

export function maple(): Level {
  const bs = mapleTiles();
  const beasts = mapleBeasts();
  const m = new LevelMap(bs, beasts, 'sky0');
  m.rect(0, 0, 100, G, (_x, y) => skyAt(y));
  for (const [cx, cy] of [
    [5, 26],
    [24, 24],
    [45, 27],
    [62, 23],
  ])
    for (let part = 0; part < 3; part++) m.set(cx + part, cy, `cloud${part}`);
  m.rect(0, G, 100, 1, 'road');
  m.rect(0, G + 1, 100, 3, 'dirt');
  m.rect(0, G + 4, 100, 100 - G - 4, 'deep');
  m.rect(1, 39, 84, 1, 'walk');

  // Houses and maples along the street, the fence between.
  const house = (x: number, name: string) => {
    for (let bx = 0; bx < 4; bx++) for (let by = 0; by < 4; by++) m.set(x + bx, 35 + by, `${name}${bx}${by}`);
  };
  const maple = (x: number) => {
    for (let bx = 0; bx < 2; bx++) for (let by = 0; by < 3; by++) m.set(x + bx, 36 + by, `maple${bx}${by}`);
  };
  house(1, 'houseA');
  maple(6);
  house(9, 'houseB');
  m.set(13, 38, 'fence').set(14, 38, 'fence');
  house(17, 'houseC');
  maple(22);
  house(42, 'houseB');
  maple(47);

  // The road: the charger at Doc Leo's curb, the geese, the speed bump, the pothole.
  m.set(MAPLE.start, 39, 'charger');
  m.set(4, 39, 'signHonkL').set(5, 39, 'signHonkR');
  m.set(13, 39, 'signBumpL').set(14, 39, 'signBumpR');
  m.set(MAPLE.hump, 39, 'hump');
  m.set(MAPLE.pothole, G, 'pothole').set(MAPLE.pothole, G + 1, 'potholeFloor');

  // The first hill: one charge. The upper road, and down again.
  const h1 = MAPLE.hill1;
  m.set(h1 - 3, 38, 'signNeedL').set(h1 - 2, 38, 'signNeedR');
  m.set(h1, 39, 'hillFoot');
  for (let x = h1 + 1; x <= 40; x++) m.set(x, 39, 'roadHi');
  for (let x = h1; x <= 40; x++) m.set(x, G, 'hill');

  // The low road, a step down beside the street, with the charger for the big hill in it.
  m.set(MAPLE.lane - 3, 39, 'signLaneL').set(MAPLE.lane - 2, 39, 'signLaneR');
  for (let x = MAPLE.lane; x <= MAPLE.laneEnd; x++) m.set(x, G, 'laneWall').set(x, G + 1, 'roadPlain');
  m.set(MAPLE.charger3, G, 'chargerLane');

  // The big hill: two charges (two feet, one above the other).
  const h2 = MAPLE.hill2;
  m.set(h2 - 1, 38, 'signTwo');
  m.set(h2, 39, 'hillFoot');
  for (let x = h2 + 1; x <= h2 + 2; x++) m.set(x, 39, 'roadHi');
  m.set(h2 + 3, 38, 'hillFootHi');
  m.set(h2 + 3, 39, 'hill');
  for (let x = h2 + 4; x <= 86; x++) m.set(x, 38, 'roadHi').set(x, 39, 'hill');
  for (let x = h2; x <= 86; x++) m.set(x, G, 'hill');
  // over the top: more geese (honk) and a pothole (bump out) before the park
  m.set(MAPLE.pothole3, 38, 'pothole').set(MAPLE.pothole3, 39, 'potholeFloor');

  // Puddlewick Park's gate at the top.
  for (let bx = 0; bx < 4; bx++) for (let by = 0; by < 4; by++) m.set(78 + bx, 34 + by, `gate${bx}${by}`);
  m.set(76, 37, 'signPark');
  // a hedge closes the street off at both ends (the map wraps around)
  m.rect(87, 28, 13, 12, 'hedgeWall');
  m.rect(87, 27, 13, 1, 'hedgeTop');
  m.rect(0, 30, 1, 10, 'hedgeWall');
  m.set(0, 29, 'hedgeTop');

  // Monsters.
  m.mon(MAPLE.geese, 39, 'goose');
  m.mon(MAPLE.geese2, 39, 'goose');
  m.mon(MAPLE.geese3, 37, 'goose');
  m.mon(37, 37, 'poodle');
  const treats: [number, number][] = [
    [7, 39],
    [12, 39],
    [18, 39],
    [24, 39],
    [30, 38],
    [38, 38],
    [43, 39],
    [54, 40],
    [64, 37],
    [66, 37],
    [72, 37],
    [75, 37],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.mark('start', MAPLE.start, 39);
  m.mark('exit', MAPLE.exit, 37);
  return {
    file: 'maple',
    hero: 'chez',
    title: 'Maple Street',
    time: 'morning',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [20, 35],
    pose: [26, 39, 'car0'],
  };
}
