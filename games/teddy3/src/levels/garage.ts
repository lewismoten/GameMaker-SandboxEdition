// Level 1: Doc Leo's Garage, at dawn on Teddy's birthday (nobody has said so). Doc Leo is out
// on the driveway with THE CHEZ, and he can't find its keys. Teddy barks a mouse out of the
// laundry room, high-fives the button by the door into the garage (it swings open), hops up
// on the workbench and high-fives the button over it to open the key cabinet, fetches the
// keys (and runs the shelves up to the loft for treats), then pushes the garage door's button and runs: the door goes up, and comes back
// down by itself three seconds later. (Push it again if it beats him.) Doc Leo's NEED KEYS board
// stands in front of the door and only folds away for a dog carrying the keys, so nobody ends
// up shut outside without them.
//
// The blocks are in garageTiles.ts, the monsters in garageBeasts.ts; this file lays out the map.
import { LevelMap, type Level } from './level';
import { CEIL, G, garageTiles } from './garageTiles';
import { garageBeasts } from './garageBeasts';
import { bandAt } from './common';
import { sky } from '../blocks/tiles';

/** Where things are, for the bot's route. */
export const GARAGE = { btnDoor: 12, bench: 24, btnCab: 27, cab: 28, btnGarage: 44, gate: 50, door: 51, car: 57 };

export function garage(): Level {
  const bs = garageTiles();
  const beasts = garageBeasts();
  bs.chez(
    () => sky(3),
    'keys',
    sky(bandAt(37, G)),
    () => sky(3),
  );
  const m = new LevelMap(bs, beasts, 'sky0');
  m.rect(0, 0, 100, G, (_x, y) => `sky${bandAt(y, G)}`);
  for (const [cx, cy] of [
    [8, 25],
    [30, 23],
    [60, 27],
    [80, 24],
  ])
    for (let part = 0; part < 3; part++) m.set(cx + part, cy, `cloud${part}`);
  m.rect(0, G, 100, 1, 'grass');
  m.rect(0, G + 1, 100, 3, 'dirt');
  m.rect(0, G + 4, 100, 100 - G - 4, 'deep');

  // The house end of it all: the roof, the ceiling, the laundry room and the garage.
  const x0 = 1;
  const x1 = 51;
  m.rect(x0 + 1, CEIL - 2, x1 - x0 - 1, 1, 'roofTop');
  m.rect(x0, CEIL - 1, x1 - x0 + 1, 1, 'roof');
  m.rect(x0, CEIL, x1 - x0 + 1, 1, 'ceiling');
  m.rect(x0 + 1, CEIL + 1, 12, G - CEIL - 1, 'laundry');
  m.rect(x0, CEIL + 1, 1, G - CEIL - 1, 'partition');
  m.rect(x0, G, 13, 1, 'tileFloor');
  m.rect(14, CEIL + 1, x1 - 14, G - CEIL - 1, 'cinder');
  for (let x = 14; x < x1; x++) m.set(x, G, x % 2 ? 'floor0' : 'floor1');
  m.set(5, 35, 'laundryWin').set(10, 35, 'laundryWin');
  m.set(4, 39, 'washer00').set(5, 39, 'washer10');
  m.set(2, 37, 'signSniff');
  m.set(6, 37, 'signWoofL').set(7, 37, 'signWoofR');
  m.set(9, 37, 'signFiveL').set(10, 37, 'signFiveR');

  // The door into the garage, and its button beside it.
  for (let y = CEIL + 1; y < 38; y++) m.set(13, y, 'partition');
  m.set(13, 38, 'doorTop').set(13, 39, 'doorway');
  m.mon(GARAGE.btnDoor, 38, 'btnDoor');
  m.mon(13, 39, 'door');

  // The garage: pegboard, window, the workbench with the key cabinet and its button.
  for (let x = 15; x < 19; x++) m.set(x, 34, `peg${(x * 3) % 5}`).set(x, 35, `peg${(x * 7 + 1) % 5}`);
  m.set(21, 35, 'garageWin');
  m.set(GARAGE.bench, 37, 'benchL');
  for (let x = GARAGE.bench + 1; x < GARAGE.cab; x++) m.set(x, 37, 'bench');
  m.set(GARAGE.cab, 37, 'benchR');
  for (let x = GARAGE.bench; x <= GARAGE.cab; x++) m.set(x, 38, 'benchLegs').set(x, 39, 'benchLegs');
  m.set(GARAGE.cab, 36, 'keys');
  m.mon(GARAGE.cab, 36, 'cab');
  m.mon(GARAGE.btnCab, 35, 'btnCab');
  m.set(23, 39, 'signKeys');

  // Shelves up to the loft (a treat run, off the way), the mower and the bike under it.
  m.set(31, 37, 'shelfCans');
  m.set(33, 35, 'shelf');
  m.rect(35, 34, 6, 1, 'loft');
  m.set(33, 39, 'mower00').set(34, 39, 'mower10');
  m.set(37, 38, 'bike00').set(38, 38, 'bike10').set(37, 39, 'bike01').set(38, 39, 'bike11');

  // The garage door, its button and its light. A box to hop on the way.
  m.set(41, 37, 'signHurryL').set(42, 37, 'signHurryR');
  m.mon(GARAGE.btnGarage, 38, 'btnGarage');
  m.set(47, 39, 'box');
  for (let y = CEIL + 1; y < 39; y++) m.set(GARAGE.door, y, 'gdoor');
  m.set(GARAGE.door - 1, 34, 'lightOn');
  m.set(GARAGE.door, 39, 'gdoorGap');
  m.set(GARAGE.gate, 39, 'gate');
  m.mon(GARAGE.door, 39, 'garage');

  // Outside: the driveway, the charger, THE CHEZ and Doc Leo, waiting for the keys.
  m.rect(52, G, 18, 1, 'drive');
  const car = GARAGE.car;
  m.set(car - 2, 38, 'charger00').set(car - 2, 39, 'charger01');
  m.set(car, 38, 'carRoofL')
    .set(car + 1, 38, 'carRoofR')
    .set(car, 39, 'carDoor')
    .set(car + 1, 39, 'carBack');
  m.set(car + 3, 37, 'leoWant')
    .set(car + 3, 38, 'leoHead')
    .set(car + 3, 39, 'leoBody');
  // a hedge closes the yard off at both ends (the map wraps around)
  m.rect(70, 30, 30, 10, 'hedgeWall');
  m.rect(70, 29, 30, 1, 'hedgeTop');
  m.rect(0, 30, 1, 10, 'hedgeWall');
  m.set(0, 29, 'hedgeTop');
  for (const x of [53, 62, 64, 67]) m.set(x, 39, 'tuft');

  // Monsters.
  m.mon(7, 39, 'mouse');
  m.mon(18, 39, 'bunny');
  m.mon(5, 39, 'scentBall');
  m.mon(39, 33, 'poodle');
  const treats: [number, number][] = [
    [7, 39],
    [11, 39],
    [16, 39],
    [20, 39],
    [22, 39],
    [25, 36],
    [26, 36],
    [30, 39],
    [32, 36],
    [37, 33],
    [38, 33],
    [40, 33],
    [43, 39],
    [46, 39],
    [49, 39],
    [54, 39],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.mark('start', 2, 39);
  m.mark('exit', car, 39);
  return {
    file: 'garage',
    hero: 'teddy',
    title: "Doc Leo's Garage",
    time: 'morning',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [20, 34],
    pose: [26, 36, 'frontReach'],
  };
}
