// The cart return in LaVale Mall's lot, a nod to Shakespeare in Sweatpants' Cart Return Seven:
// a crooked blue CART RETURN 7 sign on two posts (two blocks wide) beside a pipe corral with
// two carts nested in it, snow on everything. Plain scenery (walked over like the lot).
import { Pixels } from '../../../kit/pixels';
import { micro } from '../art/font';
import type { Ctx } from './book';

export function cartReturn(k: Ctx, lot: (seed: number) => Pixels): { cartSign0: Pixels; cartSign1: Pixels; cartCorral: Pixels } {
  const { c } = k;
  // the sign: two blocks of lot, two posts, and the board hung crooked (its right end 2px low)
  const big = new Pixels(40, 20).blit(lot(47), 0, 0).blit(lot(48), 20, 0);
  for (const x of [9, 29])
    big
      .rect(x, 12, 2, 8, c('concrete', 2))
      .rect(x + 1, 12, 1, 8, c('concrete', 1))
      .rect(x - 1, 19, 4, 1, c('snow', 5));
  // lit like the lot's MALL sign, so it reads at night: a bright blue board, dark letters
  const board = new Pixels(36, 13);
  board.rect(0, 0, 36, 13, c('bulbs', 3)).frame(0, 0, 36, 13, c('ink', 0));
  micro(board, 3, 2, 'CART', c('ink', 0));
  micro(board, 3, 7, 'RETURN 7', c('ink', 0));
  // hung crooked: it steps down a pixel at two gaps between the letters
  for (let x = 0; x < 36; x++) {
    const dy = x >= 26 ? 2 : x >= 14 ? 1 : 0;
    for (let y = 0; y < 13; y++) big.set(2 + x, 2 + dy + y, board.get(x, y));
    // snow along the top edge
    if (x % 7 !== 3) big.set(2 + x, 1 + dy, c('snow', 6));
  }
  // the corral: galvanized rails, closed at the sign's end, two carts nested in it
  const corral = lot(49);
  const cart = (x: number) => {
    corral.frame(x, 8, 9, 5, c('concrete', 1));
    for (let i = x + 2; i < x + 8; i += 2) corral.rect(i, 9, 1, 3, c('concrete', 2));
    corral.rect(x - 1, 7, 1, 3, c('coat', 3)).set(x - 1, 7, c('coat', 2));
    corral.set(x + 1, 13, c('ink', 0)).set(x + 7, 13, c('ink', 0));
    corral.rect(x + 1, 8, 6, 1, c('snow', 5));
  };
  cart(5);
  cart(9);
  for (const y of [5, 15])
    corral
      .rect(0, y, 20, 1, c('concrete', 3))
      .rect(0, y + 1, 20, 1, c('concrete', 1))
      .rect(0, y - 1, 20, 1, c('snow', 6));
  corral.rect(1, 5, 1, 11, c('concrete', 3)).rect(0, 16, 3, 1, c('snow', 5));
  return { cartSign0: big.crop(0, 0, 20, 20), cartSign1: big.crop(20, 0, 20, 20), cartCorral: corral };
}
