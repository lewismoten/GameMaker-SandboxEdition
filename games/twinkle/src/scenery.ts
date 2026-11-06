// The scenery of level 2's night: a moon three blocks across and a low dark hill three blocks wide, both drawn on the
// night sky and set in the air (the hero walks in front of them). Neither moves; only the stars do.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, PULL } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';

/** The moon's 3x3 blocks, named `moon.<column><row>`. */
export function addMoon(book: Book, pal: Pal): string[][] {
  const { c } = pal;
  const p = new Pixels(60, 60, c('sky', 3));
  p.disc(30, 30, 28, c('sky', 4)); // a soft glow
  p.disc(30, 30, 21, c('parch', 3));
  p.disc(28, 28, 19, c('parch', 4)); // lit toward the top left
  for (const [x, y, r] of [
    [36, 34, 4],
    [24, 40, 3],
    [34, 22, 2.5],
  ] as const)
    p.disc(x, y, r, c('parch', 3));
  const names: string[][] = [];
  for (let row = 0; row < 3; row++) {
    names.push([]);
    for (let col = 0; col < 3; col++) {
      const name = `moon.${col}${row}`;
      book.add(name, p.crop(col * 20, row * 20, 20, 20), { grav: PULL.down });
      names[row].push(name);
    }
  }
  return names;
}

/** A hill one block high and three wide: `hill.0`, `hill.1`, `hill.2`, a dark mound against the sky. */
export function addHill(book: Book, pal: Pal): string[] {
  const { c } = pal;
  const p = new Pixels(60, 20, c('sky', 3));
  for (let x = 0; x < 60; x++) {
    const t = (x - 29.5) / 30;
    const top = Math.round(19 - 15 * Math.sqrt(Math.max(0, 1 - t * t)));
    if (top < 19.5) p.rect(x, top, 1, 20 - top, c('sky', 0));
  }
  return [0, 1, 2].map((i) => {
    book.add(`hill.${i}`, p.crop(i * 20, 0, 20, 20), { grav: PULL.down });
    return `hill.${i}`;
  });
}
