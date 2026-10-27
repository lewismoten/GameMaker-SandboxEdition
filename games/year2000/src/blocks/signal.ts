// "Restoring the Signal": the antique corner of the Teleport-A-Phone Exchange. A 1916 oak
// crank telephone (crank it and the bells ring for good, worth 1916 points) and a TTY
// teleprinter that keeps typing the same tip on its paper roll, with no phone line at all.
//
// The TTY is a 2x2 picture whose two top pieces are each a next/ntime chain of the same
// length and timing. Game-Maker animates a block number, not a map square, so both chains
// start together when the scene loads and stay in step: the paper reads as one sheet.
import { Pixels } from '../../../kit/pixels';
import { BlockSet, SOLID } from './book';
import { oval } from '../art/draw';
import { micro } from '../art/font';
import { C } from '../art/pal';
import { tiled } from '../art/bigart';
import { FLOORS } from './floors';
import { addBig, on } from './shared';

/** What the teleprinter types, one step a frame: [lines so far, ticks to hold]. "GA" is TTY for "go ahead". */
const TTY_SCRIPT: [string[], number][] = [
  [[], 30],
  [['DIAL'], 6],
  [['DIAL 3'], 10],
  [['DIAL 3', 'FOR'], 6],
  [['DIAL 3', 'FOR MOON'], 10],
  [['DIAL 3', 'FOR MOON', 'GA'], 70],
];

/** The paper roll and the platen: 40x20, the last three lines with the newest at the bottom. */
function ttyPaper(lines: string[]): Pixels {
  const p = tiled(new Pixels(40, 20), FLOORS.marble);
  p.rect(6, 0, 28, 18, C('paper', 2)).rect(6, 0, 1, 18, C('paper', 1)).rect(33, 0, 1, 18, C('paper', 0));
  // A torn top edge.
  for (let x = 6; x < 34; x += 2) p.set(x, 0, C('gray', 3));
  const shown = lines.slice(-3);
  shown.forEach((s, i) => micro(p, 8, 12 - (shown.length - 1 - i) * 6, s, C('night', 1)));
  // The platen roller, with the type head under the end of the line being typed.
  p.rect(3, 17, 34, 3, C('gray', 1)).rect(3, 17, 34, 1, C('gray', 3));
  const last = shown[shown.length - 1] ?? '';
  p.rect(8 + last.length * 4, 16, 3, 3, C('chrome', 6));
  return p;
}

/** The machine itself: a cream Model-28-ish cabinet with a round-key keyboard. 40x20. */
function ttyBody(): Pixels {
  const p = tiled(new Pixels(40, 20), FLOORS.marble);
  oval(p, 20, 18, 19, 2, C('gray', 1));
  p.rect(2, 0, 36, 16, C('concrete', 3)).rect(2, 0, 36, 2, C('concrete', 4)).rect(2, 14, 36, 2, C('concrete', 1));
  for (let row = 0; row < 3; row++)
    for (let k = 0; k < 8; k++) p.disc(7 + k * 3.7 + row, 4 + row * 3, 1, C('gray', 1)).set(7 + k * 3.7 + row, 3 + row * 3, C('gray', 4));
  micro(p, 4, 9, 'TTY', C('red', 3));
  p.rect(33, 4, 3, 2, C('gold', 5));
  return p;
}

/** A 1916 oak wall telephone: two brass bells, a horn mouthpiece and a crank on the side. */
function crankPhone(ring: number): Pixels {
  const p = on('marble');
  oval(p, 10, 19, 7, 1, C('gray', 1));
  p.rect(5, 1, 10, 18, C('wood', 2)).rect(5, 1, 10, 1, C('wood', 3)).rect(14, 1, 1, 18, C('wood', 1));
  p.rect(6, 7, 8, 1, C('wood', 1));
  // Bells, which shake apart when it rings.
  const shake = ring === 0 ? 0 : ring === 1 ? -1 : 1;
  for (const bx of [7, 12]) p.disc(bx + shake * (bx < 10 ? 1 : -1), 4, 2, C('gold', 4)).set(bx + shake * (bx < 10 ? 1 : -1) - 1, 3, C('gold', 5));
  p.rect(9, 3, 2, 2, C('chrome', 5));
  // Horn mouthpiece and the receiver on its hook.
  p.disc(10, 11, 2, C('gray', 0)).set(10, 11, C('gray', 2));
  p.rect(9, 8, 2, 2, C('gray', 1));
  p.rect(2, 7, 2, 6, C('gray', 0)).rect(4, 8, 1, 1, C('chrome', 4));
  // The crank: up when resting, round the other way while ringing.
  const up = ring !== 2;
  p.rect(15, 11, 2, 1, C('chrome', 4));
  p.line(16, 11, 18, up ? 7 : 15, C('chrome', 5)).rect(17, up ? 6 : 15, 2, 2, C('wood', 1));
  if (ring)
    for (const [x, y, dx] of [
      [2, 2, -1],
      [17, 2, 1],
    ] as const)
      p.set(x, y, C('gold', 5))
        .set(x + dx, y - 1, C('gold', 5))
        .set(x, y + 3, C('gold', 5))
        .set(x + dx, y + 4, C('gold', 5));
  return p;
}

/** The exhibit's brass plaque on two posts, 3x1. */
function plaque(): Pixels {
  const p = tiled(new Pixels(60, 20), FLOORS.marble);
  p.rect(10, 14, 2, 6, C('chrome', 2)).rect(48, 14, 2, 6, C('chrome', 2));
  p.rect(2, 1, 56, 14, C('gold', 2)).rect(3, 2, 54, 12, C('gold', 4)).rect(3, 2, 54, 1, C('gold', 5));
  micro(p, 5, 3, 'RESTORING THE', C('wood', 0));
  micro(p, 7, 9, 'SIGNAL: 1916', C('wood', 0));
  return p;
}

export function addSignal(s: BlockSet): void {
  s.add('crank', crankPhone(0), { solid: SOLID, score: 1916, touch: 'crankRing' });
  s.add('crankRing', crankPhone(1), { solid: SOLID, next: 'crankRing2', ntime: 2 });
  s.add('crankRing2', crankPhone(2), { solid: SOLID, next: 'crankRing', ntime: 2 });
  addBig(s, 'plaque', plaque());
  // The paper: one chain per half, frame k of each the same length.
  for (const [half, x] of [
    ['ttyL', 0],
    ['ttyR', 20],
  ] as const)
    TTY_SCRIPT.forEach(([lines, ticks], k) =>
      s.add(`${half}${k}`, ttyPaper(lines).crop(x, 0, 20, 20), { solid: SOLID, next: `${half}${(k + 1) % TTY_SCRIPT.length}`, ntime: ticks }),
    );
  addBig(s, 'ttyBody', ttyBody());
}
