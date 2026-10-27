// More friends, as 20x20 pictures in the game's ramps: Teddy (a red-gold corgi with a white
// blaze, his two big ears up and matching), Gwinn (chocolate brown, amber eyes, a pink collar),
// the Bard of Bizarre (a feathered hat, a lute, and his rooster in spectacles on his shoulder) and
// the third goat from the left (gray and white, curled horns, a beard, ears out).
import { Pixels } from '../../../kit/pixels';
import { CLEAR } from '../art/draw';
import { c } from '../art/pal';

/** A dog from the front, sitting: `coat` the ramp, `blaze` a white stripe down the face. */
function dog(coat: string, o: { blaze: boolean; collar: string; eyes: number; grin?: boolean; tongue?: boolean }): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const O = c('ink', 0);
  // ears: two matching triangles, upright
  for (const side of [0, 1]) {
    const x0 = side ? 12 : 4;
    for (let y = 0; y < 6; y++) {
      const w = Math.min(4, 1 + Math.floor(y / 1.4));
      const x = side ? x0 + 4 - w : x0;
      p.rect(x, y, w, 1, c(coat, 2));
      if (w > 2) p.rect(side ? x : x + 1, y, w - 2, 1, c('pink', 1));
    }
  }
  // head
  p.disc(10, 8, 5.5, c(coat, 2));
  if (o.blaze) p.rect(9, 3, 2, 8, c('paper', 4));
  // muzzle
  p.disc(10, 11, 3, o.blaze ? c('paper', 4) : c(coat, 3));
  p.rect(9, 10, 2, 1, O);
  // eyes
  p.set(7, 7, o.eyes).set(13, 7, o.eyes).set(7, 6, O).set(13, 6, O);
  if (o.grin) p.rect(8, 12, 4, 1, O).set(7, 11, O).set(12, 11, O);
  if (o.tongue) p.rect(9, 13, 2, 2, c('pink', 2));
  // collar
  p.rect(6, 14, 8, 1, c(o.collar, 2));
  // body sitting, chest and paws
  p.disc(10, 17, 4.5, c(coat, 2));
  p.disc(10, 17, 2.5, o.blaze ? c('paper', 4) : c(coat, 3));
  p.rect(6, 19, 3, 1, c(coat, 1)).rect(11, 19, 3, 1, c(coat, 1));
  return p;
}

/** Teddy the corgi, sitting, grinning. `wag` tips his head a little. */
export function teddy(glad = false): Pixels {
  return dog('wood', { blaze: true, collar: 'red', eyes: c('ink', 0), grin: true, tongue: glad });
}

/** Gwinn, sitting (caught, and pleased about it anyway). */
export function gwinnSit(): Pixels {
  return dog('brick', { blaze: false, collar: 'pink', eyes: c('brass', 3), grin: true, tongue: true });
}

/** Gwinn running flat out, a box of valentines in her mouth; frame 0/1 swaps her legs. Faces left. */
export function gwinnRun(frame: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const O = c('ink', 0);
  const coat = (k: number) => c('brick', k);
  p.rect(5, 9, 11, 5, coat(2)).rect(5, 9, 11, 1, coat(3));
  p.disc(4, 8, 3.5, coat(2));
  p.rect(1, 9, 3, 2, coat(3)).set(1, 9, O);
  p.set(3, 7, c('brass', 3));
  p.rect(4, 3, 2, 3, coat(2)).rect(6, 4, 2, 2, coat(1));
  p.rect(4, 11, 4, 1, c('pink', 2));
  // tail up
  p.rect(16, 7, 2, 2, coat(2)).set(18, 6, coat(2));
  // legs mid-gallop
  const legs = frame ? [6, 8, 13, 15] : [5, 9, 12, 16];
  for (const x of legs) p.rect(x, 14, 1, 4, coat(1));
  // the box of valentines, red with a white heart
  p.rect(0, 11, 4, 4, c('red', 2)).frame(0, 11, 4, 4, O);
  p.set(1, 12, c('paper', 4)).set(2, 12, c('paper', 4)).set(1, 13, c('paper', 4));
  return p;
}

