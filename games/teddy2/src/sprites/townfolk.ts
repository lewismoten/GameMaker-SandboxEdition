// People and things on Main Street and the Town Commons: the Town Crier in his tricorn and
// linen hunting shirt with a hand bell (it is Founders' Day), bells to ring, the electric
// company's bucket, a "HEAR YE!" bubble, and pigeons' cousins.
import { Pixels } from '../../../kit/pixels';
import { blob, micro, sprite } from '../art/draw';
import { P } from '../art/pal';
import { CK } from './klown';

const c = (n: string, k: number) => P.c(n, k);
const K: Record<string, number> = {
  ...CK,
  l: c('paint', 2),
  L: c('paint', 3),
  f: c('cloud', 1),
  u: c('stone', 2),
  U: c('stone', 3),
  a: c('wood', 1),
  A: c('wood', 2),
  d: c('dirt', 1),
};

/**
 * The Town Crier, 20x40: a black tricorn, wire glasses, grey-brown hair, an off-white linen
 * hunting shirt with a fringed cape collar and a red placket, breeches, buckled shoes.
 * His bell is a monster of its own, held up beside him (see bell()).
 */
export function townCrier(asleep: boolean): Pixels {
  const rows = [
    '....................',
    '...o..........o.....',
    '..oooooooooooooo....',
    '...oooooooooooo.....',
    '....oauaaauaao......',
    '....osSSSSSSso......',
    asleep ? '....ommmSSmmmo......' : '....omwmSSmwmo......',
    asleep ? '....oSkkSSkkSo......' : '....oSokSSokSo......',
    '....osSSSrSSso......',
    '.....osSkkSso.......',
    '......osSSso........',
    '...ooLLLqqLLLoo.....',
    '..oLfLfLqqLfLfLo....',
    '.oLLLLLLqqLLLLLLo...',
    '.oLfLfLfqqfLfLfLo...',
    '.oLLlLLLqqLLLlLLo...',
    'oSoLLLLLqqLLLLLoSo..',
    'oSoLLlLLqqLLlLLoSo..',
    '.o.oLLLLLLLLLLo.o...',
    '...oLLLLLLLLLLo.....',
    '...oaaaaaaaaaao.....',
    '...oLLLLLLLLLLo.....',
    '...ofLfLfLfLfLo.....',
    '....oxxxxxxxxo......'.replace(/x/g, 'h'),
    '....ohhhhohhhho.....',
    '....ohhhhohhhho.....',
    '....ohhho.ohhho.....',
    '....oLLLo.oLLLo.....',
    '....oLLLo.oLLLo.....',
    '....oLLLo.oLLLo.....',
    '....oLLLo.oLLLo.....',
    '...ooeooo.ooeooo....',
    '..ooooooo.oooooooo..',
  ];
  if (asleep) rows[0] = '..............k.k...';
  return sprite(rows, K, 0, 40 - rows.length, 20, 40);
}

/** A brass hand bell (phase 1 and 2: swinging, ringing). */
export function bell(phase = 0, handle = true): Pixels {
  const p = new Pixels(20, 20, 255);
  const tilt = phase === 1 ? -2 : phase === 2 ? 2 : 0;
  if (handle) p.rect(9 + tilt, 4, 2, 5, c('wood', 2)).rect(9 + tilt, 4, 2, 1, c('wood', 4));
  for (let y = 9; y < 17; y++) {
    const half = 2 + Math.floor((y - 9) / 2);
    const sh = Math.round(((y - 9) * tilt) / 8);
    p.rect(10 - half + sh + tilt, y, half * 2, 1, y === 9 ? c('gold', 2) : c('gold', y < 13 ? 2 : 1));
  }
  p.rect(7 + tilt, 16, 7, 1, c('gold', 0));
  p.rect(9 + tilt * 2, 17, 2, 2, c('ink', 1));
  p.set(8 + tilt, 11, c('fur', 2));
  if (phase) {
    for (const [x, y] of [
      [3, 8],
      [2, 11],
      [16, 8],
      [17, 11],
    ])
      p.set(x, y, c('yellow', 3)).set(x + (x < 10 ? -1 : 1), y + 1, c('yellow', 3));
  }
  return p;
}

/** The ding of a rung bell, falling: a ring of little lines. */
export function ding(phase: number): Pixels {
  const p = new Pixels(20, 20, 255);
  p.ring(10, 10, 3 + phase * 2, c('yellow', 3));
  micro(p, 4, 8, phase ? '' : 'DING', c('ink', 0));
  return p;
}

/** A speech bubble with up to two short words in it (3x5 letters). */
export function bubble(words: string[], base = new Pixels(20, 20, 255)): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  blob(p, 10, 8, 10, 8, [c('fur', 1), c('fur', 2), c('fur', 2)], 0, 2, 0.4);
  p.set(4, 17, c('fur', 2)).set(3, 18, c('fur', 2)).set(2, 19, c('fur', 2));
  words.forEach((w, i) => micro(p, 10 - Math.floor((w.length * 4 - 1) / 2), 3 + i * 7, w, c('ink', 0)));
  return p;
}

/** The electric company's bucket: open-topped, its rim the thing to stand on. */
export function bucket(): Pixels {
  return sprite(
    ['ooooooooooooooooooo.', 'oyyyyyyyyyyyyyyyyyo.', '.oYYYYYYYYYYYYYYYo..', '.oYYYyyyYYYYYYYYYo..', '.oYYYYYYYYYYYYYYYo..', '..oYYYYYYYYYYYYYo...', '..ooooooooooooooo...', '........omo.........', '........omo.........'],
    { ...K, y: c('yellow', 3), Y: c('yellow', 2) },
    0,
    0,
  );
}

/** A rolled-up proclamation tied with a red ribbon (the Crier's: it is worth treats). */
export function scroll(): Pixels {
  return sprite(['.oooooooooo.', 'oLLLLLLLLLLo', 'oLlLLqqLLlLo', 'oLLLLqqLLLLo', '.oooooooooo.'], K, undefined, 2);
}
