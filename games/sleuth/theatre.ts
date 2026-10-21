// The Paragon Theatre, laid out in letters (one per block), for both acts:
//   ACT ONE, 10:30 PM: house lights on. The office is locked, the cloakroom shuttered, the
//     booth roped off, the pit door latched and the trap stairs boarded.
//   ACT TWO, 2 AM: only the ghost light burns. Mrs. Crane has handed over her keys, so
//     everything is open, and the safe stands where the bookcase was.
import { newMap, reindexMonsters, type GameMap } from '../../web/src/formats/map';
import type { BlockSet } from './blockset';

/** Where the theatre sits on the 100x100 map. */
export const OX = 10;
export const OY = 10;
const W = 68;
const H = 48;

/** A map cell in theatre-local coordinates → map coordinates. */
export const at = (x: number, y: number) => ({ x: x + OX, y: y + OY });

const rep = (ch: string, n: number) => ch.repeat(n);

/** The trap room under the stage (x 51..66, y 9..30): a maze of posts and old flats. */
const MAZE = [
  'tttttt%ttttttttt',
  't&%%tt%t&%%%%%&t',
  't%ttt%%ttt%ttttt',
  't%t&tttt%t%t%%%%',
  'ttt%%%%t%ttt%ttt',
  '%%t%ttt&%%%t%t&t',
  'ttt%t%tttt%ttt%t',
  't%%%t%%%%t%%%%%t',
  't&ttt%ttt@tttt%t',
  'tt%%t%t%%%%%%t%t',
  '%t%tttt%ttt&%ttt',
  '%t%%%%t%t%ttt%%t',
  'tttt&t%t%t%%%%tt',
  't%%%%t%ttt%t&tt%',
  'tttt%ttt%%%tt%tt',
  '%%t%%t%%%t%%t%%t',
  't@t%tt%ttttt%ttt',
  't%t%t&%t%%%t%t%t',
  'ttt%ttt%t@t%t%t%',
  't%%%%%%%t%t%t%tt',
  'ttt&ttttt%ttt%tt',
  '&tt%t@ttttt%&t%t',
];

