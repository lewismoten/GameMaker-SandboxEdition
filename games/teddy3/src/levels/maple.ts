// Level 2: Maple Street, the first road trip. THE CHEZ starts plugged in at Doc Leo's curb
// (the charger's light pulses: each pulse while it is parked there is one charge). Down the
// street: HONK the geese off the road, BUMP over the speed bump, bump out of a pothole, and
// spend a charge to climb the first hill (no charge, no climb: there is a charger at the top
// for next time). Then the big hill: two charges, so stop at the charger at its foot and wait
// for two pulses. At the top, the gate of Puddlewick Park.
//
// The blocks are in mapleTiles.ts and roadParts.ts, the monsters in mapleBeasts.ts.
import { LevelMap, type Level } from './level';
import { G, mapleTiles, skyAt } from './mapleTiles';
import { mapleBeasts } from './mapleBeasts';

/** Where things are, for the bot's route. */
export const MAPLE = { start: 2, geese: 10, hump: 16, pothole: 21, hill1: 27, charger2: 34, geese2: 46, charger3: 50, hill2: 53, exit: 66 };

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
  m.rect(1, 39, 70, 1, 'walk');

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

  // The first hill: one charge. The upper road, a charger on it, and down again.
  const h1 = MAPLE.hill1;
  m.set(h1 - 3, 38, 'signNeedL').set(h1 - 2, 38, 'signNeedR');
  m.set(h1, 39, 'hillFoot');
  for (let x = h1 + 1; x <= 40; x++) m.set(x, 39, 'roadHi');
  for (let x = h1; x <= 40; x++) m.set(x, G, 'hill');
  m.set(MAPLE.charger2, 38, 'chargerHi');
  m.set(MAPLE.charger2 + 1, 38, 'signPlug');

  // The big hill: two charges (two feet, one above the other), its charger at the bottom.
  const h2 = MAPLE.hill2;
  m.set(MAPLE.charger3, 39, 'charger');
  m.set(MAPLE.charger3 + 1, 38, 'signTwo');
  m.set(h2, 39, 'hillFoot');
  for (let x = h2 + 1; x <= h2 + 2; x++) m.set(x, 39, 'roadHi');
  m.set(h2 + 3, 38, 'hillFootHi');
  m.set(h2 + 3, 39, 'hill');
  for (let x = h2 + 4; x <= 72; x++) m.set(x, 38, 'roadHi').set(x, 39, 'hill');
  for (let x = h2; x <= 72; x++) m.set(x, G, 'hill');

  // Puddlewick Park's gate at the top.
  for (let bx = 0; bx < 4; bx++) for (let by = 0; by < 4; by++) m.set(64 + bx, 34 + by, `gate${bx}${by}`);
  m.set(62, 37, 'signPark');
  // a hedge closes the street off at both ends (the map wraps around)
  m.rect(73, 28, 27, 12, 'hedgeWall');
  m.rect(73, 27, 27, 1, 'hedgeTop');
  m.rect(0, 30, 1, 10, 'hedgeWall');
  m.set(0, 29, 'hedgeTop');

  // Monsters.
  m.mon(MAPLE.geese, 39, 'goose');
  m.mon(MAPLE.geese2, 39, 'goose');
  m.mon(37, 37, 'poodle');
  const treats: [number, number][] = [
    [7, 39],
    [12, 39],
    [18, 39],
    [24, 39],
    [30, 38],
    [38, 38],
    [43, 39],
    [58, 37],
    [61, 37],
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
