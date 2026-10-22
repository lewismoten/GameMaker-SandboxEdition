// The Klown Klub: Doc Leo's friends, two blocks tall and kind to dogs. Honker (a horn and
// polka dots, always up for a high five), Bubbles (a bubble wand; she loves a good sit),
// Twirly (a tutu; ask her about spinning), and Professor Pratfall (practicing pie throws,
// for science). Plus the things around the ring: bowling pins, pies, bubbles.
import { Pixels } from '../../../kit/pixels';
import { blob, sprite } from '../art/draw';
import { CK } from './klown';
import { P } from '../art/pal';

const K: Record<string, number> = {
  ...CK,
  a: P.c('pink', 1),
  A: P.c('pink', 3),
  l: P.c('purple', 1),
  L: P.c('purple', 3),
  c: P.c('wood', 2),
  C: P.c('wood', 3),
  d: P.c('dirt', 3),
  z: P.c('green', 2),
  Z: P.c('green', 1),
  x: P.c('cloud', 2),
};
const S = (rows: string[], dx = 0) => sprite(rows, K, dx, 40 - rows.length, 20, 40);

/** A white-faced clown head with a red nose and a big smile (5 rows wide 8). */
const FACE = ['....owwwwwwo........', '...owwbwwbwwo.......', '...owwwRRwwwo.......', '...owRwwwwRwo.......', '....owRRRRwo........', '.....owwwwo.........'];

export const KLUB: Record<string, Pixels> = {
  // Honker: yellow polka dots, a bulb horn, one hand held up for a high five.
  honker: S([
    '.......oo...........',
    '......oRRo..........',
    '.....oRRRRo.........',
    '....ooooooooo.......',
    ...FACE,
    '.....ooyyoo.........',
    '...ooyyYyyyoo.......',
    '..oyyRyyyyRyyo......',
    '..oyyyyyRyyyyo......',
    '..oyRyyyyyyRyo......',
    '..oyyyyRyyyyyo......',
    '..oSoyyyyyyoSo......',
    '..oSoRyyyyRoqRo.....',
    '..ooooyyyyyoqRRo....',
    '.....oyyRyyoo.......',
    '.....obbbbbo........',
    '.....obbobbo........',
    '.....obbobbo........',
    '.....obbobbo........',
    '....oooooooooo......',
    '...oRRRRooRRRRo.....',
    '...ooooooooooooo....',
  ]),
  // Bubbles: pink curls, a bubble wand.
  bubbles: S([
    '...oo.....oo........',
    '..oAAo...oAAo.......',
    '..oAAAoooAAAo.......',
    '...oAAAAAAAo........',
    ...FACE,
    '.....oaaaao.....xx..',
    '...ooaaaaaaoo..x..x.',
    '..oaaaAaaAaaao.x..x.',
    '..oaaAaaaaAaao..xx..',
    '..oaaaaAAaaaaoSo.o..',
    '..oaaaaaaaaaaoSoo...',
    '..oSoaaaaaaao.o.....',
    '..oSoaaaaaaao.......',
    '...o.oaaaaaao.......',
    '....oaaaaaaaao......',
    '...oaaaaaaaaaao.....',
    '...ooooooooooo......',
    '.....oSo..oSo.......',
    '.....oSo..oSo.......',
    '....ooooo.ooooo.....',
    '....oAAAo.oAAAo.....',
    '....ooooo.ooooo.....',
  ]),
  // Twirly: a purple tutu, on her toes.
  twirly: S([
    '......oooo..........',
    '.....oLLLLo.........',
    '....oLLLLLLo........',
    '....oooooooo........',
    ...FACE,
    '.....ollllo.........',
    '..oSoollllooSo......',
    '...oSollllloSo......',
    '....ollLllllo.......',
    '....ollllLllo.......',
    '....olllllllo.......',
    '..ooxxxxxxxxxoo.....',
    '.oxxxxxxxxxxxxxo....',
    'oxxxxxxxxxxxxxxxo...',
    '.oooooooooooooo.....',
    '......oSoSo.........',
    '......oSoSo.........',
    '......oSoSo.........',
    '......oSoSo.........',
    '......oSoSo.........',
    '.....oLLoLLo........',
    '.....oooooooo.......',
  ]),
  // Professor Pratfall: tweed, spectacles, a pie at the ready.
  pratfall: S([
    '....oooooooo........',
    '....occccccco.......',
    '...occccccccco......',
    '...ooooooooooo......',
    '....owwwwwwo........',
    '...owoooooowo.......',
    '...owomowmowo.......',
    '...owwwRRwwwo.......',
    '....owRRRRwo........',
    '.....owwwwo.........',
    '....ooccccoo........',
    '..occcCcccCcco......',
    '..occccCcccccooo....',
    '..occcccCccccoxxxo..',
    '..ocCcccccccCoddddo.',
    '..occcccccccco.oSo..',
    '..oSocccccccooSo....',
    '..oSocccccco........',
    '...o.occcccco.......',
    '.....oCCCCCCo.......',
    '.....oCCoCCCo.......',
    '.....oCCoCCCo.......',
    '.....oCCoCCCo.......',
    '....ooooooooooo.....',
    '...oRRRRRooRRRRo....',
    '...oooooooooooooo...',
  ]),
};