function layout(act: 1 | 2): string[] {
  const rows: string[] = [];
  const room = (v: string, l: string, ch: string, pr: string, of: string, wa: string) =>
    '#' + v + '#' + l + '#' + ch + '#' + '#.#' + '#' + pr + '#' + of + '#' + wa + '#';
  rows.push(rep('#', 47) + '!##');
  const office1 = act === 1 ? 'III.CCC' : 'IIIJJJJ';
  rows.push(room('v.D.OO.', 'ee.v.fs.', 'KKK.KKK', 'zZzZzZ', office1, 'mM..'));
  rows.push(room('rrrrrrr', 'gggggggg', '.......', '......', 'rrrrrrr', '....'));
  rows.push(room('Urrrrrr', 'ggggggsg', 'K.....K', 'c....c', 'rEErrrr', '....'));
  rows.push(room('rrrrrrr', 'gggggggg', '.......', '......', 'rrrrrrr', '....'));
  rows.push(room('rrrrrrr', 'gggggggg', '.......', 'cc....', 'rrrrrrr', '....'));
  const y6 = [...rep('#', 50)];
  for (const [x, ch] of [
    [4, '1'],
    [12, '2'],
    [21, '3'],
    [27, '7'],
    [32, '4'],
    [40, '6'],
    [46, '5'],
    [10, '*'],
    [24, '*'],
    [35, '*'],
    [43, '*'],
  ] as [number, string][])
    y6[x] = ch;
  rows.push(y6.join(''));
  rows.push('#' + rep('.', 48) + '#');
  rows.push('#' + rep('.', 48) + '#');
  const y9 = [...rep('#', 50)];
  for (const x of [3, 4, 45, 46]) y9[x] = '.';
  rows.push(y9.join(''));
  // the stage: SL wing (fly rail), legs, the stage, legs, SR wing (prop table)
  for (let y = 10; y <= 20; y++) {
    const sl = [...('q' + rep('.', 7))];
    if (y === 15) sl[4] = 'c';
    if (y === 19) sl[6] = 'c';
    const gap = y === 13 || y === 17;
    const st = [...rep(y === 10 ? 'k' : ',', 30)];
    const put = (x: number, ch: string) => (st[x - 10] = ch);
    if (y === 12) {
      put(18, 'w');
      put(31, 'Y');
    }
    if (y === 13) {
      put(23, 'x');
      put(24, 'x');
    }
    if (y === 14) {
      put(23, 'o');
      put(24, 'o');
    }
    if (y === 16) put(33, 'n');
    if (y === 17) put(26, '_');
    if (y === 18) put(14, 'L');
    const sr = [...rep('.', 8)];
    if (y === 12) [sr[2], sr[3], sr[4]] = ['P', 'P', 'P'];
    if (y === 15) sr[6] = 'c';
    if (y === 20) sr[0] = 'c';
    rows.push('#' + sl.join('') + (gap ? '.' : 'l') + st.join('') + (gap ? '.' : 'l') + sr.join('') + (y === 18 ? 'T' : '#'));
  }
  rows.push('#####d####' + rep('F', 30) + rep('#', 10));
  rows.push('#' + rep(':', 9) + '#' + rep('p', 28) + '#' + rep('.', 9) + '#');
  rows.push('#' + rep(':', 9) + '#' + rep('p', 28) + '8' + rep('.', 9) + '.');
  rows.push('#' + rep(':', 9) + '#' + rep('R', 26) + 'G' + 'R' + rep('#', 11));
  rows.push('#' + rep(':', 48) + '#');
  for (let y = 26; y <= 38; y++) rows.push(y % 2 === 0 && y <= 36 ? '#:::' + rep('h', 20) + '::' + rep('h', 20) + ':::#' : '#' + rep(':', 48) + '#');
  const y39 = [...rep('#', 50)];
  for (const [x, ch] of [
    [4, 'A'],
    [5, 'A'],
    [12, 'd'],
    [37, 'd'],
    [18, 'y'],
    [19, 'y'],
    [30, 'y'],
    [31, 'y'],
    [15, '*'],
    [34, '*'],
  ] as [number, string][])
    y39[x] = ch;
  rows.push(y39.join(''));
  const lobby = (y: number) => {
    const l = [...rep('=', 31)];
    if (y === 40) {
      l[1] = 'u';
      l[29] = 'u';
    }
    return l.join('');
  };
  rows.push('#.......#' + lobby(40) + '#' + 'XXXXXXXX' + '#');
  rows.push('#.QQQ...#' + lobby(41) + '#' + '........' + '#');
  rows.push('#.......#' + lobby(42) + '9' + '........' + '#');
  rows.push('#.......#' + lobby(43) + '#' + '........' + '#');
  rows.push('#NNNdHHH#' + lobby(44) + '##########');
  rows.push('#aaa=====' + lobby(45) + '#' + 'VVVV.jj.' + '#');
  rows.push('#========' + lobby(46) + '0' + '........' + '#');
  rows.push(rep('#', 20) + rep('^', 10) + rep('#', 20));
  // the trap room, east of the theatre
  return rows.map((r, y) => {
    if (r.length !== 50) throw new Error(`theatre row ${y} is ${r.length} wide`);
    let east: string;
    if (y < 8 || y > 31) east = rep(' ', 18);
    else if (y === 8 || y === 31) east = rep('%', 18);
    else east = (y === 18 ? 'T' : y === 23 ? '.' : '%') + MAZE[y - 9] + '%';
    return r + east;
  });
}

