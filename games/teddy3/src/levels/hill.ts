// Level 12: Lookout Hill at sunset, the last road trip and the hardest: THE CHEZ climbs to the
// Clown Club's Big Top, and every driving idea comes back. Plugged in at the bottom, honk the
// geese, take the ferry over the pond, bump through a pothole and spend the charge on the first
// hill. The new twist is a cow: she stands in the road and a honk doesn't move her, but she
// ambles off into the field after a moment (wait for her). Then the long climb: three hills in
// a row, so wait at the charger for three charges. At the top, a pothole, a charger, and the
// drawbridge over the gully, which is only down a few seconds, with a hill right after it:
// charge first, then honk. Last, geese, a pothole, and another cow standing right by a
// charger (waiting for her is charging time: the last hill takes two), and the Big Top.
//
// Nothing here is a trap: the pond and the gully wash a car back under their jetties (bump up
// through), the hills can be driven back down, and a charger is never far behind.
//
// The blocks are in hillTiles.ts, roadTiles.ts and roadParts.ts, the monsters in hillBeasts.ts.
import { LevelMap, type Level } from './level';
import { G, hillTiles, skyAt } from './hillTiles';
import { hillBeasts } from './hillBeasts';
import { SPAN, leafPieces } from './roadBridge';
import { hillSong } from '../sound/hillSong';

/** Where things are, for the bot's route (and the car's row on each level of the climb). */
export const HILL = {
  start: 2,
  geese: 6,
  dock: 9,
  stern: 10,
  farBank: 18,
  pothole: 21,
  hillA: 24,
  cow: 29,
  charger2: 33,
  /** The three hills in a row (their feet), each a block higher than the last. */
  climb: [35, 37, 39],
  pothole2: 42,
  charger3: 45,
  /** The gully's drawbridge (its leaf column; the gap runs SPAN columns from it). */
  gully: 48,
  hillB: 53,
  geese2: 57,
  pothole3: 61,
  charger4: 64,
  cow2: 66,
  /** The last hill, two charges (from the charger where the second cow holds you up). */
  hillC: 70,
  exit: 84,
};

/** The car's row past the gully, and at the very top. */
export const TOP_ROW = 34;
export const PEAK_ROW = 32;

