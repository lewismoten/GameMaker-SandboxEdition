// Townsfolk and their things (monster and block art): kids who want a high five or a
// "sit!", the mail carrier and his truck, balloons tied to boxes.
import { Pixels } from '../../../kit/pixels';
import { blob, micro, sprite } from '../art/draw';
import { CK } from './klown';
import { P } from '../art/pal';

const K: Record<string, number> = {
  ...CK,
  a: P.c('skin', 1),
  A: P.c('skin', 2),
  f: P.c('wood', 0),
  F: P.c('gwinn', 1),
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

/** A costume piece caught on a bunch of balloons. */
export function balloonProp(prop: Pixels, phase: number): Pixels {
  const p = new Pixels(20, 20, 255);
  const bob = phase ? 1 : 0;
  p.line(6, 8 + bob, 9, 12, P.c('ink', 1)).line(14, 8 + bob, 11, 12, P.c('ink', 1));
  blob(p, 5, 4 + bob, 3.4, 4, P.r('pink'), 1, 3);
  blob(p, 15, 4 + bob, 3.4, 4, P.r('green'), 0, 2);
  blob(p, 10, 3 + bob, 3.4, 4, P.r('purple'), 1, 3);
  p.blit(prop.crop(0, 9, 20, 11), 0, 9 + bob, 255);
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

/** A speech bubble asking for a trick ("SIT?"), maybe showing what you get for it. */
export function askBubble(word: string, icon?: Pixels, phase = 0): Pixels {
  const p = new Pixels(20, 20, 255);
  const y0 = phase ? 1 : 0;
  p.rect(1, y0, 18, icon ? 15 : 9, P.c('fur', 2)).frame(1, y0, 18, icon ? 15 : 9, P.c('ink', 0));
  p.set(1, y0, 255).set(18, y0, 255);
  micro(p, 10 - Math.floor((word.length * 4 - 1) / 2), y0 + 2, word, P.c('red', 1));
  if (icon) p.blit(icon.crop(3, 11, 14, 9), 3, y0 + 7, 255);
  const tail = y0 + (icon ? 15 : 9);
  p.set(8, tail, P.c('fur', 2))
    .set(9, tail, P.c('fur', 2))
    .set(8, tail + 1, P.c('fur', 2))
    .set(7, tail + 2, P.c('ink', 0));
  p.set(7, tail, P.c('ink', 0))
    .set(10, tail, P.c('ink', 0))
    .set(7, tail + 1, P.c('ink', 0))
    .set(9, tail + 1, P.c('ink', 0));
  return p;
}

/** A frisbee, spinning (flies at Teddy's head height: play dead or hop). */
export function frisbee(phase: number): Pixels {
  const p = new Pixels(20, 20, 255);
  if (phase) {
    p.rect(3, 6, 14, 3, P.c('pink', 2)).rect(5, 5, 10, 1, P.c('pink', 3)).rect(4, 9, 12, 1, P.c('pink', 0));
  } else {
    p.rect(5, 5, 10, 4, P.c('pink', 2)).rect(3, 6, 14, 2, P.c('pink', 2)).rect(7, 5, 6, 1, P.c('pink', 3)).rect(5, 9, 10, 1, P.c('pink', 0));
  }
  return p;
}

/** A juggling busker from the Klown Klub (20x40): Juggles, tossing bowling pins. */
export function juggler(phase: number): Pixels {
  return S(
    [
      phase ? '...........W........' : '..W.................',
      phase ? '..........WRW.......' : '.WRW..........W.....',
      phase ? '...W.......W........' : '..W..........WRW....',
      phase ? '..WRW...ooooo.......' : '........ooooo.W.....',
      phase ? '...W...oGGGGGo......' : '.......oGGGGGo......',
      '......oGGGGGGGo.....',
      '......ooooooooo.....',
      '.......owwwwwo......',
      '.......owkwkwo......',
      '.......owwRwwo......',
      '.......owrrrwo......',
      '........owwwo.......',
      phase ? '.oSo..oVVVVVo.......' : '......oVVVVVo..oSo..',
      phase ? '..oSooVVyVVVVo......' : '.....oVVVyVVVooSo...',
      phase ? '....oVVVVyVVVVoSo...' : '...oSoVVVyVVVVo.....',
      '.....oVVVVyVVVVoo...',
      '.....oVVVVVVVVVo....',
      '.....oYYYYYYYYYo....',
      '.....obbbbbbbbbo....',
      '.....obbbbobbbbo....',
      '.....obbbbobbbbo....',
      '.....obbbo.obbbo....',
      '.....obbbo.obbbo....',
      '....oooooo.oooooo...',
      '...oRRRRRo.oRRRRRo..',
      '...oooooo...ooooooo.',
    ],
    0,
    14,
    20,
    40,
  );
}

/** A bowling pin, tumbling through the air at head height. */
export function pin(phase: number): Pixels {
  const p = new Pixels(20, 20, 255);
  const rows = phase
    ? ['..........', '.ooo..oo..', 'oWWWooWWo.', 'oWRWWWWWWo', 'oWWWooWWo.', '.ooo..oo..']
    : ['...oo.....', '..oWWo....', '..oWWo....', '...oRo....', '..oWWWo...', '.oWWWWWo..', '.oWWWWWo..', '..ooooo...'];
  p.draw(5, phase ? 4 : 2, rows, { o: P.c('ink', 0), W: P.c('fur', 2), R: P.c('red', 2) });
  return p;
}

/** A yellow taxi, two blocks long: [back, front], facing left. */
export function taxi(phase: number): [Pixels, Pixels] {
  const big = S(
    [
      '..........oooooooooooo..........',
      '.........oBBBoyyyoBBBBo.........',
      '........oBBBBoyyyoBBBBBo........',
      '..ooooooooooooooooooooooooooooo.',
      '.oyyyyyyyyyyyyyyyyyyyyyyyyyyyyyo',
      'oWyyyyyyyyyyyyoyyyyyyyyyyyyyyyRo',
      'oyyyyyyyyyyyyyoyyyyyyyyyyyyyyyyo',
      'ooooooooooooooooooooooooooooooo.',
      phase ? '...ooo.................ooo.....' : '..ooooo...............ooooo....',
      phase ? '..omMmo...............omMmo....' : '..oMmMo...............oMmMo....',
      '...ooo.................ooo.....',
    ],
    4,
    9,
    40,
    20,
  );
  return [big.crop(0, 0, 20, 20), big.crop(20, 0, 20, 20)];
}
