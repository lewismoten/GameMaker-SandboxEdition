// Ground and street furniture every top-down set shares, drawn in the game's ramps: grass, dirt
// path, cobbles and hedges, trees and fences, signposts with a little hand-lettering, sawhorses,
// field gates, lamp posts and benches, and the chapter ropes and swing gates that let Joe into a
// friend's corner once and out again.
import { SOLBOT, SOLLEF, SOLRIG } from '../../../../web/src/formats/blocks';
import { Pixels, rng } from '../../../kit/pixels';
import { over, shadeAt } from '../art/draw';
import { c, r } from '../art/pal';
import { flag } from '../ids';
import { BlockSet, SOLID } from './sets';

const O = () => c('ink', 0);

/** A swing gate's solid sides: it lets Joe through going south (down the map) only. */
export const ONE_WAY_SOUTH = SOLBOT | SOLLEF | SOLRIG;

export function noise(p: Pixels, seed: number, ramp: string, lo: number, hi: number, amount = 0.5): Pixels {
  const R = rng(seed);
  return p.map((x, y, v) => (R() < amount ? shadeAt(r(ramp), lo, hi, R(), x, y) : v));
}

export function grass(seed: number, flowers = false): Pixels {
  const p = noise(new Pixels(20, 20, c('grass', 2)), seed, 'grass', 1, 3, 0.45);
  const R = rng(seed + 9);
  for (let i = 0; i < 6; i++) p.set(Math.floor(R() * 20), Math.floor(R() * 20), c('grass', 4));
  if (flowers)
    for (let i = 0; i < 4; i++) {
      const x = 2 + Math.floor(R() * 16);
      const y = 2 + Math.floor(R() * 16);
      const col = [c('pink', 2), c('yellow', 3), c('paper', 4), c('purple', 3)][i];
      p.set(x, y, col)
        .set(x - 1, y, col)
        .set(x + 1, y, col)
        .set(x, y - 1, col)
        .set(x, y + 1, col)
        .set(x, y, c('yellow', 2));
    }
  return p;
}

export function path(seed: number): Pixels {
  const p = noise(new Pixels(20, 20, c('wood', 4)), seed, 'wood', 3, 5, 0.4);
  const R = rng(seed + 3);
  for (let i = 0; i < 5; i++) p.set(Math.floor(R() * 20), Math.floor(R() * 20), c('stone', 3));
  return p;
}

export function cobble(seed: number): Pixels {
  const p = new Pixels(20, 20, c('stone', 1));
  const R = rng(seed);
  for (let y = 0; y < 20; y += 5)
    for (let x = (y / 5) % 2 ? -3 : 0; x < 20; x += 6) {
      const s = 2 + Math.floor(R() * 2);
      p.rect(x + 1, y + 1, 4, 3, c('stone', s));
      p.rect(x + 1, y + 1, 4, 1, c('stone', s + 1));
    }
  return p;
}

export function tree(seed: number): Pixels {
  const p = grass(seed);
  p.disc(11, 12, 8, c('ink', 1));
  const R = rng(seed);
  p.map((x, y, v) => ((x - 10) ** 2 + (y - 10) ** 2 <= 72 ? shadeAt(r('green'), 0, 3, 0.35 + 0.5 * R() - (x + y - 20) / 40, x, y) : v));
  p.disc(7, 7, 2, c('green', 3));
  return p;
}

export function fence(): Pixels {
  const p = grass(5);
  p.rect(0, 8, 20, 2, c('wood', 4)).rect(0, 13, 20, 2, c('wood', 4));
  for (const x of [3, 15]) p.rect(x, 5, 3, 12, c('wood', 3)).frame(x, 5, 3, 12, c('wood', 1));
  return p;
}

/** A signpost with a short word painted on its board, standing in grass. */
export function sign(word: string, ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.rect(9, 10, 2, 9, c('wood', 2));
  p.rect(1, 2, 18, 9, c('wood', 4)).frame(1, 2, 18, 9, c('wood', 1));
  tiny(p, 10 - Math.floor((word.length * 4 - 1) / 2), 4, word, c('ink', 0));
  return p;
}

