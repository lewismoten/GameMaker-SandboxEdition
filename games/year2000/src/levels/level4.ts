// Level 4: THE TELEPORT-A-PHONE EXCHANGE. Every phone booth in the world is a
// teleporter now, and they all go through here. Too bad half of them are wrong numbers:
// grandma's condo in Florida, the inside of a TV set, the bottom of the sea, the
// Jurassic period... The long-distance operators (telemarketer robots) won't stop
// calling. Somewhere down the line is the Moon Shuttle launch pad.
//
// All the rooms share one map; each booth links back into this same scene at another
// room, so the room you leave is reset (and its quarters come back) every time you dial.
import { LevelMap, type Legend } from './mapkit';
import type { BlockSet } from '../blocks/book';
import { MON } from '../ids';

const BASE: Legend = {
  X: 'xwall',
  B: 'booth_top',
  n: 'booth_dead',
  '1': 'num1',
  '2': 'num2',
  '3': 'num3',
  '4': 'num4',
};

/** Where each booth goes: door mark -> arrival mark. */
export const DIALS: [string, string][] = [
  ['hall1', 'florida'],
  ['hall2', 'sea'],
  ['hall3', 'tv'],
  ['floridaOut', 'sea'],
  ['seaOut', 'tv'],
  ['tvOut', 'jungle'],
  ['jungleOut', 'launch'],
  ['launchOut', 'hall'],
];

const door = (mark: string) => ({ tile: 'booth_door', mark });

// The exchange hall: switchboards, operators, four numbered booths (4 is out of order), and
// the antique corner: a teleprinter that types a tip, and a 1916 crank phone to ring.
const HALL = [
  'XXXXXXXXXXXXXXXXXXXXXXXX',
  'XWWWWWWWWWWWWWWWWWWWWWWX',
  'X......................X',
  'X..1B..2B..3B..4B......X',
  'X...a...b...c...n...q..X',
  'X......................X',
  'X..q..T.........T......X',
  'X......................X',
  'X...()......*....SSS...X',
  'X...YY...z........K..q.X',
  'X......................X',
  'X..T.........q.....T...X',
  'X......................X',
  'X.@..............*.....X',
  'X......................X',
  'XXXXXXXXXXXXXXXXXXXXXXXX',
];
const HALL_LEGEND: Legend = {
  ...BASE,
  '.': 'marble',
  W: 'switchboard',
  // Restoring the Signal: the teleprinter's paper and cabinet, the crank phone and its plaque.
  '(': 'ttyL0',
  ')': 'ttyR0',
  Y: { big: 'ttyBody', w: 2, h: 1 },
  K: 'crank',
  S: { big: 'plaque', w: 3, h: 1 },
  a: door('hall1'),
  b: door('hall2'),
  c: door('hall3'),
  q: 'quarter_marble',
  '*': 'pill_marble',
  z: 'battery_marble',
  T: { mon: MON.telemarketer },
  '@': { mark: 'hall' },
};

// Wrong number #1: Grandma's condo in Boca Raton.
const FLORIDA = [
  'XXXXXXXXXXXXXXXXXX',
  'XOOOOOOOOOOOOOOOOX',
  'XOOOOOOOOOOOOOOOOX',
  'X....P.......P...X',
  'X.f......q.....f.X',
  'X...SSS......G...X',
  'X...SSS..........X',
  'X..........P...B.X',
  'X.q..f..@......d.X',
  'X.........*......X',
  'XXXXXXXXXXXXXXXXXX',
];
const FLORIDA_LEGEND: Legend = {
  ...BASE,
  '.': 'beach',
  O: 'ocean',
  P: 'beachpalm',
  f: 'flamingo',
  S: 'shuffle',
  d: door('floridaOut'),
  q: 'quarter_beach',
  '*': 'pill_beach',
  G: { mon: MON.grandma },
  '@': { mark: 'florida' },
};

// Wrong number #2: the bottom of the sea, under a glass dome.
const SEA = [
  'QQQQQQQQQQQQQQQQQQ',
  'Q....w.....C....wQ',
  'Q.F.........F....Q',
  'Q..C....w......q.Q',
  'Q......f.........Q',
  'Q.w..........C...Q',
  'Q...F.....f....B.Q',
  'Q.q.......w....g.Q',
  'Q.....C..@.......Q',
  'QQQQQQQQQQQQQQQQQQ',
];
const SEA_LEGEND: Legend = {
  ...BASE,
  '.': 'seafloor',
  Q: 'seaglass',
  w: 'seaweed',
  C: 'coral',
  g: door('seaOut'),
  q: 'quarter_seafloor',
  F: { mon: MON.fish },
  f: { mon: MON.fishV },
  '@': { mark: 'sea' },
};

