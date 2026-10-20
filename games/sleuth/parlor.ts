// The rooms where Ada talks instead of searches (GREEN.BBL, GREEN.MAP, GREEN.MON): the
// green room with its evidence board, an interview room for each suspect in each round,
// and the stage at dawn where she names the killer. Every one of them is exactly one
// screen, and every scene that uses one starts Ada in its middle, so a question can lead
// to a whole new scene (the answer is its intro) that looks like the same room.
import { newMap, reindexMonsters, type GameMap } from '../../web/src/formats/map';
import { emptyMonster, type Monster } from '../../web/src/formats/monster';
import { Pixels } from '../kit/pixels';
import { BlockSet, SOLID, type BlockDef } from './blockset';
import { CLEAR, blob, microC, pool, speckle } from './draw';
import { c, ramp as r } from './pal';
import { addItems, boards, clone, footlight, stageBoards, symbol, wallFace, wallTop, T, ITEMS, ITEM } from './tiles';
import { figure, portrait, type Who } from './people';
import { CTR } from './ids';

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
export const ROUND2: Record<Who, (string | { item: string })[]> = {
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

// ---------------------------------------------------------------- art

function icon(p: Pixels, x: number, y: number, kind: string): void {
  const k = (n: string, s: number) => c(n, s);
  switch (kind) {
    case 'clock':
      p.disc(x + 6, y + 6, 6, k('gold', 3));
      p.disc(x + 6, y + 6, 5, k('paper', 5));
      p.line(x + 6, y + 6, x + 6, y + 2, k('black', 0)).line(x + 6, y + 6, x + 9, y + 6, k('black', 0));
      break;
    case 'mask':
      symbol(p, x, y, 'mask', k('paper', 5), k('black', 0));
      break;
    case 'eye':
      for (let i = 0; i < 12; i++) {
        const h = Math.round(Math.sin((i / 11) * Math.PI) * 4);
        p.rect(x + i, y + 6 - h, 1, h * 2 + 1, k('paper', 5));
      }
      p.disc(x + 6, y + 6, 3, k('teal', 2));
      p.disc(x + 6, y + 6, 1, k('black', 0));
      break;
    case 'dagger':
      p.line(x + 1, y + 11, x + 9, y + 3, k('grey', 6)).line(x + 2, y + 11, x + 10, y + 3, k('grey', 4));
      p.rect(x + 1, y + 8, 4, 2, k('gold', 3));
      p.line(x + 6, y + 2, x + 11, y + 7, k('velvet', 5));
      p.line(x + 11, y + 7, x + 9, y + 7, k('velvet', 5)).line(x + 11, y + 7, x + 11, y + 5, k('velvet', 5));
      break;
    case 'goblet':
      p.rect(x + 2, y + 1, 8, 5, k('gold', 3)).rect(x + 3, y + 2, 6, 2, k('green', 4));
      p.rect(x + 5, y + 6, 2, 4, k('gold', 2)).rect(x + 3, y + 10, 6, 2, k('gold', 3));
      break;
    case 'bulb':
      p.disc(x + 6, y + 5, 5, k('black', 2));
      p.rect(x + 4, y + 9, 5, 3, k('grey', 3));
      p.line(x + 1, y + 1, x + 11, y + 11, k('velvet', 5));
      break;
    case 'heart':
      p.disc(x + 4, y + 4, 3, k('velvet', 5)).disc(x + 8, y + 4, 3, k('velvet', 5));
      for (let i = 0; i < 6; i++) p.rect(x + 1 + i, y + 5 + i, 11 - i * 2, 1, k('velvet', 5));
      break;
    case 'coins':
      for (const [dx, dy] of [
        [2, 6],
        [6, 3],
        [7, 8],
      ])
        p.disc(x + dx + 1, y + dy + 1, 3, k('gold', 4)).set(x + dx + 1, y + dy + 1, k('gold', 1));
      break;
    case 'book':
      p.rect(x + 1, y + 1, 10, 11, k('paper', 5)).rect(x, y + 2, 10, 11, k('paper', 3));
      for (let i = 0; i < 4; i++) p.rect(x + 2, y + 4 + i * 2, 6, 1, k('black', 2));
      p.rect(x, y + 2, 1, 11, k('velvet', 3));
      break;
  }
}

/** A card on the floor, 40x20: an icon on the left and a word on the right. */
function card(word: string, iconKind?: string, floor = boards(11)): Pixels {
  const p = new Pixels(40, 20);
  p.blit(floor, 0, 0).blit(floor, 20, 0);
  p.rect(1, 2, 38, 16, c('paper', 4)).frame(1, 2, 38, 16, c('gold', 2)).frame(2, 3, 36, 14, c('paper', 2));
  if (iconKind) {
    icon(p, 4, 4, iconKind);
    microC(p, 27, 8, word, c('velvet', 2));
  } else microC(p, 20, 8, word, c('velvet', 2));
  return p;
}

function greenCarpet(): Pixels {
  const p = speckle(T(), 0, 0, 20, 20, r('green'), 1, 1, 77, 0.15);
  for (let i = 0; i < 20; i += 2) p.set(i, i, c('green', 2)).set(19 - i, i, c('green', 2));
  p.set(9, 9, c('gold', 1)).set(10, 10, c('gold', 1));
  return p;
}

function wallpaper(): Pixels {
  const p = T(c('teal', 1));
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x + y) % 10 === 0 || (x - y + 20) % 10 === 0) p.set(x, y, c('teal', 2));
  for (const [x, y] of [
    [5, 5],
    [15, 15],
  ])
    p.disc(x, y, 1, c('gold', 1));
  for (let x = 0; x < 20; x++) p.set(x, 0, c('gold', 2)).set(x, 17, c('panel', 2)).set(x, 18, c('panel', 1)).set(x, 19, c('black', 0));
  return p;
}