/** Letters → blocks (the multi-block pictures count along the row). */
function blockFor(ch: string, act: 1 | 2, x: number, y: number, rows: string[]): string {
  const run = (want: string) => {
    let i = 0;
    while (x - i - 1 >= 0 && rows[y][x - i - 1] === want) i++;
    return i;
  };
  const below = rows[y + 1]?.[x];
  const open = below !== undefined && !'#* '.includes(below);
  switch (ch) {
    case ' ':
      return 'void';
    case '#':
      return open ? ((x + y) % 7 === 0 ? 'wall2' : 'wall') : 'walltop';
    case '*':
      return 'sconce';
    case '.':
      return (x * 3 + y * 5) % 9 === 0 ? 'boards2' : 'boards';
    case ',':
      return 'stage';
    case '_':
      return 'stage2';
    case ':':
      return 'carpet';
    case '=':
      return 'marble';
    case 'p':
      return 'pit';
    case 'r':
      return 'rug';
    case 'g':
      return 'rug2';
    case 'h':
      return 'seat';
    case 'R':
      return 'rail';
    case 'F':
      return 'footlight';
    case 'k':
      return `backdrop${(x - 10) % 3}`;
    case 'l':
      return 'legs';
    case '1':
      return 'door_crane';
    case '2':
      return 'door_lila';
    case '3':
      return 'door_chorus';
    case '4':
      return 'door_props';
    case '5':
      return 'door_watch';
    case '6':
      return act === 1 ? 'office_locked' : 'office_open';
    case '7':
      return `green_shut${act}`;
    case '8':
      return act === 1 ? 'pitdoor_shut' : 'pitdoor';
    case '9':
      return act === 1 ? 'shutter' : 'cloak_open';
    case '0':
      return act === 1 ? 'rope' : 'door_booth';
    case 'd':
      return 'doorway';
    case 'G':
      return 'pitgate';
    case 'T':
      return act === 1 ? 'boarded' : x >= 50 ? 'trapstairs' : 'stairs';
    case 'x':
      return `bier${run('x') % 2}`;
    case 'o':
      return `tape${run('o') % 2}`;
    case 'w':
      return 'goblet';
    case 'Y':
      return 'throne';
    case 'n':
      return 'trapdoor';
    case 'L':
      return act === 1 ? 'ghostlight' : 'ghostlit';
    case 'q':
      return 'ropes';
    case 'P':
      return `proptable${run('P') % 3}`;
    case 'c':
      return 'crate';
    case 'v':
      return 'vanity';
    case 'e':
      return `letter${run('e') % 2}`;
    case 'f':
      return 'flowers';
    case 's':
      return 'screen';
    case 'K':
      return 'rack';
    case 'O':
      return 'robe';
    case 'D':
      return 'decanter';
    case 'U':
      return 'trunk';
    case 'z':
      return 'shelf';
    case 'Z':
      return 'shelf2';
    case 'E':
      return `desk${run('E') % 2}`;
    case 'C':
      return 'bookcase';
    case 'I':
      return `bill${run('I') % 3}`;
    case 'J':
      return ['dial00', 'dial10', 'dial20', 'safe'][run('J')];
    case 'm':
      return 'cot';
    case 'M':
      return 'stove';
    case 'Q':
      return 'counter';
    case 'A':
      return `tally${run('A') % 2}`;
    case 'a':
      return 'bar';
    case 'N':
      return 'bottles';
    case 'H':
      return `chalk${run('H') % 3}`;
    case 'X':
      return 'coats';
    case 'V':
      return 'board';
    case 'j':
      return 'spot';
    case 'y':
      return `poster${run('y') % 2}`;
    case 'u':
      return 'palm';
    case '^':
      return 'glassdoor';
    case '!':
      return 'stagedoor';
    case 't':
      return act === 1 ? 'litfloor' : (x + y) % 3 === 0 ? 'dark2' : 'dark';
    case '%':
      return act === 1 ? 'litwall' : 'darkwall';
    case '&':
      return act === 1 ? 'pillar' : 'pillar_dark';
    case '@':
      return act === 1 ? 'litfloor' : 'rathole_dark';
  }
  throw new Error(`No block for "${ch}" at ${x},${y}`);
}

/** Things lying about, by act (theatre-local coordinates). */
const ITEMS_AT: Record<1 | 2, [string, number, number][]> = {
  1: [
    ['lens', 33, 3],
    ['checklist', 47, 13],
    ['stub_hidden', 44, 13],
    ['chart', 2, 43],
    ['key', 6, 40],
    ['policy', 42, 4],
  ],
  2: [
    ['lantern', 47, 3],
    ['ledger', 46, 42],
    ['cuesheet', 47, 46],
    ['umb_dark', 66, 29],
  ],
};

export interface Placed {
  mon: number;
  x: number;
  y: number;
}

export interface Theatre {
  map: GameMap;
  /** Where Ada starts (map coordinates). */
  start: { x: number; y: number };
  /** The green room vestibule: the link out (map coordinates). */
  exit: { x: number; y: number };
  rows: string[];
}

export function buildTheatre(act: 1 | 2, bs: BlockSet, monsters: Placed[]): Theatre {
  const rows = layout(act);
  const map = newMap();
  map.blocks.fill(bs.id('void'));
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const p = at(x, y);
      map.blocks[p.y * 100 + p.x] = bs.id(blockFor(rows[y][x], act, x, y, rows));
    }
  for (const [name, x, y] of ITEMS_AT[act]) {
    const p = at(x, y);
    map.blocks[p.y * 100 + p.x] = bs.id(name);
  }
  monsters.forEach((m, i) => {
    const p = at(m.x, m.y);
    map.monsters[i] = { monnum: m.mon, status: 0, xtra: 0, curx: p.x, cury: p.y, extra: 0 };
  });
  reindexMonsters(map);
  return { map, start: act === 1 ? at(24, 46) : at(27, 7), exit: at(27, 2), rows };
}
