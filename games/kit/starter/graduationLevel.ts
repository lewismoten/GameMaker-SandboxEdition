// A graduation's second level (the first is the arrival, graduationArrive.ts), "The Aisle": a hall with the stage's helpers on the balcony, a red
// carpet to walk up, and a stage with a lectern, Doc Leo and the certificate. 48 x 13 blocks: the floor is row 10.
//   x  2        the doorway you start in
//   x  4..33    the carpet, with signs; the compact two-tier balcony sits beside the lectern at x 36..43
//   x 34..46    the stage; the banner hangs over the lectern (x 40), Doc Leo stands at x 42
// Touching the certificate (it lies on the lectern) is the door out: the link to the ending.
import type { GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { Book } from './book';
import { addStarterBlocks } from './blocks';
import { Grid } from './grid';
import { buildHeroBlocks } from './hero';
import { StarterMap, ORIGIN } from './map';
import { buildStarterPalette, type Pal } from './palette';
import { addSign, type Sign } from './sign';
import type { Graduation } from './graduationConfig';
import { addHallRamps, audienceOf } from './graduationCast';
import { addHallBlocks, type Timed } from './graduationHall';
import { ARRIVE, buildArrival } from './graduationArrive';
import { addFriendBlocks, FRIENDS } from './graduationFriends';

export const W = 48;
export const H = 13;
/** The floor's top row. */
export const FLOOR = 10;
/** The standing camera's top visible row (rows 0 to 3 are never seen while standing: nothing is hung there). */
export const VIEW_TOP = 4;
/** The balcony rail's row. */
export const BALCONY_RAIL = 6;
/** The lectern's column: touching it is the end of the walk. */
export const LECTERN = 40;
export const STAGE_FROM = 34;

export interface Level {
  file: string;
  title: string;
  hint: string;
  map: StarterMap;
  /** The level's own block set, its timed loops and the file it is saved to (without .bbl): the hall's is grad, the arrival's arrive. */
  book: Book;
  timed: Timed[];
  bbl: string;
}

export type SignName = 'start' | 'helpers' | 'cheer' | 'doc' | 'banner';

/** The block set, the timed loops and the signs. */
/** `withFriends` false leaves the gowned friends out (a hall that stands them itself and counts its blocks). */
export function buildBlocks(pal: Pal, cfg: Graduation, withFriends = true) {
  const book = new Book('bbl');
  const timed: Timed[] = [];
  addStarterBlocks(book, pal);
  const heroBlocks = buildHeroBlocks(pal);
  const pic = (n: string) => heroBlocks.pics.get(n)!;
  const hall = addHallBlocks(
    book,
    pal,
    timed,
    cfg.noBalconyHelpers ? [] : audienceOf(...cfg.groups),
    pic('stand.top'),
    pic('cheer2.top'),
    pic('blink.top'),
    cfg.theme,
    cfg.cameos,
    cfg.stillGuests,
  );
  const friends = withFriends ? addFriendBlocks(book, pal, timed) : [];
  const signs: Record<SignName, Sign> = {
    start: addSign(book, pal, 'start', cfg.signs.start, 4, 2, true),
    helpers: addSign(book, pal, 'helpers', cfg.signs.helpers, 4, 2, true),
    cheer: addSign(book, pal, 'cheer', cfg.signs.cheer, 4, 2, true),
    doc: addSign(book, pal, 'doc', cfg.signs.doc, 4, 2, true),
    banner: addSign(book, pal, 'banner', cfg.signs.banner, 4, 2, true),
  };
  return { book, timed, hall, signs, friends };
}

export function buildPalette(cfg: Graduation): Pal {
  return buildStarterPalette(addHallRamps([...new Set([...audienceOf(...cfg.groups), ...FRIENDS.slice(1)])]), cfg.id);
}

export const stamp = (m: StarterMap, s: Sign, x: number, y: number, legs: boolean): void => {
  s.board.forEach((row, dy) => row.forEach((name, dx) => m.set(x + dx, y + dy, name)));
  if (legs) m.set(x, y + s.board.length, s.legs[0]).set(x + s.board[0].length - 1, y + s.board.length, s.legs[1]);
};

/** A map whose finished form carries the hall's walls and boards on past its ends, so the screen never shows outdoors. */
export class HallMap extends StarterMap {
  constructor(
    private readonly blocks: Book,
    rows: string[],
    private readonly hallWidth = W,
  ) {
    super(blocks, rows);
  }

  override done(): GameMap {
    const map = super.done();
    const edge = this.blocks.n('curtainEdge');
    const sub = this.blocks.n('subfloor');
    for (let y = 0; y < MLEN; y++)
      for (let x = 0; x < MLEN; x++) {
        const inX = x >= ORIGIN && x < ORIGIN + this.hallWidth;
        if (y >= ORIGIN + H) map.blocks[y * MLEN + x] = sub;
        else if (y >= ORIGIN && !inX) map.blocks[y * MLEN + x] = edge;
      }
    return map;
  }
}

/** The columns the nine friends stand in: Kit and the helpers, in the gaps between the signs (x 9..12 and 17..21). */
const FRIENDS_AT = [9, 10, 11, 12, 17, 18, 19, 20, 21];

/** The hall. */
function aisle(
  book: Book,
  signs: Record<SignName, Sign>,
  hall: ReturnType<typeof buildBlocks>['hall'],
  friends: [string, string][],
  theme: Graduation['theme'],
  _guests: number,
): StarterMap {
  const g = new Grid(W, H);
  g.put(2, 8, 's').put(2, 9, 'S');
  const m = new HallMap(book, g.rows());
  // floor: the carpet, then the stage, and the boards under both
  for (let x = 1; x < W - 1; x++) {
    m.set(x, FLOOR, x < STAGE_FROM ? 'carpet' : 'stage');
    m.set(x, FLOOR + 1, 'subfloor').set(x, FLOOR + 2, 'subfloor');
  }
  // the ends of the hall: heavy drapes, solid
  for (let y = 0; y < H; y++) m.set(0, y, 'curtainEdge').set(W - 1, y, 'curtainEdge');
  // the valance and bunting, hung in the player's view (the top visible row)
  for (let x = 1; x < W - 1; x++) m.set(x, VIEW_TOP, 'valance');
  // pennants hang under it along the aisle (the helpers' heads take the row over the stage)
  for (let x = 1; x < STAGE_FROM; x++) m.set(x, VIEW_TOP + 1, x % 2 ? 'bunting0' : 'bunting1');
  // Two compact tiers at the lectern: the recorded final camera is world x=878..901.
  // Local columns 36..43 therefore fit together, with head rows 5 and 7 (20/60px below the view top).
  for (let x = 36; x < 44; x++) {
    m.set(x, BALCONY_RAIL, 'rail');
    m.set(x, BALCONY_RAIL + 2, 'rail').set(x, BALCONY_RAIL + 3, 'riser');
  }
  hall.helpers.forEach((name, i) => m.set(36 + i, BALCONY_RAIL - 1, name));
  hall.cameos.slice(0, hall.helpers.length).forEach((parts, i) => parts.forEach((name, k) => m.set(36 + i, BALCONY_RAIL + 2 - parts.length + k, name)));
  // the stage's own wall pieces, hung in view, a row above the signs
  const order = theme.decorOrder ?? [];
  if (order.length) for (let x = 3, i = 0; x < STAGE_FROM - 1; x += theme.decorEvery ?? 5, i++) m.set(x, VIEW_TOP + 2, `decor.${order[i % order.length]}`);
  // the stage: drapes at each side, a banner, the lectern with the certificate, Doc Leo
  for (let y = 2; y < FLOOR; y++) for (const x of [STAGE_FROM, STAGE_FROM + 1, W - 3, W - 2]) m.set(x, y, 'drape');
  stamp(m, signs.banner, STAGE_FROM - 4, VIEW_TOP, false);
  m.set(LECTERN, 8, 'scroll').set(LECTERN, 9, 'lectern');
  m.set(42, 8, hall.leoTop).set(42, 9, hall.leoBottom);
  // the signs along the carpet
  stamp(m, signs.start, 5, FLOOR - 1 - 2, true);
  stamp(m, signs.helpers, 13, FLOOR - 1 - 2, true);
  stamp(m, signs.cheer, 24, FLOOR - 1 - 2, true);
  stamp(m, signs.doc, 29, FLOOR - 1 - 2, true);
  // the Starter friends in their gowns, clapping on the floor in the gaps between the signs (blocks you walk through)
  friends.forEach(([top, bottom], i) => {
    const x = FRIENDS_AT[i];
    m.set(x, FLOOR - 2, top).set(x, FLOOR - 1, bottom);
  });
  // the certificate is the door
  m.exits.push({ from: [LECTERN + ORIGIN, 9 + ORIGIN] });
  return m;
}

/** The levels in order. */
export function buildLevels(cfg: Graduation) {
  const pal = buildPalette(cfg);
  const { book, timed, hall, signs, friends } = buildBlocks(pal, cfg);
  const arrival = buildArrival(cfg, pal);
  const levels: Level[] = [
    { file: ARRIVE, title: cfg.arrive.title, hint: cfg.arrive.hint, map: arrival.map, book: arrival.book, timed: arrival.timed, bbl: ARRIVE },
    { file: 'hall', title: cfg.level.title, hint: cfg.level.hint, map: aisle(book, signs, hall, friends, cfg.theme, cfg.cameos.length), book, timed, bbl: 'grad' },
  ];
  return { book, pal, timed, levels };
}