function velvetCurtain(seed = 0): Pixels {
  const p = T();
  for (let x = 0; x < 20; x++) {
    const fold = [1, 3, 5, 6, 5, 3, 2][(x + seed) % 7];
    for (let y = 0; y < 20; y++) p.set(x, y, c('velvet', fold));
  }
  return p;
}

export function buildParlorBlocks(): BlockSet {
  const bs = new BlockSet(150, false);
  const add = (name: string, p: Pixels, d: BlockDef = {}) => bs.add(name, p, d);
  const S = { solid: SOLID };
  addItems(bs, false);
  const B = boards(11);
  const RUG = greenCarpet();
  const ST = stageBoards(12);
  add('boards', B);
  add('rug', RUG);
  add('stage', ST);
  add('walltop', wallTop(), S);
  add('wallpaper', wallpaper(), S);
  add('wall', wallFace(), S);
  add('curtain0', velvetCurtain(0), S);
  add('curtain1', velvetCurtain(3), S);
  // the coroner's note: a pin on the board like the evidence
  add(
    'coroner',
    ((): Pixels => {
      const p = clone(B);
      p.rect(3, 2, 14, 16, c('paper', 5)).frame(3, 2, 14, 16, c('paper', 2));
      p.rect(5, 4, 10, 2, c('black', 1));
      for (let i = 0; i < 4; i++) p.rect(5, 8 + i * 2, 9, 1, c('black', 3));
      p.line(5, 16, 14, 16, c('velvet', 4));
      return p;
    })(),
  );
  // the evidence board on the north wall
  for (let i = 0; i < 4; i++)
    add(
      `cork${i}`,
      ((): Pixels => {
        const p = wallpaper();
        speckle(p, 0, 2, 20, 15, r('wood'), 4, 1, 30 + i, 0.4);
        p.rect(0, 2, 20, 1, c('wood', 1)).rect(0, 16, 20, 1, c('wood', 1));
        const xs = [3, 11, 7, 14];
        p.rect(xs[i], 5, 5, 6, c('paper', 4 + (i % 2)));
        p.set(xs[i] + 2, 5, c('velvet', 5));
        p.line(xs[i] + 2, 5, (xs[i] + 12) % 20, 9, c('velvet', 4));
        return p;
      })(),
      S,
    );
  add(
    'armchair',
    ((): Pixels => {
      const p = clone(RUG);
      blob(p, 10, 6, 9, 6, r('green'), 0, 2);
      blob(p, 10, 13, 8, 6, r('green'), 1, 3);
      blob(p, 2, 12, 2, 6, r('green'), 0, 2);
      blob(p, 18, 12, 2, 6, r('green'), 0, 2);
      return p;
    })(),
    S,
  );
  add(
    'sofa',
    ((): Pixels => {
      const p = clone(RUG);
      p.rect(0, 3, 20, 14, c('velvet', 2)).rect(0, 3, 20, 4, c('velvet', 1)).rect(0, 15, 20, 2, c('wood', 1));
      for (let x = 4; x < 20; x += 6) p.set(x, 10, c('gold', 3));
      return p;
    })(),
    S,
  );
  add(
    'fire',
    ((): Pixels => {
      const p = wallpaper();
      p.rect(1, 3, 18, 15, c('grey', 3)).rect(4, 7, 12, 11, c('black', 0));
      pool(p, 10, 16, 7, 6, r('glow'), 0, 3);
      p.rect(1, 3, 18, 2, c('grey', 5));
      return p;
    })(),
    { ...S, next: 'fire2', ntime: 4 },
  );
  add(
    'fire2',
    ((): Pixels => {
      const p = wallpaper();
      p.rect(1, 3, 18, 15, c('grey', 3)).rect(4, 7, 12, 11, c('black', 0));
      pool(p, 10, 15, 6, 7, r('glow'), 0, 4);
      p.rect(1, 3, 18, 2, c('grey', 5));
      return p;
    })(),
    { ...S, next: 'fire', ntime: 5 },
  );
  add(
    'plant',
    ((): Pixels => {
      const p = clone(RUG);
      p.disc(10, 14, 5, c('brick', 2));
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2;
        p.line(10, 10, 10 + Math.cos(ang) * 9, 9 + Math.sin(ang) * 7, c('green', 2 + (a % 3)));
      }
      return p;
    })(),
    S,
  );
  add(
    'talk',
    ((): Pixels => {
      const p = clone(RUG);
      p.disc(10, 10, 7, c('gold', 1));
      p.disc(10, 10, 6, c('paper', 4));
      microC(p, 10, 8, '?', c('velvet', 2));
      return p;
    })(),
  );
  add(
    'exit',
    ((): Pixels => {
      const p = clone(B);
      p.rect(2, 4, 16, 12, c('velvet', 1)).frame(2, 4, 16, 12, c('gold', 2));
      microC(p, 10, 8, 'EXIT', c('gold', 4));
      return p;
    })(),
  );
  add(
    'door',
    ((): Pixels => {
      const p = T(c('panel', 3));
      p.rect(0, 0, 2, 20, c('panel', 1)).rect(18, 0, 2, 20, c('panel', 1));
      p.frame(4, 3, 12, 14, c('panel', 2));
      p.set(15, 10, c('gold', 4));
      return p;
    })(),
    S,
  );
  // a portrait of each suspect across four blocks, behind the table
  const frame = c('gold', 2);
  for (const who of SUSPECTS) {
    const big = new Pixels(40, 40, c('teal', 0));
    for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) big.set(x, y, c('teal', y < 20 ? 0 : 1));
    big.blit(portrait(who, 40), 0, 2, CLEAR);
    big.frame(0, 0, 40, 40, frame);
    for (let i = 0; i < 4; i++) add(`por_${who}${i}`, big.crop((i % 2) * 20, Math.floor(i / 2) * 20, 20, 20), S);
  }
  const tbl = new Pixels(40, 20);
  tbl.blit(RUG, 0, 0).blit(RUG, 20, 0);
  tbl.rect(0, 2, 40, 14, c('wood', 2)).rect(0, 2, 40, 2, c('wood', 4)).rect(0, 15, 40, 2, c('wood', 0));
  tbl.disc(10, 8, 3, c('paper', 5)).disc(10, 8, 2, c('wood', 1)); // a cup of tea
  tbl.rect(26, 6, 9, 6, c('paper', 4)); // Ada's notebook
  for (let i = 0; i < 3; i++) tbl.rect(27, 7 + i * 2, 7, 1, c('navy', 1));
  add('table0', tbl.crop(0, 0, 20, 20), S);
  add('table1', tbl.crop(20, 0, 20, 20), S);
  // question cards
  const cardBlocks = (key: string, word: string, iconKind?: string, floor?: Pixels) => {
    const p = card(word, iconKind, floor);
    add(`${key}0`, p.crop(0, 0, 20, 20));
    add(`${key}1`, p.crop(20, 0, 20, 20));
  };
  for (const [w, ic] of CARDS.r1) cardBlocks(`q_${w}`, w, ic);
  for (const w of ['LETTER?', 'ROLE?', 'WINE?']) cardBlocks(`q_${w}`, w);
  // "SHOW" beside an item from Ada's pocket
  add(
    'show',
    ((): Pixels => {
      const p = clone(B);
      p.rect(0, 2, 19, 16, c('paper', 4)).frame(0, 2, 19, 16, c('gold', 2));
      microC(p, 9, 8, 'SHOW', c('velvet', 2));
      return p;
    })(),
  );
  // the stage at dawn
  add(
    'dawnwall',
    ((): Pixels => {
      const p = velvetCurtain(1);
      p.rect(0, 0, 20, 2, c('gold', 3));
      return p;
    })(),
    S,
  );
  add('footlights', footlight(1), S);
  add(
    'spot',
    ((): Pixels => {
      const p = clone(ST);
      pool(p, 10, 10, 10, 10, r('glow'), 0, 2);
      p.ring(10, 10, 8, c('glow', 3));
      return p;
    })(),
  );
  for (const [w, ic] of [...HOW, ...WHY]) cardBlocks(`a_${w}`, w, ic, ST);
  add(
    'backdoor',
    ((): Pixels => {
      const p = clone(ST);
      p.rect(2, 4, 16, 12, c('navy', 1)).frame(2, 4, 16, 12, c('gold', 2));
      microC(p, 10, 6, 'BACK', c('gold', 4));
      microC(p, 10, 12, 'OFF', c('gold', 4));
      return p;
    })(),
  );
  // the Commissioner's verdict: one strike (when one is owed)
  add(
    'strike',
    ((): Pixels => {
      const p = clone(ST);
      pool(p, 10, 10, 10, 10, r('ghost'), 0, 1);
      return p;
    })(),
    { effect: CTR.strike, eamt: -1, hp: -200 },
  );
  // Behind the curtain: a wrong answer owes a strike (and costs points) on its way to the
  // Commissioner; the right one is worth a fortune on its way to the curtain call.
  const dark = T(c('black', 0));
  pool(dark, 10, 10, 9, 9, r('velvet'), 0, 2);
  add('zcell', clone(dark), { effect: CTR.strike, eamt: 1, score: -500 });
  add('solved', clone(dark), { score: 5000 });
  return bs;
}

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
      const r2 = ROUND2[who];
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
