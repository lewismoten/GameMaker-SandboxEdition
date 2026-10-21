// Teddy's things: his green wobble ball (his favorite toy: it giggles when it rolls), Gwin
// zooming off with it in her mouth, a book from the tiny little library on Maple Street,
// and a frosty mug of root beer (Doc Leo always asks for root beer).
import { Pixels } from '../../../kit/pixels';
import { CLEAR, blob, outline, sprite } from '../art/draw';
import { P } from '../art/pal';
import { GWIN } from './gwin';

const c = (n: string, k: number) => P.c(n, k);
/** Lime green plastic, from the shadowed underside to the shine. */
const BALL = [c('leaf', 0), c('leaf', 2), c('green', 0), c('green', 1), c('green', 2)];

/**
 * The wobble ball: a lumpy lime sphere with four dimpled pockets. `turn` rolls the pockets
 * round the ball (in quarter turns), `tilt` leans it as it wobbles (-1..1), `r` is its radius.
 */
export function wobbleBall(turn: number, tilt = 0, r = 5.5): Pixels {
  const n = Math.ceil(r * 2) + 2;
  const p = new Pixels(n, n, CLEAR);
  const cx = n / 2;
  const cy = n / 2;
  blob(p, cx, cy, r, r, BALL, 0, 4);
  // the pockets: dark dimples on the sphere, shrinking as they roll round the edge
  for (let k = 0; k < 4; k++) {
    const a = ((k + turn) * Math.PI) / 2 + 0.5;
    const z = Math.cos(a);
    if (z < -0.1) continue;
    const px = cx + Math.sin(a) * r * 0.62;
    const py = cy + (k % 2 ? -1 : 1) * r * 0.3;
    const pr = Math.max(0.8, r * 0.26 * (0.45 + 0.55 * z));
    blob(p, px, py, pr, pr * 1.1, [c('leaf', 0), c('leaf', 2), c('green', 1)], 0, 2, -1);
  }
  // the shine
  p.set(Math.round(cx - r * 0.45), Math.round(cy - r * 0.5), c('fur', 2));
  if (r > 4) p.set(Math.round(cx - r * 0.45) + 1, Math.round(cy - r * 0.5), c('green', 2)).set(Math.round(cx - r * 0.45), Math.round(cy - r * 0.5) + 1, c('green', 2));
  const out = outline(p, c('ink', 0));
  if (!tilt) return out;
  // leaning: shear each row toward the tilt, more at the top
  const s = new Pixels(n + 2, n, CLEAR);
  for (let y = 0; y < n; y++) {
    const dx = Math.round(tilt * (1 - y / (n - 1)) * 3) + 1;
    for (let x = 0; x < n; x++) {
      const v = out.get(x, y);
      if (v !== CLEAR) s.set(x + dx, y, v);
    }
  }
  return s;
}

/** Little yellow giggle marks either side of the ball. */
function giggle(p: Pixels, x: number, y: number, side: number): void {
  const y0 = c('yellow', 3);
  const y1 = c('yellow', 2);
  if (side <= 0) p.set(x - 2, y, y0).set(x - 3, y + 1, y0).set(x - 3, y + 2, y1).set(x - 2, y + 3, y0);
  if (side >= 0) p.set(x + 2, y, y0).set(x + 3, y + 1, y0).set(x + 3, y + 2, y1).set(x + 2, y + 3, y0);
}

/** A 20x20 block with the ball sitting on its bottom edge. */
function onGround(ball: Pixels, dy = 0): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  p.blit(ball, Math.floor((20 - ball.w) / 2), 20 - ball.h + dy, CLEAR);
  return p;
}

export const TOYS: Record<string, Pixels> = {};

// Wobbling in place: lean left, upright, lean right, upright, giggling as it goes.
TOYS.wobble1 = onGround(wobbleBall(0, -1));
giggle(TOYS.wobble1, 5, 9, -1);
TOYS.wobble2 = onGround(wobbleBall(0.3, 0));
TOYS.wobble3 = onGround(wobbleBall(0.6, 1));
giggle(TOYS.wobble3, 14, 9, 1);
TOYS.wobble4 = onGround(wobbleBall(0.3, 0));
// Up in the air, rolling over.
TOYS.ballAir1 = onGround(wobbleBall(1), -6);
TOYS.ballAir2 = onGround(wobbleBall(2), -6);

/** Gwin's zoomies, with Teddy's ball in her mouth (she faces right). */
function withBall(gwin: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(gwin.px);
  // close her mouth over the tongue, then the ball in front of it
  for (let y = 6; y < 9; y++) for (let x = 13; x < 20; x++) if (p.get(x, y) === c('tongue', 1)) p.set(x, y, CLEAR);
  p.blit(wobbleBall(0.5, 0, 2.6), 13, 4, CLEAR);
  return p;
}
TOYS.zoomBall1 = withBall(GWIN.gwinRun1);
TOYS.zoomBall2 = withBall(GWIN.gwinRun2);

const K: Record<string, number> = {
  o: c('ink', 0),
  w: c('fur', 2),
  W: c('cloud', 1),
  s: c('cloud', 0),
  b: c('gwin', 1),
  B: c('gwin', 2),
  h: c('gwin', 3),
  H: c('gwin', 4),
  m: c('metal', 4),
  M: c('metal', 3),
  r: c('red', 2),
  R: c('red', 3),
  q: c('red', 1),
  y: c('yellow', 3),
  Y: c('yellow', 2),
  n: c('blue', 1),
  N: c('blue', 2),
};

/** A frosty mug of root beer, foam spilling over (`fizz` moves the bubbles). */
export function rootBeer(fizz = 0): Pixels {
  const rows = [
    '..wwW.wW.....',
    '.wWWwwWWw....',
    'owWWWwWWWwo..',
    'oMwWwWWwWMo..',
    'omhHbhhBhmoooo',
    'omhbhhBhhmoMmo',
    'omBhhbhhbmo..mo',
    'omhhBhhhhmo..mo',
    'ombhhhbBhmo..mo',
    'omhBhhhhhmoMmo',
    'ombhhBhbhmoooo',
    'omhhhhhhhmo..',
    'oMmmmmmmmMo..',
    '.ooooooooo...',
  ];
  const p = sprite(rows, K, 4, 6);
  // bubbles rising through the root beer, and frost on the glass
  for (let k = 0; k < 3; k++) p.set(6 + k * 2, 16 - ((fizz + k * 2) % 6), c('gwin', 4));
  p.set(5, 12, c('fur', 2)).set(13, 14, c('fur', 2));
  return p;
}
TOYS.rootBeer1 = rootBeer(0);
TOYS.rootBeer2 = rootBeer(3);

/** A dog book from the tiny little library: a red cover with a paw print. */
export const BOOK = sprite(
  [
    '.oooooooooo.',
    'oqRRRRRRRRwo',
    'oqRRyRRyRRwo',
    'oqRyRyyRyRwo',
    'oqRRyyyyRRwo',
    'oqRyyyyyyRwo',
    'oqRRyyyyRRwo',
    'oqRRRRRRRRwo',
    'oqRwwwwwwRwo',
    'oqRRRRRRRRwo',
    'oqqqqqqqqqwo',
    '.ooooooooooo',
  ],
  K,
);
TOYS.book = BOOK;

void CLEAR;
