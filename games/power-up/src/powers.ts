// POWER UP's blocks, added to the Starter block set after the signs:
//   star       touch it and the high jump's counter goes up by STAR_JUMPS; the star is gone
//   sneakerR   touch it and the fast-walk-right counter goes up by SNEAKER_STRIDES; gone
//   sneakerL   the same for walking left (a counter belongs to one sequence, so each foot has its own)
// None is solid: Kit walks into them, as into a coin.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { PULL, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { POWER, SNEAKER_STRIDES, STAR_JUMPS } from './hero';

/** Whether (x, y) is inside the polygon (even-odd rule). */
function inside(poly: [number, number][], x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** A plump five-point star with a bright upper left and a warm lower right. */
function star(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const g = pal.r('gold');
  const cx = 9.5;
  const cy = 10.5;
  const poly: [number, number][] = Array.from({ length: 10 }, (_v, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 4.6 : 9;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 20; x++) {
      if (!inside(poly, x + 0.5, y + 0.5)) continue;
      p.set(x, y, x + y < 19 ? g[4] : x + y > 21 ? g[2] : g[3]);
    }
  }
  p.rect(8, 6, 2, 2, g[5]).set(7, 8, g[5]);
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** A friendly sneaker, toe to the right: white sole, red body, laces and a gold stripe. */
function sneaker(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const red = pal.r('red');
  const w = pal.r('white');
  const g = pal.r('gold');
  const key: Record<string, number> = { r: red[2], R: red[3], d: red[1], w: w[3], s: w[1], y: g[3], t: w[2] };
  p.draw(
    1,
    3,
    [
      '..rrrrr.......',
      '..rRRrr.......',
      '..rRRrr.......',
      '..rrrrt.......',
      '..rrrrrt......',
      '..rrrrrrt.....',
      '..rrrrrrrt....',
      '..rrrrrrrrr...',
      '.rrrrrrrrrrrr.',
      '.yyyyyyyyyyrr.',
      'wwwwwwwwwwwwww',
      'ssssssssssssss',
    ].map((row) => row.padEnd(16, '.')),
    key,
  );
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** Adds the power-up blocks to `book` (call after the signs). */
export function addPowers(book: Book, pal: Pal): void {
  const air = { grav: PULL.down, touch: 'sky' };
  const right = sneaker(pal);
  book.add('star', star(pal), { ...air, effect: POWER.highJump, eamt: STAR_JUMPS });
  book.add('sneakerR', right, { ...air, effect: POWER.fastRight, eamt: SNEAKER_STRIDES });
  book.add('sneakerL', right.flipX(), { ...air, effect: POWER.fastLeft, eamt: SNEAKER_STRIDES });
}
