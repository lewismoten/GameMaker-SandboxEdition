// Level 7: The River Road, on a summer afternoon: THE CHEZ follows the river down to the old
// mill. The new idea is the river's crossings. Teach: the first drawbridge is up (its leaf
// stands in the road by the keeper's booth): HONK and it comes down. Test: the ferry: drive on
// when it is at the near dock (over its stern, down into its hull), ride across, and drive
// off with a bump up the far bank. Twist: a charger, a hill, another charger, then a drawbridge that
// only stays down a few seconds, with a two-charge hill right after it: wait at the charger
// for two charges first, then honk.
//
// The river is never a trap: its fords are shallow and their current runs back to the near
// bank and in under its jetty, where the car bumps back up onto the road.
//
// The blocks are in roadTiles.ts and roadParts.ts, the monsters in roadBeasts.ts.
import { LevelMap, type Level } from './level';
import { G, roadTiles, skyAt } from './roadTiles';
import { roadBeasts } from './roadBeasts';
import { SPAN, leafPieces } from './roadBridge';
import { roadSong } from '../sound/roadSong';

/** Where things are, for the bot's route. */
export const ROAD = {
  start: 2,
  geese: 6,
  /** The first drawbridge's leaf column (the gap runs SPAN columns from it). */
  lift: 15,
  geese2: 22,
  /** The ferry: the near dock's edge, where the stern waits, and the far bank. */
  dock: 27,
  stern: 28,
  farBank: 38,
  charger1: 41,
  hill1: 44,
  hill1End: 50,
  charger2: 53,
  timed: 56,
  hill2: 61,
  pothole: 67,
  geese3: 72,
  exit: 83,
};

export function road(): Level {
  const bs = roadTiles();
  const beasts = roadBeasts();
  const m = new LevelMap(bs, beasts, 'sky0');
  m.rect(0, 0, 100, G, (_x, y) => skyAt(y));
  for (const [cx, cy] of [
    [4, 27],
    [20, 25],
    [38, 28],
    [55, 24],
    [70, 27],
    [86, 25],
  ])
    for (let part = 0; part < 3; part++) m.set(cx + part, cy, `cloud${part}`);
  m.rect(0, G, 100, 1, 'road');
  m.rect(0, G + 1, 100, 3, 'dirt');
  m.rect(0, G + 4, 100, 100 - G - 4, 'deep');

  /** A ford from x0 to x1 (row G), its bed below and the jetty on its near bank. */
  const ford = (x0: number, x1: number) => {
    for (let x = x0; x <= x1; x++) m.set(x, G, x % 2 ? 'ford0' : 'ford1').set(x, G + 1, 'bed');
    m.set(x0 - 1, G, 'jetty');
  };

  // The start, the geese, the keeper's booth and the first drawbridge.
  m.set(ROAD.start + 2, 39, 'reeds');
  m.set(9, 38, 'signBridgeL').set(10, 38, 'signBridgeR');
  for (let bx = 0; bx < 2; bx++) for (let by = 0; by < 2; by++) m.set(11 + bx, 38 + by, `booth${bx}${by}`);
  for (let by = 0; by < 4; by++) m.set(ROAD.lift - 1, 36 + by, `pier0${by}`);
  ford(ROAD.lift, ROAD.lift + SPAN - 1);
  for (let bx = 0; bx < 3; bx++) for (let by = 0; by < 4; by++) m.set(20 + bx, 36 + by, `willow${bx}${by}`);

  // The ferry's crossing: the near dock, the ford, the far bank.
  m.set(ROAD.dock - 2, 38, 'signFerryL').set(ROAD.dock - 1, 38, 'signFerryR');
  m.set(ROAD.dock, 39, 'piling');
  ford(ROAD.stern, ROAD.farBank - 1);
  m.set(ROAD.farBank + 1, 39, 'reeds');

  // The first hill, with its charger at the foot.
  m.set(ROAD.charger1, 39, 'charger');
  m.set(ROAD.charger1 + 1, 38, 'signPlug');
  m.set(ROAD.hill1, 39, 'hillFoot');
  for (let x = ROAD.hill1 + 1; x <= ROAD.hill1End; x++) m.set(x, 39, 'roadHi');
  for (let x = ROAD.hill1; x <= ROAD.hill1End; x++) m.set(x, G, 'hill');

  // The second charger and the timed drawbridge, the big hill right after it (two charges),
  // and on top of it a pothole and more geese.
  m.set(ROAD.charger2, 39, 'charger');
  m.set(ROAD.charger2 - 2, 38, 'signFirstL').set(ROAD.charger2 - 1, 38, 'signFirstR');
  for (let by = 0; by < 4; by++) m.set(ROAD.timed - 1, 36 + by, `pier0${by}`);
  ford(ROAD.timed, ROAD.timed + SPAN - 1);
  const h2 = ROAD.hill2;
  const top = 85;
  m.set(h2 - 1, 38, 'signTwo');
  m.set(h2, 39, 'hillFoot');
  for (let x = h2 + 1; x <= h2 + 2; x++) m.set(x, 39, 'roadHi');
  m.set(h2 + 3, 38, 'hillFootHi').set(h2 + 3, 39, 'hill');
  for (let x = h2 + 4; x <= top; x++) m.set(x, 38, 'roadHi').set(x, 39, 'hill');
  for (let x = h2; x <= top; x++) m.set(x, G, 'hill');
  m.set(ROAD.pothole, 38, 'pothole').set(ROAD.pothole, 39, 'potholeFloor');

  // The old mill's lane and its parking spot.
  for (let bx = 0; bx < 4; bx++) for (let by = 0; by < 4; by++) m.set(76 + bx, 34 + by, `mill${bx}${by}`);
  m.set(74, 36, 'signMill');
  m.set(ROAD.exit + 1, 36, 'signP');
  m.set(ROAD.exit, 37, 'parkLine');
  // a hedge closes the road off at both ends (the map wraps around)
  m.rect(top + 1, 28, 99 - top, 12, 'hedgeWall');
  m.rect(top + 1, 27, 99 - top, 1, 'hedgeTop');
  m.rect(0, 30, 1, 10, 'hedgeWall');
  m.set(0, 29, 'hedgeTop');

  // Monsters.
  m.mon(ROAD.geese, 39, 'goose');
  m.mon(ROAD.geese2, 39, 'goose');
  m.mon(ROAD.geese3, 37, 'goose');
  leafPieces('lift').forEach((name, k) => m.mon(ROAD.lift, 39 - k, name));
  leafPieces('timed').forEach((name, k) => m.mon(ROAD.timed, 39 - k, name));
  m.mon(ROAD.stern, G, 'ferryStern');
  m.mon(ROAD.stern + 1, G, 'ferryHull');
  m.mon(ROAD.stern + 2, G, 'ferryBow');
  const treats: [number, number][] = [
    [5, 39],
    [8, 39],
    [16, 38],
    [18, 38],
    [24, 39],
    // over the ferry's way: bump for them on the ride (and fall behind, if you're careless)
    [31, 39],
    [33, 39],
    [35, 39],
    [43, 39],
    [47, 38],
    [49, 38],
    [58, 38],
    [63, 38],
    [70, 36],
    [75, 37],
    [80, 37],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.mark('start', ROAD.start, 39);
  m.mark('exit', ROAD.exit, 37);
  return {
    file: 'road',
    hero: 'chez',
    title: 'The River Road',
    time: 'afternoon',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [8, 35],
    pose: [10, 39, 'car0'],
    song: roadSong,
    card: ['Down the river road to', 'the old mill.', 'NEW: BRIDGES AND FERRIES'],
  };
}
