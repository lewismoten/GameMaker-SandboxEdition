// The rooms where Ada talks instead of searches (GREEN.BBL, GREEN.MAP, GREEN.MON): the
// green room with its evidence board, an interview room for each suspect in each round,
// and the stage at dawn where she names the killer. Every one of them is exactly one
// screen, and every scene that uses one starts Ada in its middle, so a question can lead
// to a whole new scene (the answer is its intro) that looks like the same room.
//
// The case's suspects, cards and rooms are below with the map and the monsters; the blocks
// are drawn in parlorBlocks.ts.
import { newMap, reindexMonsters, type GameMap } from '../../../../web/src/formats/map';
import { emptyMonster, type Monster } from '../../../../web/src/formats/monster';
import { BlockSet } from '../blocks/blockset';
import { ITEM, ITEMS } from '../blocks/items';
import { figure, type Who } from '../art/people';

export const SUSPECTS: Who[] = ['lila', 'edgar', 'agatha', 'felix', 'pike'];

/** Question cards: two blocks each, an icon or a word. */
export const CARDS = {
  r1: [
    ['ALIBI?', 'clock'],
    ['VICTOR?', 'mask'],
    ['SEEN?', 'eye'],
  ],
} as const;

/** What each suspect is asked in the second round: an item to show, or a topic. */
export const ROUND2: Partial<Record<Who, (string | { item: string })[]>> = {
  lila: ['LETTER?', { item: 'umbrella' }, { item: 'safe_ms' }],
  edgar: [{ item: 'umbrella' }, { item: 'ledger' }, 'ROLE?'],
  agatha: [{ item: 'policy' }, { item: 'chart' }, { item: 'safe_ms' }],
  felix: [{ item: 'checklist' }, { item: 'cuesheet' }, 'WINE?'],
  pike: [{ item: 'stub' }, { item: 'ledger' }, { item: 'safe_ms' }],
  dobbs: [],
  ada: [],
};

export const HOW = [
  ['SWAP', 'dagger'],
  ['POISON', 'goblet'],
  ['DARK', 'bulb'],
] as const;
export const WHY = [
  ['LOVE', 'heart'],
  ['MONEY', 'coins'],
  ['PLAY', 'book'],
] as const;

/** Room origins on GREEN.MAP (16x10 blocks each). */
export const ROOM = {
  gr1: { x: 0, y: 0 },
  gr2: { x: 16, y: 0 },
  r1: (i: number) => ({ x: i * 16, y: 10 }),
  r2: (i: number) => ({ x: i * 16, y: 20 }),
  who: { x: 0, y: 30 },
  how: { x: 16, y: 30 },
  why: { x: 32, y: 30 },
  wrong: { x: 48, y: 30 },
  curtain: { x: 64, y: 30 },
};

export const center = (o: { x: number; y: number }) => ({ x: o.x + 8, y: o.y + 5 });
/** Behind the curtain: a wrong answer's cell and the solution's cell. */
export const ZCELL = { x: ROOM.curtain.x + 8, y: ROOM.curtain.y + 5 };
export const SOLVED = { x: ROOM.curtain.x + 4, y: ROOM.curtain.y + 5 };

// ---------------------------------------------------------------- the map

const GR = [
  '################',
  '#..............#',
  '#..............#',
  '#at..........ta#',
  '#..............#',
  '#..............#',
  '#at..........ta#',
  '#.........t....#',
  '#.E.......a..s.#',
  '#ww#############',
];
const IV = [
  '################',
  '#p.....PP.....p#',
  '#......PP......#',
  '#......TT......#',
  '#..............#',
  '#..............#',
  '#.11........22.#',
  '#..............#',
  '#.E....33......#',
  '#ww#############',
];
const WHO = [
  '################',
  '#..............#',
  '#.s..s..s..s..s#',
  '#.o..o..o..o..o#',
  '#..............#',
  '#..............#',
  '#..............#',
  '#..............#',
  '#B.............#',
  'ffffffffffffffff',
];
const CHOICE = [
  '################',
  '#..............#',
  '#..............#',
  '#.11...22...33.#',
  '#..............#',
  '#..............#',
  '#..............#',
  '#..............#',
  '#..............#',
  'ffffffffffffffff',
];
const WRONG = [
  '################',
  '#..............#',
  '#..............#',
  '#..............#',
  '#..............#',
  '#.......X......#',
  '#..............#',
  '#..............#',
  '#.......B......#',
  'ffffffffffffffff',
];

