// Two drawings for Brother Camel's turn on the cast stage:
//  - the giant sewing needle he tries: tall and silver, standing on its point, with an oval eye
//    near the top (see-through, so the camel shows through it as he squeezes) and a red thread
//    trailing out of the eye down to the boards;
//  - Brother Camel from the front, in Thread the Needle's own colors (needle/disk/city.pal, the
//    same indexes his side view uses), for when he stops and faces you.
import { Pixels } from '../../games/kit/pixels';

const CLEAR = 255;

/** The needle's colors (6-bit VGA), index 0 unused. */
export const NEEDLE_PAL: [number, number, number][] = [
  [0, 0, 0],
  [9, 10, 13], // 1 outline
  [26, 29, 33], // 2 dark steel
  [41, 44, 48], // 3 steel
  [53, 55, 58], // 4 light steel
  [63, 63, 63], // 5 shine
  [49, 9, 11], // 6 thread
  [30, 4, 6], // 7 thread shadow
];
const NEEDLE_W = 26;
const NEEDLE_H = 52;
/** The eye's middle, from the needle picture's top left. */
export const NEEDLE_EYE = { x: 8, y: 14 };

/** The needle, CLEAR around it and through its eye. */
export function needlePicture(): Pixels {
  const p = new Pixels(NEEDLE_W, NEEDLE_H, CLEAR);
  const cx = 8;
  // half the width at each height: a rounded head, a straight shaft, a long taper to the point
  const half = (y: number) => (y < 1 ? 3 : y < 2 ? 5 : y < 34 ? 6 : Math.max(0, 6 - ((y - 34) * 6) / (NEEDLE_H - 1 - 34)));
  for (let y = 0; y < NEEDLE_H; y++) {
    const hw = half(y);
    for (let x = Math.round(cx - hw); x < Math.round(cx + hw); x++) {
      // lit from the left: shine, light, steel, dark toward the right edge
      const u = (x - (cx - hw)) / Math.max(1, hw * 2);
      p.set(x, y, u < 0.2 ? 4 : u < 0.32 ? 5 : u < 0.65 ? 3 : 2);
    }
  }
  // the eye: an oval cut right through
  const inEye = (x: number, y: number) => ((x + 0.5 - cx) / 2.6) ** 2 + ((y + 0.5 - NEEDLE_EYE.y) / 9.5) ** 2 <= 1;
  for (let y = 0; y < NEEDLE_H; y++) for (let x = 0; x < NEEDLE_W; x++) if (inEye(x, y)) p.set(x, y, CLEAR);
  // outline the needle and the eye
  const solid = (x: number, y: number) => {
    const c = p.get(x, y);
    return c !== CLEAR && c !== -1;
  };
  const edge: [number, number][] = [];
  for (let y = 0; y < NEEDLE_H; y++)
    for (let x = 0; x < NEEDLE_W; x++)
      if (
        solid(x, y) &&
        [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([dx, dy]) => !solid(x + dx, y + dy))
      )
        edge.push([x, y]);
  for (const [x, y] of edge) p.set(x, y, 1);
  // the thread: through the eye, out the right and trailing down to the boards in a lazy curve
  const thread: [number, number][] = [];
  for (let t = 0; t <= 1; t += 0.01) {
    const x = cx + 1 + t * 15 + Math.sin(t * Math.PI * 1.5) * 3;
    const y = NEEDLE_EYE.y + 6 + t * (NEEDLE_H - 2 - NEEDLE_EYE.y - 6);
    thread.push([Math.round(x), Math.round(y)]);
  }
  for (const [x, y] of thread) {
    if (p.get(x, y) === CLEAR) p.set(x, y, 6);
    if (p.get(x + 1, y) === CLEAR) p.set(x + 1, y, 7);
  }
  // a loose end lying along the floor
  p.rect(cx + 16, NEEDLE_H - 2, 6, 1, 6).rect(cx + 16, NEEDLE_H - 1, 6, 1, 7);
  return p;
}

// Brother Camel facing you, 20x40, in city.pal's indexes (the ones his side view uses)
const CAMEL_KEY: Record<string, number> = {
  a: 15,
  b: 18,
  c: 19,
  d: 63,
  e: 21,
  f: 22,
  g: 20,
  h: 94,
  i: 38,
  j: 51,
  k: 52,
  l: 93,
  m: 39,
  n: 37,
  o: 92,
  p: 36,
  q: 68,
  r: 59,
  s: 60,
};
const CAMEL = [
  ...Array(7).fill('....................'),
  '......a......a......',
  '.....aea....aea.....',
  '......affffffa......',
  '.....afeffffefa.....',
  '.....afqdffdqfa.....',
  '.....afeeffeefa.....',
  '......afeeeefa......',
  '......agfhhfga......',
  '......aghqqhga......',
  '.......agnnga.......',
  '........acca........',
  '........accga.......',
  '........accga.......',
  '........accga.......',
  '..aaaaaaacgaaaaaaa..',
  '.akjjjjkacgcakjjjjka',
  '.akllllkecceekllllka',
  '.akjjjjkeffeekjjjjka',
  '.akjjjjkeffeekjjjjka',
  '.agkkkkgeeeeegkkkkga',
  '..agggggmhhmgggggga.',
  '...aiiimmmmmmiiia...',
  '....anmmmmmmmmna....',
  '....acca.anna.acca..',
  '....acca.anna.acca..',
  '....acca.anna.acca..',
  '....abcba.aa.abcba..',
  '....acca......acca..',
  '....acca......acca..',
  '....acca......acca..',
  '....acca......acca..',
  '...arsra......arsra.',
  '...arrra......arrra.',
];

/** Brother Camel from the front: standing, and a blink. */
export function camelFront(blink = false): Pixels {
  const p = new Pixels(20, 40, CLEAR);
  p.draw(0, 0, blink ? CAMEL.map((r, y) => (y === 10 ? r.replace(/qd/, 'ff').replace(/dq/, 'ff') : r)) : CAMEL, CAMEL_KEY);
  return p;
}
