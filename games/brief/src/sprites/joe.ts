// joe.cbl: Mystery Robot Joe, the night librarian. A tin box of a robot with a bulb on his
// antenna, reading glasses he does not need, a red bow tie, and a tally counter for a heart
// (its little window always reads the words he is carrying, in spirit).
import { Pixels } from '../../../kit/pixels';
import { CLEAR } from '../art/draw';
import { c } from '../art/pal';
import { BlockSet } from '../blocks/sets';

type Dir = 'down' | 'up' | 'side';

/** One 20x20 frame of Joe. `step` 0/1 swaps his legs and arms; side frames face left. */
export function joe(dir: Dir, step: number, look: 'open' | 'blink' | 'shh' = 'open'): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const O = c('ink', 0);
  const box = (x: number, y: number, w: number, h: number, face: number, hi: number, lo: number) => {
    p.rect(x, y, w, h, O);
    p.rect(x + 1, y + 1, w - 2, h - 2, face);
    p.rect(x + 1, y + 1, w - 2, 1, hi).rect(x + 1, y + 1, 1, h - 2, hi);
    p.rect(x + w - 2, y + 2, 1, h - 3, lo);
  };
  // antenna and its bulb (a light that is on when Joe is thinking, i.e. always)
  p.rect(9, 1, 2, 2, c('tin', 2));
  p.rect(9, 0, 2, 1, look === 'shh' ? c('red', 4) : c('yellow', 3));
  // head
  box(5, 2, 10, 7, c('tin', 4), c('tin', 5), c('tin', 2));
  if (dir === 'down') {
    for (const gx of [6, 11]) p.frame(gx, 4, 3, 3, c('brass', 2));
    p.rect(9, 5, 2, 1, c('brass', 2));
    if (look === 'blink') p.rect(7, 5, 1, 1, c('tin', 1)).rect(12, 5, 1, 1, c('tin', 1));
    else p.set(7, 5, O).set(12, 5, O);
    if (look === 'shh') p.rect(9, 7, 2, 1, O).rect(9, 6, 1, 2, c('tin', 1));
    else p.rect(8, 7, 4, 1, c('tin', 1)).set(9, 7, O).set(11, 7, O);
  } else if (dir === 'side') {
    p.frame(6, 4, 3, 3, c('brass', 2));
    p.rect(9, 5, 4, 1, c('brass', 1));
    p.set(7, 5, look === 'blink' ? c('tin', 1) : O);
    p.rect(6, 7, 3, 1, c('tin', 1));
  } else {
    // the back of his head: a hatch with four screws
    p.frame(7, 4, 6, 4, c('tin', 2));
    for (const [sx, sy] of [
      [7, 4],
      [12, 4],
      [7, 7],
      [12, 7],
    ])
      p.set(sx, sy, c('brass', 3));
  }
  // neck and bow tie
  p.rect(9, 9, 2, 1, c('tin', 1));
  if (dir !== 'up') {
    p.rect(dir === 'side' ? 7 : 8, 9, 4, 1, c('red', 2));
    p.set(dir === 'side' ? 8 : 9, 9, c('red', 4));
  }
  // body
  box(4, 10, 12, 6, c('tin', 3), c('tin', 4), c('tin', 1));
  if (dir === 'down') {
    // the tally counter heart: a little window of digits and a winding knob
    p.rect(7, 11, 6, 3, O);
    p.rect(8, 12, 4, 1, c('paper', 4));
    p.set(9, 12, O).set(11, 12, O);
    p.set(13, 12, c('brass', 3)).set(14, 12, c('brass', 1));
  } else if (dir === 'side') {
    p.rect(5, 12, 2, 2, c('brass', 2));
  } else {
    p.frame(7, 11, 6, 4, c('tin', 2));
  }
  // arms
  const swing = step ? 1 : 0;
  if (dir === 'side') {
    p.rect(9 + (swing ? -2 : 1), 11, 2, 4, c('tin', 2));
    p.rect(9 + (swing ? -2 : 1), 15, 2, 1, c('brass', 2));
  } else {
    p.rect(2, 11 + swing, 2, 4, c('tin', 2)).rect(2, 15 + swing, 2, 1, c('brass', 2));
    p.rect(16, 12 - swing, 2, 4, c('tin', 2)).rect(16, 16 - swing, 2, 1, c('brass', 2));
  }
  // legs and feet
  const legs = dir === 'side' ? (step ? [6, 11] : [8, 9]) : [6, 11];
  legs.forEach((lx, i) => {
    const up = dir !== 'side' && step && i === 0 ? 1 : dir !== 'side' && !step && i === 1 ? 1 : 0;
    p.rect(lx + 1, 16, 2, 3 - up, c('tin', 2));
    p.rect(lx, 19 - up, 4, 1, O);
  });
  return p;
}

export function buildJoeBlocks(): BlockSet {
  const cb = new BlockSet(50, true);
  cb.add('down0', joe('down', 0));
  cb.add('down1', joe('down', 1));
  cb.add('blink', joe('down', 0, 'blink'));
  cb.add('up0', joe('up', 0));
  cb.add('up1', joe('up', 1));
  cb.add('side0', joe('side', 0));
  cb.add('side1', joe('side', 1));
  cb.add('shh', joe('down', 0, 'shh'));
  return cb;
}
