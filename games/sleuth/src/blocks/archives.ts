// The lobby's history wall, hung by the Port Ellery Historical Society's archives committee
// for opening night: a portrait of the town crier who read the Declaration aloud on this
// spot, his bronze plaque, and a clipping from the Courier's morgue.
//
// The clipping is a bad print: PIKE'S PLAY: RAYEN BRINE. Push on a smudged word while
// carrying the lens and the lens spends a charge to read it right (the same paid touch
// that finds the ticket stub), so the misprint corrects itself, one character at a time:
// PIKE'S PLAY: RAVEN BRIDE. The plaque pays 1776 points to whoever reads it.
import { Pixels } from '../../../kit/pixels';
import { microC } from '../art/draw';
import { c } from '../art/pal';
import { CTR } from '../ids';
import { Add, S, on, wallFace } from './painters';

/** Three wall faces side by side, to hang a 60x20 picture on. */
function wall3(): Pixels {
  const w = new Pixels(60, 20);
  for (let i = 0; i < 3; i++) w.blit(wallFace(i), i * 20, 0);
  return w;
}

/** The town crier of 1776, in oils: black tricorn, wire spectacles, a fringed hunting shirt. */
function portrait(): Pixels {
  return on(wallFace(), (p) => {
    p.rect(2, 2, 16, 17, c('gold', 3)).frame(2, 2, 16, 17, c('gold', 1)).set(2, 2, c('gold', 5));
    p.rect(4, 4, 12, 13, c('green', 0));
    // the shirt and its fringed cape collar, a red placket down the front
    p.rect(5, 13, 10, 4, c('paper', 3));
    p.rect(4, 12, 12, 2, c('paper', 4));
    for (let x = 4; x < 16; x += 2) p.set(x, 14, c('paper', 2));
    p.rect(9, 13, 2, 4, c('velvet', 3));
    // face, grey-brown hair, spectacles
    p.rect(7, 7, 6, 5, c('skin', 3)).rect(8, 11, 4, 1, c('skin', 2));
    p.set(6, 8, c('tan', 1)).set(13, 8, c('tan', 1)).set(6, 9, c('tan', 1)).set(13, 9, c('tan', 1));
    p.rect(7, 8, 2, 1, c('grey', 5)).rect(11, 8, 2, 1, c('grey', 5)).set(9, 8, c('grey', 3)).set(10, 8, c('grey', 3));
    p.set(8, 9, c('black', 0)).set(11, 9, c('black', 0));
    p.set(9, 10, c('skin', 2)).rect(9, 11, 2, 1, c('velvet', 1));
    // the tricorn: a wide upturned brim, its point to the front
    p.rect(5, 6, 10, 1, c('black', 1)).rect(4, 5, 12, 1, c('black', 0)).rect(6, 4, 8, 1, c('black', 1));
    p.set(4, 4, c('black', 0)).set(15, 4, c('black', 0)).set(9, 7, c('black', 1)).set(10, 7, c('black', 1));
    p.set(7, 4, c('black', 2));
  });
}

/** The bronze plaque: JULY 8, 1776 / DECLARATION / READ HERE, with bolts in the corners. */
function plaque(): Pixels {
  const w = wall3();
  w.rect(3, 1, 54, 19, c('gold', 1)).frame(3, 1, 54, 19, c('gold', 3));
  for (const [x, y] of [
    [4, 2],
    [55, 2],
    [4, 18],
    [55, 18],
  ])
    w.set(x, y, c('gold', 5));
  microC(w, 30, 2, 'JULY 8, 1776', c('gold', 4));
  microC(w, 30, 8, 'DECLARATION', c('gold', 5));
  microC(w, 30, 14, 'READ HERE', c('gold', 4));
  return w;
}

/**
 * The clipping: COURIER 1931 / PIKE'S PLAY: / RAVEN BRIDE, misprinted RAYEN BRINE. The two
 * bad letters fall in the left and right blocks, so each is a word the lens can fix.
 */
function clipping(right: boolean): Pixels {
  const w = wall3();
  w.rect(2, 0, 56, 20, c('gold', 2)).rect(3, 1, 54, 18, c('paper', 4)).rect(3, 1, 54, 7, c('paper', 2));
  microC(w, 30, 2, 'COURIER 1931', c('black', 0));
  microC(w, 30, 8, "PIKE'S PLAY:", c('black', 0));
  microC(w, 30, 14, right ? 'RAVEN BRIDE' : 'RAYEN BRINE', c('black', 0));
  if (!right) for (const [x, y] of [[15, 13], [18, 18], [42, 13], [48, 18]]) w.set(x, y, c('grey', 3)); // blotted ink
  return w;
}

export function addArchives(add: Add): void {
  add('portrait', portrait(), S);
  const pl = plaque();
  add('plaque0', pl.crop(0, 0, 20, 20), S);
  add('plaque1', pl.crop(20, 0, 20, 20), { ...S, touch: 'plaque1r', score: 1776 });
  add('plaque2', pl.crop(40, 0, 20, 20), S);
  add('plaque1r', pl.crop(20, 0, 20, 20), S);
  const bad = clipping(false);
  const good = clipping(true);
  // a smudged word: the lens spends a charge and reads it right
  add('clip0x', bad.crop(0, 0, 20, 20), { ...S, effect: CTR.lens, eamt: -1, touch: 'clip0' });
  add('clip1', bad.crop(20, 0, 20, 20), S);
  add('clip2x', bad.crop(40, 0, 20, 20), { ...S, effect: CTR.lens, eamt: -1, touch: 'clip2' });
  add('clip0', good.crop(0, 0, 20, 20), S);
  add('clip2', good.crop(40, 0, 20, 20), S);
}