/** A 3x5 lettering for signs (A-Z, a space, an arrow). */
export function tiny(p: Pixels, x: number, y: number, s: string, col: number): void {
  const G: Record<string, string> = {
    A: '010101111101101',
    B: '110101110101110',
    C: '011100100100011',
    D: '110101101101110',
    E: '111100110100111',
    F: '111100110100100',
    G: '011100101101011',
    H: '101101111101101',
    I: '111010010010111',
    K: '101101110101101',
    L: '100100100100111',
    M: '101111111101101',
    N: '110101101101101',
    O: '010101101101010',
    P: '110101110100100',
    R: '110101110101101',
    S: '011100010001110',
    T: '111010010010010',
    U: '101101101101111',
    W: '101101111111101',
    Y: '101101010010010',
    ' ': '000000000000000',
    '>': '100010001010100',
  };
  let cx = x;
  for (const ch of s) {
    const g = G[ch] ?? G[' '];
    for (let i = 0; i < 15; i++) if (g[i] === '1') p.set(cx + (i % 3), y + Math.floor(i / 3), col);
    cx += 4;
  }
}

/** A sawhorse across the way: striped red and white, with a little hand-lettered card. */
export function barrier(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.rect(1, 6, 18, 4, c('paper', 4)).frame(1, 6, 18, 4, O());
  for (let x = 2; x < 18; x += 4) p.rect(x, 7, 2, 2, c('red', 2));
  p.rect(3, 10, 2, 7, c('wood', 2)).rect(15, 10, 2, 7, c('wood', 2));
  p.rect(7, 11, 6, 5, c('paper', 3)).rect(8, 12, 4, 1, c('ink', 1)).rect(8, 14, 3, 1, c('ink', 1));
  return p;
}

/** A field gate on the road: shut it is solid and counts thank-yous; open it stands aside. */
export function gate(open: boolean, ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.rect(0, 2, 2, 17, c('wood', 2)).rect(18, 2, 2, 17, c('wood', 2));
  if (open) {
    p.rect(2, 2, 3, 15, c('wood', 4)).frame(2, 2, 3, 15, c('wood', 1));
    return p;
  }
  for (const y of [4, 9, 14]) p.rect(2, y, 16, 2, c('wood', 4));
  p.line(2, 15, 17, 4, c('wood', 3));
  // a heart-shaped latch plate in gold: it opens for a thank-you
  p.rect(8, 8, 2, 2, c('gold', 3)).rect(11, 8, 2, 2, c('gold', 3)).rect(8, 9, 5, 2, c('gold', 3)).rect(9, 11, 3, 1, c('gold', 2)).set(10, 12, c('gold', 2));
  return p;
}

export function lampPost(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.disc(10, 10, 7, c('window', 0));
  p.disc(10, 10, 4, c('window', 1));
  p.disc(10, 10, 2.5, c('window', 2)).disc(10, 10, 1.2, c('yellow', 3));
  p.ring(10, 10, 3, c('ink', 0));
  return p;
}

export function parkBench(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.rect(1, 5, 18, 3, c('wood', 4)).rect(1, 9, 18, 3, c('wood', 4)).rect(1, 13, 18, 2, c('wood', 3));
  p.rect(2, 4, 1, 12, c('ink', 1)).rect(17, 4, 1, 12, c('ink', 1));
  return p;
}

/** A red velvet rope between two brass posts: the way to a friend's thank-you, once. */
export function rope(down: boolean, ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.disc(3, 10, 2.5, c('brass', 3)).disc(16, 10, 2.5, c('brass', 3));
  if (down) p.rect(3, 13, 2, 6, c('red', 2));
  else
    for (let x = 4; x < 16; x++)
      p.set(x, 10 + Math.round(Math.sin(((x - 4) / 12) * Math.PI) * 3), c('red', 2)).set(
        x,
        11 + Math.round(Math.sin(((x - 4) / 12) * Math.PI) * 3),
        c('red', 1),
      );
  return p;
}

/** A little swing gate in a hedge that only opens outward (south). */
export function swingGate(ground: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  p.rect(0, 0, 3, 20, c('green', 1)).rect(17, 0, 3, 20, c('green', 1));
  p.rect(3, 8, 14, 3, c('paper', 3)).frame(3, 8, 14, 3, O());
  // an arrow pointing out
  p.rect(9, 12, 2, 5, c('ink', 1)).rect(7, 15, 6, 1, c('ink', 1)).rect(8, 16, 4, 1, c('ink', 1));
  return p;
}

export function hedge(seed: number): Pixels {
  return noise(new Pixels(20, 20, c('green', 1)), seed, 'green', 0, 2, 0.6);
}

export function on(ground: Pixels, who: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(ground.px);
  return over(p, who);
}

/** A chapter's rope (rope<n>, on chapter n's flag) and the rope let down (ropeDown<n>). */
export function addRope(s: BlockSet, ground: Pixels, n: number): void {
  s.add(`ropeDown${n}`, rope(true, ground));
  s.add(`rope${n}`, rope(false, ground), { solid: SOLID, effect: flag(n), eamt: -1, touch: `ropeDown${n}` });
}