// Wrong number #3: inside a TV set, between channels.
const TV = [
  'ZZZZZZZZZZZZZZZZ',
  'Z,,,,,,,,,,,,,,Z',
  'Z,s,,,,,,,,,s,,Z',
  'Z,,,ZZ,,,,ZZ,,,Z',
  'Z,,,ZZ,,s,ZZ,q,Z',
  'Z,,,,,,,,,,,,,,Z',
  'Z,q,,,,ZZ,,,,B,Z',
  'Z,,,s,,ZZ,,,,e,Z',
  'Z,,,,,,@,,s,,,,Z',
  'ZZZZZZZZZZZZZZZZ',
];
const TV_LEGEND: Legend = {
  ...BASE,
  ',': 'static',
  Z: 'testpattern',
  e: door('tvOut'),
  q: 'quarter_static',
  s: { mon: MON.static },
  '@': { mark: 'tv' },
};

// Wrong number #4: sixty-five million years ago. Mind the tar.
const JUNGLE = [
  'RRRRRRRRRRRRRRRRRRRRRR',
  'R....Y.....tt.....Y..R',
  'R.Y.......ttt...q....R',
  'R......D.....tt......R',
  'R..tt..........Y..d..R',
  'R..ttt...Y...........R',
  'R.......RRRR...tt....R',
  'R.q...........ttt..B.R',
  'RD.........Y.......h.R', // this dino keeps to the far side, away from the booth's arrival spot
  'R..Y.....tt......*...R',
  'R.......ttt.@..Y.....R',
  'RRRRRRRRRRRRRRRRRRRRRR',
];
const JUNGLE_LEGEND: Legend = {
  ...BASE,
  '.': 'jungle',
  R: 'rockwall',
  Y: 'fern',
  t: 'tar',
  h: door('jungleOut'),
  q: 'quarter_jungle',
  '*': 'pill_jungle',
  D: { mon: MON.dino },
  d: { mon: MON.dinoV },
  '@': { mark: 'jungle' },
};

// Finally: the Moon Shuttle, ready to launch.
const LAUNCH = [
  'XXXXXXXXXXXXXXXXXXXX',
  'X..................X',
  'X.......KK.........X',
  'X.......KK....L....X',
  'X.......KK.........X',
  'X........k.........X',
  'X..................X',
  'X.B................X',
  'X.o................X',
  'X........@.........X',
  'XXXXXXXXXXXXXXXXXXXX',
];
const LAUNCH_LEGEND: Legend = {
  ...BASE,
  '.': 'concrete',
  K: { big: 'rocket', w: 2, h: 3 },
  L: 'launchsign',
  k: { tile: 'board', mark: 'exit' },
  o: door('launchOut'),
  '@': { mark: 'launch' },
};

// Beside the launch pad, a storage closet with no door. One brick of the shared wall is only
// a hologram (light shows through its mortar); inside, something has to be picked up by
// hand, and the round hatch past it opens only for whoever carries it.
const CLOSET = ['XXXXXXXX', 'X......X', 'g..e...h', 'X......X', 'XXXXXXXX'];
const CLOSET_LEGEND: Legend = {
  ...BASE,
  '.': 'concrete',
  g: 'xwallGlow',
  e: 'egg',
  h: { tile: 'hatch', mark: 'tomorrow' },
};

export function level4(set: BlockSet): LevelMap {
  const m = new LevelMap(set, 'void');
  m.stamp(0, 0, HALL, HALL_LEGEND, 'marble');
  m.stamp(30, 0, FLORIDA, FLORIDA_LEGEND, 'beach');
  m.stamp(52, 0, TV, TV_LEGEND, 'static');
  m.stamp(30, 16, SEA, SEA_LEGEND, 'seafloor');
  m.stamp(52, 16, JUNGLE, JUNGLE_LEGEND, 'jungle');
  m.stamp(0, 20, LAUNCH, LAUNCH_LEGEND, 'concrete');
  m.stamp(19, 23, CLOSET, CLOSET_LEGEND, 'concrete');
  // Watt, the repair robot from Ohm Sweet Ohm, tinkering with the switchboard's far end, and
  // a painted Easter egg in the sand in a corner of Florida
  m.set_(22, 2, 'watt').set_(46, 9, 'easterEgg');
  return m;
}
