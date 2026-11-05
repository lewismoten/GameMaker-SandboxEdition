// LITTLE SHADOWS' own blocks, added to the Starter block set before the signs:
//   wall, wallCap     a pale stone wall at the back of the yard, and its top edge
//   doorTopW ...      the Starter doors again with the wall behind them instead of sky
//   lane.*            the strip of ground Kit and the critters stand in (not solid: he walks in it): sand, grass, soil
//   floor.*           the same ground, solid, in the rows below the lane
// The lane and the floor are drawn the same on purpose, so the ground looks like one field that reaches back to the wall.
// Kit stands in the bottom of the lane's block, and his shadow is painted on the ground behind his feet.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, PULL, SOLID } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

export type Ground = 'sand' | 'grass' | 'soil';
export const GROUNDS: Ground[] = ['sand', 'grass', 'soil'];

/** The wall's color. */
export const wallColor = (pal: Pal): number => pal.c('stone', 3);
const onWall = (pal: Pal, pic: Pixels): Pixels => new Pixels(20, 20).blit(pic, 0, 0).map((_x, _y, c) => (c === skyOf(pal) ? wallColor(pal) : c));

/** A ground's colors: a base, a lighter fleck and a darker fleck (palette indexes). */
export function groundColors(pal: Pal, g: Ground): { base: number; light: number; dark: number } {
  const { c } = pal;
  if (g === 'sand') return { base: c('parch', 3), light: c('parch', 4), dark: c('parch', 2) };
  if (g === 'grass') return { base: c('grass', 3), light: c('grass', 4), dark: c('grass', 2) };
  return { base: c('dirt', 1), light: c('dirt', 2), dark: c('dirt', 0) };
}

/** One 20x20 piece of ground with a few flecks (the same flecks in the lane and the floor, so they join). */
function ground(pal: Pal, g: Ground, seed: number): Pixels {
  const { base, light, dark } = groundColors(pal, g);
  const p = new Pixels(20, 20, base);
  const rand = rng(seed);
  for (let i = 0; i < 14; i++) p.set(Math.floor(rand() * 20), Math.floor(rand() * 20), i % 3 === 0 ? light : dark);
  return p;
}

export function addYardBlocks(book: Book, pal: Pal): void {
  const { c } = pal;
  const air = { grav: PULL.down };
  {
    const p = new Pixels(20, 20, wallColor(pal));
    p.rect(0, 9, 20, 1, c('stone', 2)).rect(0, 19, 20, 1, c('stone', 2));
    p.rect(5, 0, 1, 9, c('stone', 2)).rect(15, 10, 1, 9, c('stone', 2));
    book.add('wall', p, air);
    const cap = new Pixels(20, 20, skyOf(pal));
    cap.rect(0, 12, 20, 8, wallColor(pal)).rect(0, 12, 20, 2, c('stone', 4)).rect(0, 14, 20, 1, c('stone', 2));
    book.add('wallCap', cap, air);
  }
  book.add('doorTopW', onWall(pal, book.pics.get('doorTop')!), air);
  book.add('doorwayTopW', onWall(pal, book.pics.get('doorwayTop')!), air);
  GROUNDS.forEach((g, i) => {
    // the lane's top two rows are the wall's foot: a dark line where the ground meets the stone
    const lane = ground(pal, g, 40 + i).rect(0, 0, 20, 1, c('stone', 1)).rect(0, 1, 20, 1, c('stone', 2));
    book.add(`lane.${g}`, lane, air);
    book.add(`floor.${g}`, ground(pal, g, 40 + i), { solid: SOLID });
    // a door's foot stands in the lane: the same door with the lane's ground around it (the other blocks' sky is the wall's stone)
    for (const [name, from] of [
      ['doorBottom', 'doorBottom'],
      ['doorwayBottom', 'doorwayBottom'],
    ] as const)
      book.add(`${name}.${g}`, new Pixels(20, 20).blit(book.pics.get(from)!, 0, 0).map((x, y, col) => (col === skyOf(pal) ? lane.get(x, y) : col)), air);
  });
}