export interface ParlorLinks {
  /** Map cells (absolute) of each link tile, by purpose. */
  talk: Record<'gr1' | 'gr2', { x: number; y: number }[]>;
  pins: Record<'gr1' | 'gr2', { x: number; y: number }[]>;
  grExit: Record<'gr1' | 'gr2', { x: number; y: number }>;
  /** Per round and suspect: the three cards (two cells each) and the exit. */
  cards: Record<'r1' | 'r2', { x: number; y: number }[][][]>;
  ivExit: Record<'r1' | 'r2', { x: number; y: number }[]>;
  spots: { x: number; y: number }[];
  how: { x: number; y: number }[][];
  why: { x: number; y: number }[][];
  accBack: { x: number; y: number };
  wrongExit: { x: number; y: number };
}

/** Which suspect sits in which green room chair (by the talk tiles, left to right, top to bottom). */
const CHAIRS: [Who, number, number][] = [
  ['lila', 1, 3],
  ['edgar', 1, 6],
  ['agatha', 14, 3],
  ['felix', 14, 6],
  ['pike', 10, 8],
];
const TALK_FOR: Record<string, [number, number]> = { lila: [2, 3], edgar: [2, 6], agatha: [13, 3], felix: [13, 6], pike: [10, 7] };
/** On the stage at dawn, left to right. */
export const LINEUP: Who[] = ['agatha', 'felix', 'pike', 'lila', 'edgar'];

export const MONS: Who[] = ['lila', 'edgar', 'agatha', 'felix', 'pike', 'dobbs'];

export function buildParlorMonsters(): { mb: BlockSet; mon: Monster[] } {
  const mb = new BlockSet(100, true);
  const mon: Monster[] = [];
  MONS.forEach((who, i) => {
    mb.add(`${who}0`, figure(who));
    mb.add(`${who}1`, figure(who, true));
    const m = emptyMonster();
    m.used = 1;
    m.power = 100;
    m.end = -2;
    const blinkEvery = [70, 55, 90, 40, 120, 60][i];
    m.pic[0] = [mb.id(`${who}0`), blinkEvery];
    m.pic[1] = [mb.id(`${who}1`), 3];
    m.pic[2] = [mb.id(`${who}0`), 20 + i * 7];
    m.pic[3] = [mb.id(`${who}1`), 2];
    mon.push(m);
  });
  while (mon.length < 64) mon.push(emptyMonster());
  return { mb, mon };
}

