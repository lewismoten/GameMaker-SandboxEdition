// A little shop for the Starters that teach spending (BUY IT, KIT'S SHOP). Three kinds of block:
//
//   cash          a coin that adds to the Money counter (counter 3). Counter 3 is the one counter the
//                 DOS status page (F2) prints as a number: "Money: 4". It has its own sounds too.
//   awning        the striped roof of a stall, with its PRICE on a hanging card (passable)
//   stallN        the counter: solid, with the item in its window. Its rule: Effect counter 3, Effect
//                 amount -N. A touch needs more than N coins (the counter holds one extra), so with too
//                 few nothing happens; with enough, the engine takes N coins and turns the block into
//   give<Item>    the same counter, SOLD, but passable: touching it hands over the item (a key adds to
//                 its counter, a heart adds a life) and turns it into
//   sold          the empty counter with a SOLD card.
//
// Why two steps? A block has one "Effect counter". The price uses it, so the item comes from the next
// block in the chain. The hero walks on, steps into the passable block, and the item is his.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
import { Book, PULL, SOLID } from './book';
import { KEYS } from './blocks';
import { SILVER_KEYS } from './locks';
import { skyOf, type Pal } from './palette';

/** Counter 3, "Money": the hero's own counter, shown as a number on the DOS status page (F2). */
export const MONEY = 3;

/** What a stall can sell. */
export type Item = 'key' | 'silver' | 'heart';

const WINDOW = { x: 2, y: 2, w: 16, h: 9 };

/** The item's picture, small, inside the window. */
function drawItem(p: Pixels, pal: Pal, item: Item): void {
  const ink = pal.c('ink', 0);
  if (item === 'heart') {
    const red = pal.r('red');
    p.draw(5, 3, ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'], { '#': red[2] });
    p.set(6, 4, red[4]).set(7, 4, red[4]).set(6, 5, red[3]);
    return;
  }
  const m = pal.r(item === 'key' ? 'gold' : 'white');
  const face = m[item === 'key' ? 3 : 2];
  p.disc(5.5, 6.5, 3, ink).disc(5.5, 6.5, 2, face).set(5, 6, ink).set(6, 6, ink);
  p.rect(8, 5, 8, 3, ink).rect(9, 6, 6, 1, face).rect(12, 8, 2, 2, ink).rect(15, 8, 1, 2, ink).rect(12, 8, 1, 1, face);
}

/** One 3x5 letter for the SOLD card (the 8x8 font is too wide for four letters in a window). */
const TINY: Record<string, string[]> = {
  S: ['###', '#..', '###', '..#', '###'],
  O: ['###', '#.#', '#.#', '#.#', '###'],
  L: ['#..', '#..', '#..', '#..', '###'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
};

/** The counter of a stall: item in the window, planks below. Sold: the window is empty, with a red SOLD card. */
function counterPicture(pal: Pal, item: Item | null): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const w = pal.r('wood');
  p.rect(0, 0, 20, 20, ink).rect(1, 1, 18, 18, w[2]).rect(1, 1, 18, 1, w[4]);
  // the window: dark frame, cream wall inside, a shelf line under the item
  p.rect(WINDOW.x - 1, WINDOW.y - 1, WINDOW.w + 2, WINDOW.h + 2, w[0]);
  p.rect(WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h, pal.c('parch', 3));
  p.rect(WINDOW.x, WINDOW.y + WINDOW.h - 1, WINDOW.w, 1, pal.c('parch', 1));
  if (item) {
    drawItem(p, pal, item);
  } else {
    // SOLD, in red, in 3x5 letters
    const red = pal.c('red', 2);
    [...'SOLD'].forEach((ch, i) =>
      TINY[ch].forEach((row, y) => [...row].forEach((c, x) => c === '#' && p.set(WINDOW.x + 1 + i * 4 + x, WINDOW.y + 2 + y, red))),
    );
  }
  // planks on the front
  p.rect(1, 12, 18, 1, w[0]);
  for (const x of [6, 13]) p.rect(x, 13, 1, 6, w[1]);
  p.rect(1, 18, 18, 1, w[0]);
  return p;
}

/** The roof of a stall: red and white stripes, and a card hanging with the price: a coin and a number. */
function awningPicture(pal: Pal, price: number): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const red = pal.r('red');
  const white = pal.r('white');
  p.rect(0, 0, 20, 8, ink);
  for (let x = 0; x < 5; x++) p.rect(1 + x * 4, 1, 4, 5, x % 2 ? white[3] : red[2]);
  for (let x = 0; x < 5; x++) p.rect(1 + x * 4, 6, 4, 1, x % 2 ? white[2] : red[1]);
  // scallops under the stripes
  for (let x = 0; x < 5; x++) p.rect(1 + x * 4 + 1, 7, 2, 1, x % 2 ? white[2] : red[1]);
  // posts and the hanging card
  const w = pal.r('wood');
  p.rect(0, 8, 2, 12, ink).rect(0, 8, 1, 12, w[3]);
  p.rect(18, 8, 2, 12, ink).rect(19, 8, 1, 12, w[2]);
  p.rect(3, 9, 14, 11, ink).rect(4, 10, 12, 9, pal.c('parch', 4));
  p.disc(7.5, 14.5, 2.4, pal.c('gold', 1)).disc(7.5, 14.5, 1.6, pal.c('gold', 4));
  const g = FONT8X8.subarray(('0'.charCodeAt(0) + price) * 8, ('0'.charCodeAt(0) + price) * 8 + 8);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (g[y] & (1 << x)) p.set(10 + x, 11 + y, ink);
  return p;
}

/** The coin that adds to the Money counter: the Starter coin, with no score (this is spending, not scoring). */
export function addCash(book: Book): void {
  const coin = book.pics.get('coin');
  if (!coin) throw new Error('addCash needs the Starter coin block first');
  book.add('cash', coin, { grav: PULL.down, effect: MONEY, eamt: 1, touch: 'sky' });
}

/** The empty, SOLD counter, once (every item's stall ends here). Add it before any stall. */
export function addSold(book: Book, pal: Pal): void {
  book.add('sold', counterPicture(pal, null), { grav: PULL.down });
}

/** The roof for a price. */
export function addAwning(book: Book, pal: Pal, price: number): void {
  book.add(`awning${price}`, awningPicture(pal, price), { grav: PULL.down });
}

/** Block names for an item's stall: `stall<Item><price>` is the counter you bump, `give<Item>` is the step after. */
export const stallName = (item: Item, price: number) => `stall.${item}.${price}`;
export const giveName = (item: Item) => `give.${item}`;

/** A stall's counter priced `price` that sells `item`, and (once per item) the passable block that hands the item over. */
export function addStall(book: Book, pal: Pal, item: Item, price: number): void {
  if (!book.has(giveName(item))) {
    const rule = item === 'heart' ? { effect: 1, eamt: 1 } : { effect: item === 'key' ? KEYS : SILVER_KEYS, eamt: 1 };
    // the same picture as the sold counter: the item is already in your hand
    book.add(giveName(item), counterPicture(pal, null), { grav: PULL.down, touch: 'sold', ...rule });
  }
  book.add(stallName(item, price), counterPicture(pal, item), { solid: SOLID, effect: MONEY, eamt: -price, touch: giveName(item) });
}
