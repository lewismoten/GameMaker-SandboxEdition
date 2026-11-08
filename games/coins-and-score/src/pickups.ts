// COINS AND SCORE's three new pickups, drawn in code: a gem (50 points), a rock (takes 20 away)
// and a heart (adds a life). The coin is the Starter kit's. Each is a block with its rule on the
// Touch tab: Score points, and for the heart Effect counter 1 (lives) and Effect amount 1.
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, PULL } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** Points a gem is worth, and a rock takes away. */
export const GEM_POINTS = 50;
export const ROCK_POINTS = -20;

/** Game-Maker's "lives" effect on a block's Touch tab. */
const LIVES = 1;

type Pt = [number, number];

/** Fills the polygon `pts` (pixel corners) with color `c`. */
function poly(p: Pixels, pts: Pt[], c: number): void {
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i];
        const [xj, yj] = pts[j];
        if (yi > y + 0.5 !== yj > y + 0.5 && x + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) p.set(x, y, c);
    }
}

/** A gem: a cut blue stone with a white glint. */
function addGem(book: Book, pal: Pal): void {
  const p = new Pixels(20, 20, skyOf(pal));
  const b = pal.r('blue');
  const w = pal.c('white', 3);
  const crown: Pt[] = [
    [6, 4],
    [14, 4],
    [18, 8],
    [2, 8],
  ];
  const body: Pt[] = [
    [2, 8],
    [18, 8],
    [10, 18],
  ];
  poly(p, body, b[2]);
  poly(
    p,
    [
      [2, 8],
      [10, 8],
      [10, 18],
    ],
    b[3],
  );
  poly(p, crown, b[3]);
  poly(
    p,
    [
      [6, 4],
      [10, 4],
      [10, 8],
      [2, 8],
    ],
    b[4],
  );
  p.rect(10, 4, 4, 4, b[2]);
  p.set(5, 6, w).set(6, 6, w).set(5, 7, w);
  book.add('gem', outline(p, pal.c('ink', 0), { transparent: skyOf(pal) }), { grav: PULL.down, score: GEM_POINTS, touch: 'sky' });
}

/** A rock: a gray, angular chunk that takes 20 points away. */
function addRock(book: Book, pal: Pal): void {
  const p = new Pixels(20, 20, skyOf(pal));
  const s = pal.r('stone');
  poly(
    p,
    [
      [3, 17],
      [2, 11],
      [6, 5],
      [11, 3],
      [16, 7],
      [18, 13],
      [16, 17],
    ],
    s[2],
  );
  poly(
    p,
    [
      [6, 5],
      [11, 3],
      [16, 7],
      [11, 9],
    ],
    s[4],
  );
  poly(
    p,
    [
      [2, 11],
      [6, 5],
      [11, 9],
      [8, 14],
    ],
    s[3],
  );
  poly(
    p,
    [
      [11, 9],
      [16, 7],
      [18, 13],
      [14, 14],
    ],
    s[2],
  );
  poly(
    p,
    [
      [8, 14],
      [14, 14],
      [16, 17],
      [3, 17],
    ],
    s[1],
  );
  book.add('rock', outline(p, pal.c('ink', 0), { transparent: skyOf(pal) }), { grav: PULL.down, score: ROCK_POINTS, touch: 'sky' });
}

/** A heart: touch it and the lives counter goes up by one. */
function addHeart(book: Book, pal: Pal): void {
  const p = new Pixels(20, 20, skyOf(pal));
  const r = pal.r('red');
  const w = pal.c('white', 3);
  p.disc(6.5, 7.5, 4.8, r[3]).disc(13.5, 7.5, 4.8, r[3]);
  poly(
    p,
    [
      [1.7, 9],
      [18.3, 9],
      [10, 18.5],
    ],
    r[3],
  );
  p.rect(5, 8, 10, 2, r[3]);
  poly(
    p,
    [
      [11, 11],
      [17, 9],
      [10, 17.5],
    ],
    r[2],
  );
  p.disc(5.5, 6, 1.8, r[4]).set(4, 5, w).set(5, 4, w);
  book.add('heart', outline(p, pal.c('ink', 0), { transparent: skyOf(pal) }), { grav: PULL.down, effect: LIVES, eamt: 1, touch: 'sky' });
}

/** Adds the gem, rock and heart blocks to `book`, after the Starter set. */
export function addPickupBlocks(book: Book, pal: Pal): void {
  addGem(book, pal);
  addRock(book, pal);
  addHeart(book, pal);
}