export function buildParlorMap(bs: BlockSet): { map: GameMap; links: ParlorLinks } {
  const map = newMap();
  map.blocks.fill(bs.id('walltop'));
  const put = (x: number, y: number, name: string | number) => (map.blocks[y * 100 + x] = typeof name === 'number' ? name : bs.id(name));
  let mi = 0;
  const monster = (who: Who, x: number, y: number) => {
    map.monsters[mi++] = { monnum: MONS.indexOf(who), status: 0, xtra: 0, curx: x, cury: y, extra: 0 };
  };
  const stamp = (o: { x: number; y: number }, rows: string[], legend: (ch: string, x: number, y: number) => string | number) => {
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        put(o.x + x, o.y + y, legend(ch, x, y));
      }),
    );
  };
  const wallOrFloor = (ch: string, _x: number, y: number, floor: string): string | undefined => {
    if (ch === '#') return y === 0 ? 'wallpaper' : 'walltop';
    if (ch === '.') return floor;
    if (ch === 'w') return 'door';
    return undefined;
  };
  const links: ParlorLinks = {
    talk: { gr1: [], gr2: [] },
    pins: { gr1: [], gr2: [] },
    grExit: { gr1: { x: 0, y: 0 }, gr2: { x: 0, y: 0 } },
    cards: { r1: [], r2: [] },
    ivExit: { r1: [], r2: [] },
    spots: [],
    how: [],
    why: [],
    accBack: { x: 0, y: 0 },
    wrongExit: { x: 0, y: 0 },
  };

  // the green room, both rounds
  for (const round of ['gr1', 'gr2'] as const) {
    const o = ROOM[round];
    stamp(o, GR, (ch, x, y) => {
      const wf = wallOrFloor(ch, x, y, 'rug');
      if (wf) return y === 0 && x >= 3 && x <= 12 ? `cork${x % 4}` : y === 0 && (x === 1 || x === 14) ? 'fire' : wf;
      if (ch === 'a') return 'armchair';
      if (ch === 't') return 'talk';
      if (ch === 'E') return 'exit';
      if (ch === 's') return 'sofa';
      throw new Error(ch);
    });
    // pins along the board: the coroner's note, then the evidence of the round
    const pins =
      round === 'gr1'
        ? ['coroner', 'checklist', 'stub', 'chart', 'policy']
        : ['coroner', 'checklist', 'stub', 'chart', 'policy', 'ledger', 'umbrella', 'safe_ms', 'cuesheet'];
    const xs = round === 'gr1' ? [4, 6, 8, 10, 12] : [3, 4, 5, 6, 7, 8, 9, 10, 11];
    pins.forEach((name, i) => {
      put(o.x + xs[i], o.y + 1, name === 'coroner' ? 'coroner' : ITEMS.indexOf(name as (typeof ITEMS)[number]));
      links.pins[round].push({ x: o.x + xs[i], y: o.y + 1 });
    });
    for (const who of SUSPECTS) {
      const [tx, ty] = TALK_FOR[who];
      links.talk[round].push({ x: o.x + tx, y: o.y + ty });
    }
    for (const [who, x, y] of CHAIRS) monster(who, o.x + x, o.y + y);
    monster('dobbs', o.x + 4, o.y + 8);
    links.grExit[round] = { x: o.x + 2, y: o.y + 8 };
  }

  // interview rooms
  for (const round of ['r1', 'r2'] as const) {
    SUSPECTS.forEach((who, i) => {
      const o = ROOM[round](i);
      const cards: { x: number; y: number }[][] = [[], [], []];
      const r2 = ROUND2[who]!;
      stamp(o, IV, (ch, x, y) => {
        const wf = wallOrFloor(ch, x, y, 'rug');
        if (wf) return wf;
        if (ch === 'p') return 'plant';
        if (ch === 'P') return `por_${who}${x - 7 + (y - 1) * 2}`;
        if (ch === 'T') return `table${x - 7}`;
        if (ch === 'E') return 'exit';
        const q = Number(ch) - 1;
        const half = ch === '3' ? x - 7 : ch === '1' ? x - 2 : x - 12;
        cards[q].push({ x: o.x + x, y: o.y + y });
        if (round === 'r1') return `q_${CARDS.r1[q][0]}${half}`;
        const ask = r2[q];
        if (typeof ask === 'string') return `q_${ask}${half}`;
        return half === 0 ? ITEMS.indexOf(ask.item as (typeof ITEMS)[number]) : 'show';
      });
      links.cards[round].push(cards);
      links.ivExit[round].push({ x: o.x + 2, y: o.y + 8 });
    });
  }

  // the stage at dawn: who, how, why, a wrong answer, and the curtain
  const stage = (ch: string, _x: number, y: number): string | undefined => {
    if (ch === '#') return y === 0 ? 'dawnwall' : 'walltop';
    if (ch === 'f') return 'footlights';
    if (ch === '.') return 'stage';
    return undefined;
  };
  stamp(ROOM.who, WHO, (ch, x, y) => {
    const s = stage(ch, x, y);
    if (s) return s;
    if (ch === 's') return 'stage';
    if (ch === 'o') {
      links.spots.push({ x: ROOM.who.x + x, y: ROOM.who.y + y });
      return 'spot';
    }
    if (ch === 'B') {
      links.accBack = { x: ROOM.who.x + x, y: ROOM.who.y + y };
      return 'backdoor';
    }
    throw new Error(ch);
  });
  LINEUP.forEach((who, i) => monster(who, ROOM.who.x + 2 + i * 3, ROOM.who.y + 2));
  for (const [key, list, opts] of [
    ['how', links.how, HOW],
    ['why', links.why, WHY],
  ] as const) {
    const o = ROOM[key];
    const cells: { x: number; y: number }[][] = [[], [], []];
    stamp(o, CHOICE, (ch, x, y) => {
      const s = stage(ch, x, y);
      if (s) return s;
      const q = Number(ch) - 1;
      const half = ch === '1' ? x - 2 : ch === '2' ? x - 7 : x - 12;
      cells[q].push({ x: o.x + x, y: o.y + y });
      return `a_${opts[q][0]}${half}`;
    });
    list.push(...cells);
  }
  stamp(ROOM.wrong, WRONG, (ch, x, y) => {
    const s = stage(ch, x, y);
    if (s) return s;
    if (ch === 'X') return 'strike';
    if (ch === 'B') {
      links.wrongExit = { x: ROOM.wrong.x + x, y: ROOM.wrong.y + y };
      return 'backdoor';
    }
    throw new Error(ch);
  });
  // the curtain: a red room where a wrong answer waits for its verdict
  for (let y = 0; y < 10; y++) for (let x = 0; x < 16; x++) put(ROOM.curtain.x + x, ROOM.curtain.y + y, (x + y) % 2 ? 'curtain0' : 'curtain1');
  put(ROOM.curtain.x + 8, ROOM.curtain.y + 5, 'zcell');
  put(ROOM.curtain.x + 4, ROOM.curtain.y + 5, 'solved');
  reindexMonsters(map);
  return { map, links };
}

export { ITEM };

export { buildParlorBlocks } from './parlorBlocks';
