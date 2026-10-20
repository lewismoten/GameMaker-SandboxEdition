// Townsfolk and their things (monster and block art): kids who want a high five or a
// "sit!", the mail carrier and his truck, balloons tied to boxes.
import { Pixels } from '../kit/pixels';
import { blob, sprite } from './draw';
import { CK } from './klown';
import { P } from './pal';

const K: Record<string, number> = {
  ...CK,
  a: P.c('skin', 1),
  A: P.c('skin', 2),
  f: P.c('wood', 0),
  F: P.c('gwin', 1),
  l: P.c('blue', 0),
  L: P.c('blue', 1),
};
const S = (rows: string[], dx?: number, dy?: number, w = 20, h = 20) => sprite(rows, K, dx, dy, w, h);

/** A raised hand (held out above Teddy for a high five), with a little "5!". */
export function hand(skin = 'S'): Pixels {
  const sk = skin;
  return S(
    [
      `.o.o.o.......`,
      `o${sk}o${sk}o${sk}o.ooo..`,
      `o${sk}o${sk}o${sk}o.oYYo.`,
      `o${sk}${sk}${sk}${sk}${sk}${sk}o.oYoo.`,
      `o${sk}${sk}${sk}${sk}${sk}${sk}ooo.oYo`,
      `o${sk}${sk}${sk}${sk}${sk}${sk}${sk}o.oYYo`,
      `.o${sk}${sk}${sk}${sk}${sk}o..ooo.`,
      `..o${sk}${sk}${sk}o......`,
      `..oRRRRo......`,
      `..oRRRRo......`,
    ],
    3,
    10,
  );
}

/** A kid sitting on the porch steps with a hand up (the hand is the monster above). */
export function kid(variant: 'girl' | 'boy'): Pixels {
  return variant === 'girl'
    ? S([
        '..oo....oo..',
        '.oFFoooooFFo',
        '.oFFFFFFFFFo',
        '..oFsssssFo.',
        '..osksskso..',
        '..ossssssoS.',
        '...osRRso.So',
        '..oPPPPPPoSo',
        '.oPPPPPPPPo.',
        '.oSoPPPPoSo.',
        '..ooLLLLoo..',
        '..oLLooLLo..',
        '..oRRo.oRRo.',
      ])
    : S([
        '...ooooo....',
        '..oBBBBBo...',
        '.oBBBBBBBoo.',
        '..oasssao...',
        '..osksskso..',
        '..osssssoS..',
        '...osRso.So.',
        '..oGGGGGGoSo',
        '.oGGGGGGGGo.',
        '.oSoGGGGoSo.',
        '..ooLLLLoo..',
        '..oLLooLLo..',
        '..oyyo.oyyo.',
      ]);
}

/** A cardboard box floating on three balloons. */
export function balloonBox(phase: number): Pixels {
  const p = new Pixels(20, 20, 255);
  const bob = phase ? 1 : 0;
  p.line(6, 8 + bob, 9, 13, P.c('ink', 1))
    .line(10, 6 + bob, 10, 13, P.c('ink', 1))
    .line(14, 8 + bob, 11, 13, P.c('ink', 1));
  blob(p, 5, 4 + bob, 3.4, 4, P.r('red'), 1, 3);
  blob(p, 10, 2 + bob, 3.4, 4, P.r('yellow'), 0, 3);
  blob(p, 15, 4 + bob, 3.4, 4, P.r('blue'), 1, 3);
  box(p, 13);
  return p;
}

/** A cardboard box sitting on the ground (or falling). */
export function crate(): Pixels {
  const p = new Pixels(20, 20, 255);
  box(p, 7);
  return p;
}

function box(p: Pixels, top: number): void {
  const h = 20 - top;
  p.rect(2, top, 16, h, P.c('wood', 3));
  p.rect(2, top, 16, 2, P.c('wood', 4));
  p.frame(2, top, 16, h, P.c('wood', 0));
  p.rect(9, top, 2, Math.min(4, h), P.c('yellow', 3));
  if (h > 8) p.line(5, top + 5, 8, top + 5, P.c('wood', 1)).line(12, top + 8, 15, top + 8, P.c('wood', 1));
}

/** The mail truck, two blocks long: [back, front], facing right. */
export function mailTruck(phase: number): [Pixels, Pixels] {
  const big = S(
    [
      '..oooooooooooooooooooooo..........',
      '..owwwwwwwwwwwwwwwwwwwwwo.........',
      '..owwwwwwwwwwwwwwwwwwwwwooooooo...',
      '..owBBBBBwwwwRRRRRwwwwwwoBBBBBwo..',
      '..owBwwwBwwwwwwwwwwwwwwwoBBBBBBwo.',
      '..owBBBBBwwwwwwwwwwwwwwwoBBBBBBBwo',
      '..owwwwwwwwwwwwwwwwwwwwwowwwwwwwwo',
      '..oRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRo',
      '..owwwwwwwwwwwwwwwwwwwwwwwwwwwwwyo',
      '..oooooooooooooooooooooooooooooooo',
      phase ? '.....ooo..................ooo....' : '....ooooo................ooooo...',
      phase ? '....omMmo................omMmo...' : '....oMmMo................oMmMo...',
      '.....ooo..................ooo....',
    ],
    3,
    7,
    40,
    20,
  );
  return [big.crop(0, 0, 20, 20), big.crop(20, 0, 20, 20)];
}

/** The mail carrier, waving: 20x40. */
export function mailCarrier(): Pixels {
  return S(
    [
      '......ooooo.........',
      '.....oLLLLLo........',
      '....oLLLLLLLo.......',
      '....ooooooooo.......',
      '.....osssssso.......',
      '.....oskssks.o......',
      '.....ossssss.oSo....',
      '......osRRso.oSo....',
      '.......osso..oSo....',
      '....ooLLLLLLooLo....',
      '...oLLLLLLLLLLLo....',
      '...oLoLLLLLLoLo.....',
      '...oLoLLyLLLo.......',
      '...oSohhhhhhhho.....',
      '...oo.hHHHHHHHo.....',
      '......hhhhhhhhh.....',
      '.....olllllllo......',
      '.....olllllllo......',
      '.....olllolllo......',
      '.....olllolllo......',
      '.....olllolllo......',
      '.....olllolllo......',
      '.....olllolllo......',
      '.....ooooooooo......',
      '....oooo..oooo......',
    ],
    0,
    15,
    20,
    40,
  );
}
