// DAY AND NIGHT's own title picture, in the Telling a Story look (a stage with curtains, via
// kit/starter/screens.ts): the usual title, with a framed picture over the middle that is the same
// hill twice, cut down the middle, with day on the left and night on the right.
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

/** The hill, the sun and the moon in the title's frame: the left half by day, the right half by night. */
function hillTwice(p: Pixels, pal: Pal): void {
  const { c } = pal;
  const half = FW / 2;
  for (let i = 0; i < FH; i++) {
    p.rect(FX, FY + i, half, 1, c('sky', 5 - Math.min(3, Math.floor((i / FH) * 4))));
    p.rect(FX + half, FY + i, half, 1, c('blue', Math.min(2, Math.floor((i / FH) * 3))));
  }
  p.disc(FX + 34, FY + 14, 7, c('gold', 4)).disc(FX + 34, FY + 14, 5, c('gold', 2));
  p.disc(FX + 82, FY + 14, 7, c('white', 3))
    .disc(FX + 80, FY + 12, 3, c('white', 2))
    .disc(FX + 85, FY + 16, 1.5, c('stone', 3));
  for (const [x, y] of [
    [66, 6],
    [74, 24],
    [96, 6],
    [102, 20],
    [90, 32],
  ])
    p.rect(FX + x, FY + y, 2, 2, c('gold', 5));
  for (let i = 0; i < FW; i++) {
    const hill = Math.round(FH * 0.68 - Math.sin(i / 17 + 1) * 5);
    p.rect(FX + i, FY + hill, 1, FH - hill, i < half ? c('grass', 3) : c('green', 0));
  }
  p.rect(FX + half - 1, FY, 2, FH, c('white', 3));
}

/** A street lamp as tall as a hero, standing where the title's door would: lit, as the title is about both hours. */
function lamp(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 40, 255);
  p.rect(9, 12, 2, 28, c('stone', 0)).rect(10, 12, 1, 28, c('stone', 2)).rect(5, 36, 10, 4, c('stone', 0));
  p.rect(4, 2, 12, 12, c('ink', 0)).rect(5, 3, 10, 10, c('gold', 3)).rect(7, 5, 6, 6, c('gold', 4)).rect(3, 0, 14, 2, c('ink', 0));
  return p;
}

/** The title: the name, a ribbon, Lami, and the framed hill by day and night. */
export function titlePicture(pal: Pal, book: Book, hero: Pixels, name: string, tagline: string): Pixels {
  const p = kitTitle(pal, book, hero, lamp(pal), name, tagline, 'coins', 'stage');
  for (let i = 0; i < 3; i++) p.frame(FX - 3 + i, FY - 3 + i, FW + 2 * (3 - i), FH + 2 * (3 - i), pal.c('gold', i === 0 ? 0 : i === 2 ? 1 : 3));
  hillTwice(p, pal);
  const look = lookOf(pal, 'stage');
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((p.w - ribbon) / 2);
  bevel(p, rx, 50, ribbon, 14, pal.r(look.ribbon), 3, 2);
  text(p, rx + 10, 54, tagline, look.ribbonText);
  return p;
}
