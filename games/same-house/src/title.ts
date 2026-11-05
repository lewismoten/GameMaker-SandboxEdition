// THE SAME HOUSE's own title picture, in the Telling a Story look (a stage with curtains, via
// kit/starter/screens.ts): the usual title, with a framed picture over the middle of three houses in a
// row. They are the same drawing three times, with different roofs, walls and doors.
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { titlePicture as kitTitle } from '../../kit/starter/screens';
import { lookOf } from '../../kit/starter/titleStyles';

const FX = 112;
const FY = 71;
const FW = 112;
const FH = 52;

/** One small house at (x, y = its ground line): a stepped roof, a wall, a window and a door. */
function smallHouse(p: Pixels, pal: Pal, x: number, ground: number, roof: string, wall: string, door: string): void {
  const { c } = pal;
  p.rect(x, ground - 16, 30, 16, c(wall, 3))
    .rect(x, ground - 16, 30, 1, c(wall, 1))
    .rect(x, ground - 2, 30, 2, c(wall, 1));
  for (let i = 0; i < 4; i++) p.rect(x - 2 + i * 3, ground - 16 - (i + 1) * 3, 34 - i * 6, 3, c(roof, i % 2 ? 3 : 2));
  p.rect(x + 3, ground - 12, 7, 7, c('sky', 4)).frame(x + 3, ground - 12, 7, 7, c('ink', 0));
  p.rect(x + 18, ground - 12, 7, 7, c('sky', 4)).frame(x + 18, ground - 12, 7, 7, c('ink', 0));
  p.rect(x + 12, ground - 11, 6, 11, c(door, 3)).frame(x + 12, ground - 11, 6, 11, c('ink', 0));
  p.set(x + 16, ground - 5, c('gold', 5));
}

/** Three houses on a lawn under a blue sky, each the same but for its colors. */
function threeHouses(p: Pixels, pal: Pal): void {
  const { c } = pal;
  for (let i = 0; i < FH; i++) p.rect(FX, FY + i, FW, 1, c('sky', 5 - Math.min(3, Math.floor((i / FH) * 4))));
  p.disc(FX + 100, FY + 9, 5, c('gold', 4));
  p.rect(FX, FY + 42, FW, FH - 42, c('grass', 3));
  smallHouse(p, pal, FX + 4, FY + 42, 'red', 'parch', 'teal');
  smallHouse(p, pal, FX + 41, FY + 42, 'blue', 'pink', 'orange');
  smallHouse(p, pal, FX + 78, FY + 42, 'green', 'sky', 'purple');
}

/** A door as tall as a hero, standing where the title's door would. */
function door(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 40, 255);
  p.rect(2, 2, 16, 38, c('ink', 0)).rect(3, 3, 14, 37, c('wood', 2)).rect(5, 5, 10, 14, c('wood', 3)).rect(5, 22, 10, 14, c('wood', 3));
  p.rect(13, 22, 2, 2, c('gold', 5));
  return p;
}

/** The title: the name, a ribbon, Kit, and the framed row of houses. */
export function titlePicture(pal: Pal, book: Book, hero: Pixels, name: string, tagline: string): Pixels {
  const p = kitTitle(pal, book, hero, door(pal), name, tagline, 'coins', 'stage');
  for (let i = 0; i < 3; i++) p.frame(FX - 3 + i, FY - 3 + i, FW + 2 * (3 - i), FH + 2 * (3 - i), pal.c('gold', i === 0 ? 0 : i === 2 ? 1 : 3));
  threeHouses(p, pal);
  const look = lookOf(pal, 'stage');
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((p.w - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  return p;
}
