// Doc Leo Hangs the Lights' pictures (Level 15): a sandbag swinging on its rope (at head
// height: pratfall under it), the rigging lift (a plank on its ropes, and folded up flat
// against them for the ride back down), the outlet box at the top of the tent (dark, then
// lit up once the party lights are plugged in), and a string of party bulbs.
import { Pixels } from '../../../kit/pixels';
import { blob } from '../art/draw';
import { P } from '../art/pal';

const c = (n: string, k: number) => P.c(n, k);

/** A sandbag on the end of its rope, tilted as it swings (`phase` 0 or 1). */
export function sandbag(phase: number): Pixels {
  const p = new Pixels(20, 20, 255);
  const lean = phase ? 2 : -2;
  p.line(10, 0, 10 + lean, 7, c('hay', 1));
  blob(p, 10 + lean, 13, 5, 6, P.r('hay'), 0, 2);
  p.rect(7 + lean, 8, 7, 1, c('hay', 0));
  p.rect(8 + lean, 13, 5, 1, c('wood', 1)).set(10 + lean, 12, c('wood', 1));
  return p;
}

/** The lift's plank on its two ropes (solid: stand on it going up). */
export function liftPlank(): Pixels {
  const p = new Pixels(20, 20, 255);
  p.rect(2, 0, 1, 14, c('hay', 2)).rect(17, 0, 1, 14, c('hay', 2));
  p.rect(0, 14, 20, 4, c('wood', 3)).rect(0, 14, 20, 1, c('wood', 4)).rect(0, 18, 20, 1, c('wood', 0));
  p.rect(1, 15, 2, 2, c('metal', 2)).rect(17, 15, 2, 2, c('metal', 2));
  return p;
}

/** The plank folded up flat against its ropes for the trip back down (nothing to stand on). */
export function liftFolded(): Pixels {
  const p = new Pixels(20, 20, 255);
  p.rect(9, 0, 1, 20, c('hay', 2)).rect(11, 0, 1, 20, c('hay', 2));
  p.rect(8, 3, 5, 14, c('wood', 2)).rect(8, 3, 5, 1, c('wood', 3));
  return p;
}

/** The outlet box on the king pole at the top of the tent, over `base` (lit once plugged in). */
export function outlet(base: Pixels, lit: boolean): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  p.rect(5, 4, 10, 12, c('metal', 1)).frame(5, 4, 10, 12, c('ink', 0));
  p.rect(7, 7, 2, 3, c('ink', 0)).rect(11, 7, 2, 3, c('ink', 0));
  if (lit) {
    p.rect(7, 12, 6, 2, c('glow', 3));
    for (const [x, y] of [
      [2, 2],
      [17, 2],
      [2, 17],
      [17, 17],
    ])
      p.set(x, y, c('glow', 3));
  } else p.rect(7, 12, 6, 2, c('ink', 1));
  return p;
}

/** A string of party bulbs sagging across a block, over `base` (unlit: not plugged in yet). */
export function bulbs(base: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(base.px);
  for (let x = 0; x < 20; x++) p.set(x, 3 + Math.round(2 * Math.sin((x / 20) * Math.PI)), c('ink', 1));
  for (const [x, col] of [
    [3, 'red'],
    [10, 'yellow'],
    [16, 'blue'],
  ] as const)
    p.rect(x, 5 + Math.round(2 * Math.sin((x / 20) * Math.PI)), 2, 3, c(col, 1));
  return p;
}
