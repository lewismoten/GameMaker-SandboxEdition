// GRADUATION: FIRST STEPS' one level, "The Aisle": a hall with the helpers of The Basics on the balcony, a red
// carpet to walk up, and a stage with a lectern, Doc Leo and the certificate. 48 x 13 blocks: the floor is row 10.
//   x  2        the doorway you start in
//   x  4..33    the carpet, with signs; the balcony (rail and front) is above, the helpers leaning on it
//   x 34..46    the stage; the banner hangs over the lectern (x 40), Doc Leo stands at x 42
// Touching the certificate (it lies on the lectern) is the door out: the link to the ending.
import type { GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { Book } from '../../kit/starter/book';
import { addStarterBlocks } from '../../kit/starter/blocks';
import { Grid } from '../../kit/starter/grid';
import { buildHeroBlocks } from '../../kit/starter/hero';
import { StarterMap, ORIGIN } from '../../kit/starter/map';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';
import { addSign, type Sign } from '../../kit/starter/sign';
import { addHallRamps, audienceOf } from './cast';
import { addHallBlocks, type Timed } from './hall';

export const W = 48;
export const H = 13;
/** The floor's top row. */
export const FLOOR = 10;
/** The lectern's column: touching it is the end of the walk. */
export const LECTERN = 40;
export const STAGE_FROM = 34;

export interface Level {
  file: string;
  title: string;
  hint: string;
  map: StarterMap;
}

type SignName = 'start' | 'helpers' | 'cheer' | 'doc' | 'banner';

/** The block set, the timed loops and the signs. */
export function buildBlocks(pal: Pal) {
  const book = new Book('bbl');
  const timed: Timed[] = [];
  addStarterBlocks(book, pal);
  const heroBlocks = buildHeroBlocks(pal);
  const pic = (n: string) => heroBlocks.pics.get(n)!;
  const hall = addHallBlocks(book, pal, timed, audienceOf('The Basics'), pic('stand.top'), pic('cheer2.top'), pic('blink.top'));
  const signs: Record<SignName, Sign> = {
    start: addSign(book, pal, 'start', 'WALK UP TO THE STAGE', 4, 2),
    helpers: addSign(book, pal, 'helpers', 'YOUR HELPERS ARE HERE', 4, 2),
    cheer: addSign(book, pal, 'cheer', 'THEY CHEER FOR YOU', 4, 2),
    doc: addSign(book, pal, 'doc', 'DOC LEO HAS A SCROLL FOR YOU', 4, 2),
    banner: addSign(book, pal, 'banner', 'FIRST STEPS', 4, 2),
  };
  return { book, timed, hall, signs };
}

export function buildPalette(): Pal {
  return buildStarterPalette(addHallRamps(audienceOf('The Basics')), 'graduation-basics');
}

const stamp = (m: StarterMap, s: Sign, x: number, y: number, legs: boolean): void => {
  s.board.forEach((row, dy) => row.forEach((name, dx) => m.set(x + dx, y + dy, name)));
  if (legs) m.set(x, y + s.board.length, s.legs[0]).set(x + s.board[0].length - 1, y + s.board.length, s.legs[1]);
};

/** A map whose finished form carries the hall's walls and boards on past its ends, so the screen never shows outdoors. */
class HallMap extends StarterMap {
  constructor(
    private readonly blocks: Book,
    rows: string[],
  ) {
    super(blocks, rows);
  }

  override done(): GameMap {
    const map = super.done();
    const edge = this.blocks.n('curtainEdge');
    const sub = this.blocks.n('subfloor');
    for (let y = 0; y < MLEN; y++)
      for (let x = 0; x < MLEN; x++) {
        const inX = x >= ORIGIN && x < ORIGIN + W;
        if (y >= ORIGIN + H) map.blocks[y * MLEN + x] = sub;
        else if (y >= ORIGIN && !inX) map.blocks[y * MLEN + x] = edge;
      }
    return map;
  }
}

/** The hall. */
function aisle(book: Book, signs: Record<SignName, Sign>, hall: ReturnType<typeof buildBlocks>['hall']): StarterMap {
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
  // the ceiling's valance and bunting
  for (let x = 1; x < W - 1; x++) m.set(x, 0, 'valance').set(x, 1, x % 2 ? 'bunting0' : 'bunting1');
  // the balcony: a rail with a front, and the helpers leaning on it
  for (let x = 2; x < STAGE_FROM - 1; x++) m.set(x, 5, 'rail').set(x, 6, 'riser');
  hall.helpers.forEach((name, i) => m.set(4 + i * 4, 4, name));
  // the stage: drapes at each side, a banner, the lectern with the certificate, Doc Leo
  for (let y = 2; y < FLOOR; y++) for (const x of [STAGE_FROM, STAGE_FROM + 1, W - 3, W - 2]) m.set(x, y, 'drape');
  stamp(m, signs.banner, 37, 2, false);
  m.set(LECTERN, 8, 'scroll').set(LECTERN, 9, 'lectern');
  m.set(42, 8, hall.leoTop).set(42, 9, hall.leoBottom);
  // the signs along the carpet
  stamp(m, signs.start, 5, FLOOR - 1 - 2, true);
  stamp(m, signs.helpers, 13, FLOOR - 1 - 2, true);
  stamp(m, signs.cheer, 24, FLOOR - 1 - 2, true);
  stamp(m, signs.doc, 36, FLOOR - 1 - 2, true);
  // the certificate is the door
  m.exits.push({ from: [LECTERN + ORIGIN, 9 + ORIGIN] });
  return m;
}

/** The levels in order. */
export function buildLevels() {
  const pal = buildPalette();
  const { book, timed, hall, signs } = buildBlocks(pal);
  const levels: Level[] = [{ file: 'hall', title: 'The Aisle', hint: 'Walk up to the stage.', map: aisle(book, signs, hall) }];
  return { book, pal, timed, levels };
}
