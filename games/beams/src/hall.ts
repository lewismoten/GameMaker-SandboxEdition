// The night hall of levels 1 and 3, drawn with blocks (a dark brick wall, a wooden floor, a ceiling beam, a hanging lamp) and,
// for level 1, the same wall and floor lit by a beam at each density: wallLit25/50/75/100 and floorLit25/50/75/100.
//   The beam's pixels are the lamp's light color painted over the wall at that density (light.ts). 100 is solid: the bricks are gone.
// The lit blocks are twins of the plain ones: same bricks, same planks, with light painted over them. A level swaps a plain block
// for its twin wherever the beam falls.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { veil, type Density } from './light';

export const DENSITIES: Density[] = [25, 50, 75, 100];

/** The light's color: a pale yellow, the lightest gold. */
export const lightColor = (pal: Pal): number => pal.c('gold', 4);

/** A brick wall: four courses of bricks five pixels tall, the joints shifted from course to course, a lit top edge on each brick. */
export function wallPicture(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c('stone', 1));
  for (let course = 0; course < 4; course++) {
    const y = course * 5;
    p.rect(0, y + 4, 20, 1, c('ink', 0));
    p.rect(0, y, 20, 1, c('stone', 2));
    const joint = course % 2 === 0 ? 0 : 10;
    for (const x of [joint, joint + 10]) p.rect(x % 20, y, 1, 5, c('ink', 0));
  }
  return p;
}

/** Wooden floor planks, three of them, seams between. Solid. */
export function floorPicture(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c('wood', 1));
  p.rect(0, 0, 20, 2, c('wood', 2)).rect(0, 2, 20, 1, c('wood', 0));
  p.rect(0, 9, 20, 1, c('wood', 0)).rect(0, 15, 20, 1, c('wood', 0));
  p.rect(7, 3, 1, 6, c('wood', 0)).rect(14, 10, 1, 5, c('wood', 0)).rect(4, 16, 1, 4, c('wood', 0));
  p.set(11, 5, c('wood', 2)).set(3, 12, c('wood', 2)).set(17, 18, c('wood', 2));
  return p;
}

/** A dark ceiling beam. */
function ceilingPicture(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c('wood', 0));
  p.rect(0, 14, 20, 6, c('wood', 1)).rect(0, 14, 20, 1, c('wood', 2));
  p.rect(0, 10, 20, 1, c('ink', 0));
  return p;
}

/** The lamp: a cord from the ceiling and a little metal shade, its bulb the light's color, on the wall. */
function lampPicture(pal: Pal, wall: Pixels): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20).blit(wall, 0, 0);
  p.rect(10, 0, 1, 7, c('ink', 2));
  p.rect(6, 7, 9, 2, c('stone', 2)).rect(5, 9, 11, 2, c('stone', 3)).rect(4, 11, 13, 1, c('stone', 4));
  p.rect(7, 12, 7, 2, lightColor(pal)).rect(8, 14, 5, 1, lightColor(pal));
  return p;
}

/** The Starter doors with the wall behind them instead of sky. */
function onWall(pal: Pal, pic: Pixels, wall: Pixels): Pixels {
  return new Pixels(20, 20).blit(pic, 0, 0).map((x, y, col) => (col === skyOf(pal) ? wall.get(x, y) : col));
}

/** Adds the hall's blocks. `lit` also adds the lit twins of the wall and the floor (level 1). */
export function addHallBlocks(book: Book, pal: Pal, lit: boolean): void {
  const air = { grav: PULL.down };
  const wall = wallPicture(pal);
  const floor = floorPicture(pal);
  book.add('wall', wall, air);
  book.add('ceiling', ceilingPicture(pal), { solid: SOLID });
  book.add('floor', floor, { solid: SOLID });
  book.add('lamp', lampPicture(pal, wall), air);
  book.add('doorTopW', onWall(pal, book.pics.get('doorTop')!, wall), air);
  book.add('doorBottomW', onWall(pal, book.pics.get('doorBottom')!, wall), air);
  book.add('doorwayTopW', onWall(pal, book.pics.get('doorwayTop')!, wall), air);
  book.add('doorwayBottomW', onWall(pal, book.pics.get('doorwayBottom')!, wall), air);
  if (!lit) return;
  for (const d of DENSITIES) {
    book.add(`wallLit${d}`, veil(wall, d, lightColor(pal)), air);
    book.add(`floorLit${d}`, veil(floor, d, lightColor(pal)), { solid: SOLID });
  }
}