export function hill(): Level {
  const bs = hillTiles();
  const beasts = hillBeasts();
  const m = new LevelMap(bs, beasts, 'sky0');
  m.rect(0, 0, 100, G, (_x, y) => skyAt(y));
  for (const [cx, cy] of [
    [6, 24],
    [24, 21],
    [44, 23],
    [63, 20],
    [88, 24],
  ])
    for (let part = 0; part < 3; part++) m.set(cx + part, cy, `cloud${part}`);
  m.rect(0, G, 100, 1, 'road');
  m.rect(0, G + 1, 100, 3, 'dirt');
  m.rect(0, G + 4, 100, 100 - G - 4, 'deep');

  /** Raised road: its surface on row y for columns x0..x1, with the hill's earth under it. */
  const raised = (x0: number, x1: number, y: number) => {
    for (let x = x0; x <= x1; x++) {
      m.set(x, y, 'roadHi');
      for (let yy = y + 1; yy <= G; yy++) m.set(x, yy, 'hill');
    }
  };
  /** A hill's foot in the car's row y at column x (one charge), with earth under it. */
  const foot = (x: number, y: number) => {
    m.set(x, y, y === 39 ? 'hillFoot' : 'hillFootHi');
    for (let yy = y + 1; yy <= G; yy++) m.set(x, yy, 'hill');
  };
  /** A ford on row y from x0 to x1, its bed below and the jetty on its near bank. */
  const ford = (x0: number, x1: number, y: number) => {
    for (let x = x0; x <= x1; x++) m.set(x, y, x % 2 ? 'ford0' : 'ford1').set(x, y + 1, 'bed');
    m.set(x0 - 1, y, 'jetty');
  };
  const pothole = (x: number, y: number) => m.set(x, y, 'pothole').set(x, y + 1, 'potholeFloor');

  // The bottom: the charger, the geese, the pond and its ferry, a pothole, the first hill.
  m.set(HILL.start, 39, 'charger');
  m.set(4, 38, 'signTopL').set(5, 38, 'signTopR');
  m.set(HILL.dock - 2, 38, 'signFerryL').set(HILL.dock - 1, 38, 'signFerryR');
  ford(HILL.stern, HILL.farBank - 1, G);
  pothole(HILL.pothole, G);
  for (let bx = 0; bx < 2; bx++) for (let by = 0; by < 3; by++) m.set(19 + bx, 37 + by, `pine${bx}${by}`);
  foot(HILL.hillA, 39);

  // The pasture and the cow, the charger with three bolts, and the climb.
  raised(HILL.hillA + 1, HILL.climb[0], 39);
  m.set(HILL.cow - 3, 38, 'signCow');
  for (let x = HILL.cow - 2; x <= HILL.cow + 2; x++) m.set(x, 38, 'fence');
  m.set(HILL.charger2 - 1, 38, 'signThree');
  m.set(HILL.charger2, 38, 'charger');
  const [c1, c2, c3] = HILL.climb;
  foot(c1, 38);
  raised(c1 + 1, c2, 38);
  foot(c2, 37);
  raised(c2 + 1, c3, 37);
  foot(c3, 36);

  // The top of the climb: a pothole, a charger, the gully and its drawbridge, a hill.
  raised(c3 + 1, HILL.gully - 1, 36);
  pothole(HILL.pothole2, 36);
  m.set(HILL.charger3, 35, 'charger');
  ford(HILL.gully, HILL.gully + SPAN - 1, 36);
  for (let x = HILL.gully; x < HILL.gully + SPAN; x++) for (let y = 38; y <= G; y++) m.set(x, y, 'rock');
  raised(HILL.gully + SPAN, HILL.hillB, 36);
  foot(HILL.hillB, 35);

  // The last stretch: geese, a pothole, another cow, the last hill (two charges), the Big Top.
  raised(HILL.hillB + 1, HILL.hillC, 35);
  pothole(HILL.pothole3, 35);
  for (let bx = 0; bx < 2; bx++) for (let by = 0; by < 3; by++) m.set(55 + bx, 32 + by, `pine${bx}${by}`);
  m.set(HILL.cow2 - 3, 34, 'signCow');
  for (let x = HILL.cow2 - 1; x <= HILL.cow2 + 2; x++) m.set(x, 34, 'fence');
  m.set(HILL.charger4, 34, 'charger');
  const c = HILL.hillC;
  m.set(c - 2, 34, 'signNeedL').set(c - 1, 34, 'signNeedR');
  foot(c, 34);
  raised(c + 1, c + 3, 34);
  foot(c + 3, 33);
  raised(c + 4, 87, 33);
  for (let bx = 0; bx < 6; bx++) for (let by = 0; by < 5; by++) m.set(76 + bx, 28 + by, `bigTop${bx}${by}`);
  m.set(HILL.exit + 1, PEAK_ROW, 'signP');
  m.set(HILL.exit, PEAK_ROW, 'parkLine');
  // a hedge closes the road off at both ends (the map wraps around)
  m.rect(88, 22, 12, 19, 'hedgeWall');
  m.rect(88, 21, 12, 1, 'hedgeTop');
  m.rect(0, 22, 1, 18, 'hedgeWall');
  m.set(0, 21, 'hedgeTop');

  // Monsters.
  m.mon(HILL.geese, 39, 'goose');
  m.mon(HILL.geese2, TOP_ROW, 'goose');
  m.mon(HILL.stern, G, 'ferryStern');
  m.mon(HILL.stern + 1, G, 'ferryHull');
  m.mon(HILL.stern + 2, G, 'ferryBow');
  m.mon(HILL.cow, 38, 'cow');
  m.mon(HILL.cow2, TOP_ROW, 'cow2');
  leafPieces('gully').forEach((name, k) => m.mon(HILL.gully, 35 - k, name));
  const treats: [number, number][] = [
    [7, 39],
    [13, 39],
    [15, 39],
    [22, 39],
    [25, 38],
    [31, 38],
    [36, 37],
    [38, 36],
    [41, 35],
    [44, 34],
    [50, 34],
    [55, 34],
    [59, 33],
    [64, 33],
    [68, 33],
    [72, 33],
    [79, 32],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  m.mark('start', HILL.start, 39);
  m.mark('exit', HILL.exit, PEAK_ROW);
  return {
    file: 'hill',
    hero: 'chez',
    title: 'Lookout Hill',
    time: 'sunset',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [24, 34],
    pose: [27, 38, 'car0'],
    song: hillSong,
    card: ['Up Lookout Hill to the', "Clown Club's Big Top.", 'NEW: COWS (WAIT FOR THEM)'],
  };
}
