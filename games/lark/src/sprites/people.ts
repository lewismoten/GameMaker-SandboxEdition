// The friends Joe meets, drawn as 20x20 blocks in the game's ramps: Doc Leo (fedora, wire
// glasses, white greasepaint round his eyes and mouth, a sunburned pink nose, gray stubble, a
// purple shirt, green tie, corduroy jacket, blue suspenders, red sneakers), Sir Reginald
// Cluckington III on his leash, and the Clown Club in the square (scenery, waving, all friendly).
import { Pixels } from '../../../kit/pixels';
import { CLEAR } from '../art/draw';
import { c } from '../art/pal';

/** Doc Leo from the front. `wave` lifts his right hand; `glad` is the big painted grin. */
export function leo(wave = false, glad = false): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const O = c('ink', 0);
  // fedora: chewed-up brim, a dent in the crown
  p.rect(5, 0, 10, 1, O);
  p.rect(6, 1, 8, 3, c('wood', 1)).rect(7, 1, 2, 1, c('wood', 0));
  p.rect(6, 3, 8, 1, c('ink', 1));
  p.rect(3, 4, 14, 1, c('wood', 1)).set(3, 4, c('wood', 0)).set(16, 4, CLEAR).set(15, 4, c('wood', 0));
  // face: skin, white greasepaint round the eyes and mouth, gray stubble, a pink nose
  p.rect(6, 5, 8, 6, c('skin', 2));
  p.rect(6, 5, 3, 3, c('paper', 4)).rect(11, 5, 3, 3, c('paper', 4));
  p.frame(6, 5, 3, 3, c('stone', 2)).frame(11, 5, 3, 3, c('stone', 2));
  p.rect(9, 6, 2, 1, c('stone', 2));
  p.set(7, 6, O).set(12, 6, O);
  p.rect(9, 7, 2, 2, c('pink', 1));
  p.rect(7, 9, 6, 2, c('paper', 4));
  if (glad) p.rect(8, 9, 4, 1, c('red', 1)).set(7, 8, c('paper', 4)).set(12, 8, c('paper', 4));
  else p.rect(8, 10, 4, 1, c('red', 1));
  p.set(6, 10, c('stone', 3)).set(13, 10, c('stone', 3)).set(6, 9, c('stone', 3)).set(13, 9, c('stone', 3));
  p.frame(5, 5, 10, 7, O);
  p.rect(6, 11, 8, 1, c('stone', 3));
  // purple shirt, green tie, brown corduroy jacket, blue suspenders
  p.rect(4, 12, 12, 5, c('wood', 2));
  for (let y = 12; y < 17; y++) p.set(5, y, c('wood', 1)).set(14, y, c('wood', 1));
  p.rect(7, 12, 6, 5, c('purple', 2));
  p.rect(9, 12, 2, 4, c('green', 2)).set(9, 16, c('green', 1));
  p.rect(7, 12, 1, 5, c('blue', 2)).rect(12, 12, 1, 5, c('blue', 2));
  p.frame(3, 12, 14, 5, O);
  // arms: the left holds Reggie's leash; the right waves
  p.rect(2, 13, 2, 4, c('wood', 2)).rect(2, 17, 2, 1, c('skin', 2));
  if (wave) p.rect(16, 8, 2, 5, c('wood', 2)).rect(16, 7, 2, 1, c('skin', 2));
  else p.rect(16, 13, 2, 4, c('wood', 2)).rect(16, 17, 2, 1, c('skin', 2));
  // trousers and red sneakers
  p.rect(6, 17, 3, 2, c('wood', 0)).rect(11, 17, 3, 2, c('wood', 0));
  p.rect(5, 19, 4, 1, c('red', 2)).rect(11, 19, 4, 1, c('red', 2));
  return p;
}

/** Sir Reginald Cluckington III, the rubber chicken, on his leash (it runs off the left edge). */
export function reggie(step = 0): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const Y = c('yellow', 3);
  const O = c('ink', 0);
  // leash from the top left corner, where Doc Leo's hand is in the next block
  for (let x = 0; x < 8; x++) p.set(x, 14 + Math.round(x / 4), c('red', 1));
  p.rect(9, 9, 6, 6, Y).frame(9, 9, 6, 6, O);
  p.rect(12, 5, 4, 5, Y).frame(12, 5, 4, 5, O);
  p.rect(13, 3, 2, 2, c('red', 3));
  p.rect(16, 7, 2, 1, c('brass', 3));
  p.set(14, 6, O);
  p.rect(10, 15, 1, 3 + step, c('brass', 2)).rect(13, 15, 1, 4 - step, c('brass', 2));
  return p;
}

/** A Clown Club clown in the crowd: a round face, a big painted smile, a ruff and a polka-dot suit. */
export function clown(suit: string, hair: string, step = 0): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const O = c('ink', 0);
  // curly hair either side, a little hat on top
  p.disc(5, 6, 2.5, c(hair, 2)).disc(14, 6, 2.5, c(hair, 2));
  p.rect(8, 0, 4, 3, c('blue', 2)).rect(7, 3, 6, 1, c('blue', 1));
  p.disc(9.5, 7, 4, c('paper', 4));
  p.set(8, 6, O).set(11, 6, O);
  p.disc(9.5, 8, 1, c('red', 3));
  p.rect(7, 10, 6, 1, c('red', 2)).set(6, 9, c('red', 2)).set(13, 9, c('red', 2));
  // ruff
  for (let x = 4; x < 16; x += 2) p.rect(x, 12, 2, 1, x % 4 ? c('paper', 3) : c('paper', 4));
  // suit with dots
  p.rect(5, 13, 10, 5, c(suit, 2)).frame(5, 13, 10, 5, O);
  for (const [x, y] of [
    [7, 14],
    [11, 15],
    [8, 16],
  ])
    p.set(x, y, c('yellow', 3));
  // waving arm
  if (step) p.rect(15, 9, 2, 5, c(suit, 2)).rect(15, 8, 2, 1, c('paper', 4));
  else p.rect(15, 13, 2, 4, c(suit, 2)).rect(15, 17, 2, 1, c('paper', 4));
  p.rect(3, 13, 2, 4, c(suit, 2)).rect(3, 17, 2, 1, c('paper', 4));
  // big shoes
  p.rect(4, 18, 5, 2, c('red', 2)).rect(11, 18, 5, 2, c('red', 2));
  return p;
}