/** A stack of bowling pins (blocks the way until something rolls into it). */
export function pinStack(): Pixels {
  const p = new Pixels(20, 20, 255);
  const pinAt = (x: number, y: number) => {
    p.rect(x + 1, y, 2, 2, P.c('fur', 2))
      .rect(x + 1, y + 2, 2, 1, P.c('red', 2))
      .rect(x, y + 3, 4, 4, P.c('fur', 2));
    p.set(x, y + 3, P.c('ink', 1)).set(x + 3, y + 6, P.c('fur', 0));
  };
  for (const x of [1, 6, 11, 15]) pinAt(x, 13);
  for (const x of [3, 8, 13]) pinAt(x, 6);
  pinAt(8, 0);
  return p;
}

/** The pins after the fluff ball rolls through: scattered. */
export function pinsDown(): Pixels {
  const p = new Pixels(20, 20, 255);
  for (const [x, y] of [
    [1, 17],
    [7, 18],
    [12, 16],
  ])
    p.rect(x, y, 7, 2, P.c('fur', 2)).rect(x + 5, y, 1, 2, P.c('red', 2));
  p.rect(15, 12, 2, 7, P.c('fur', 2)).rect(15, 14, 2, 1, P.c('red', 2));
  return p;
}

/** A custard pie, flying (at head height: play dead under it). */
export function pie(phase: number): Pixels {
  const p = new Pixels(20, 20, 255);
  blob(p, 10, 6 + phase, 6, 3, P.r('cloud'), 0, 2);
  p.rect(4, 7 + phase, 12, 3, P.c('wood', 3)).rect(4, 9 + phase, 12, 1, P.c('wood', 1));
  p.set(9, 3 + phase, P.c('red', 2)).set(10, 3 + phase, P.c('red', 3));
  return p;
}

/** A soap bubble drifting up. */
export function bubble(phase: number): Pixels {
  const p = new Pixels(20, 20, 255);
  p.ring(10, 10, 4 + phase, P.c('water', 3));
  p.set(8, 8, P.c('fur', 2)).set(9, 7, P.c('fur', 2));
  return p;
}

/** Gwinn sitting nicely (as Teddy showed her), the red nose at her feet when `nose`. */
export function gwinnSits(nose: boolean, wag: number): Pixels {
  const K2: Record<string, number> = {
    o: P.c('gwinn', 0),
    d: P.c('gwinn', 1),
    g: P.c('gwinn', 2),
    G: P.c('gwinn', 3),
    h: P.c('gwinn', 4),
    w: P.c('fur', 2),
    k: P.c('ink', 0),
    p: P.c('tongue', 1),
    r: P.c('red', 2),
    R: P.c('red', 3),
    y: P.c('yellow', 3),
  };
  const rows = [
    '......ooooo.........',
    '.....oGhhGGo........',
    '....odoGGGGGo.......',
    '....odoGkGGkGo......',
    '....oddoGGGGGo......',
    '.....ooGwwwGo.......',
    '......oGkkGo........',
    '......orrryo........',
    '.....oGGGGgo........',
    '....oGGwwGGgo.......',
    '....oGGwwGGgo.......',
    '....oGGGGGGgo' + (wag ? 'oo....' : '.o....'),
    '...ogGGGGGggo' + (wag ? '.o....' : 'o.....'),
    '...oggggggggo.......',
    '...ogdo..odgo.......',
    nose ? '..ooooo..ooooo.oRRo.' : '..ooooo..ooooo......',
    nose ? '...............oRo..' : '....................',
  ];
  return sprite(rows, K2, 0, 20 - rows.length);
}