/** The rooster in spectacles, 10x10 at (x, y) on `p`, facing left. */
function rooster(p: Pixels, x: number, y: number): void {
  const O = c('ink', 0);
  p.disc(x + 5, y + 6, 3, c('paper', 4));
  p.disc(x + 3, y + 3, 2, c('paper', 4));
  p.rect(x + 2, y, 3, 1, c('red', 3)).set(x + 3, y + 1, c('red', 3));
  p.set(x + 1, y + 3, c('brass', 3)).set(x, y + 3, c('brass', 3));
  p.set(x + 2, y + 5, c('red', 2));
  // spectacles
  p.frame(x + 2, y + 2, 2, 2, O);
  // tail feathers
  p.rect(x + 8, y + 3, 2, 1, c('green', 2))
    .rect(x + 8, y + 4, 2, 1, c('red', 2))
    .set(x + 9, y + 5, c('brass', 2));
  p.rect(x + 4, y + 9, 1, 1, c('brass', 2)).rect(x + 6, y + 9, 1, 1, c('brass', 2));
}

/** The Bard of Bizarre: a big feathered hat, a minstrel's tunic, a lute, his rooster on his shoulder. */
export function bard(strum = 0): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const O = c('ink', 0);
  // the hat, a long red feather sweeping back
  p.rect(4, 3, 11, 2, c('purple', 1)).rect(6, 1, 7, 2, c('purple', 2));
  p.line(12, 2, 17, 0, c('red', 3)).line(12, 3, 17, 1, c('red', 2));
  // a friendly face: greasepaint smile, pink nose, wire glasses
  p.rect(7, 5, 6, 5, c('skin', 2));
  p.rect(7, 8, 6, 2, c('paper', 4)).rect(8, 9, 4, 1, c('red', 1));
  p.frame(7, 6, 2, 2, c('stone', 2)).frame(11, 6, 2, 2, c('stone', 2));
  p.set(10, 7, c('pink', 1));
  p.frame(6, 5, 8, 6, O);
  // tunic, half and half
  p.rect(5, 11, 5, 6, c('green', 2)).rect(10, 11, 5, 6, c('brass', 2)).frame(4, 11, 12, 6, O);
  // the lute across him
  p.disc(7, 15, 2.5, c('wood', 4)).ring(7, 15, 2.5, c('wood', 1));
  p.line(9, 14, 15, 10, c('wood', 3));
  p.set(6 + strum, 15, c('ink', 1));
  // legs and pointed shoes
  p.rect(7, 17, 2, 2, c('purple', 1)).rect(11, 17, 2, 2, c('purple', 1));
  p.rect(5, 19, 4, 1, c('red', 2)).rect(11, 19, 4, 1, c('red', 2));
  // the rooster on his left shoulder
  rooster(p, 13, 4);
  return p;
}

/** The third goat from the left, from the front: `happy` 1 is her mouth open, mid-dance (or mid-scream). */
export function goat(happy: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const O = c('ink', 0);
  // curled horns
  p.ring(5, 3, 2, c('stone', 4)).ring(14, 3, 2, c('stone', 4));
  // ears out to the sides
  p.rect(1, 5, 4, 2, c('stone', 3)).rect(15, 5, 4, 2, c('stone', 3));
  // head, a white blaze, a gray muzzle
  p.disc(10, 7, 4.5, c('stone', 4));
  p.rect(9, 3, 2, 8, c('paper', 4));
  p.disc(10, 10, 2.5, c('stone', 3));
  p.set(7, 6, O).set(12, 6, O).set(7, 5, c('brass', 3)).set(12, 5, c('brass', 3));
  if (happy) p.rect(9, 11, 2, 2, O);
  else p.rect(9, 11, 2, 1, O);
  // beard
  p.rect(9, 13, 2, 2, c('paper', 3));
  // body and legs (one lifted when she dances)
  p.disc(10, 16, 4, c('stone', 4)).disc(11, 15, 2, c('paper', 4));
  p.rect(7, 18, 1, 2, c('stone', 2)).rect(12, 18 - happy, 1, 2, c('stone', 2));
  return p;
}
