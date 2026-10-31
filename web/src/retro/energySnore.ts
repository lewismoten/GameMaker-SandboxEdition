// "Energy Snore": a parody power-saving logo for the BIOS boot screen's top-right corner, like the
// 1990s POST screens had. A sleepy star with a little z in its swoosh, drawn fresh as a 16x12
// picture of half-block characters (each cell is two square pixels tall) in the BIOS colors.
import { type TextScreen, attr } from './text/textScreen';

const W = 16;
const WORDS = 'ENERGY SNORE';
const COLORS: Record<string, number> = { W: 15, e: 8, s: 7, z: 11 };
// W star, e shut eyes, s swoosh, z the snore
const PICTURE = [
  '.....WW....zzz..',
  '....WWWW.....z..',
  '....WWWW....z...',
  '...WWWWWW..zzz..',
  '.WWWWWWWWWWWWWW.',
  '..WWWWWWWWWWWW..',
  '..WWeeWWWWeeWW..',
  '...WWWWWWWWWW...',
  '....WWWWWWWW....',
  '...WWWW..WWWW...',
  '..WWW......WWW..',
  '.sWW........WWs.',
  'sssssssssssssss.',
  '..ssssssssssss..',
];

/** Cells the logo covers, from the top right corner: its column, rows and width. */
const X = 80 - W - 2;

/** Draws it; the BIOS lines above and left of it are shorter than the picture's column. */
export function drawEnergySnore(s: TextScreen): void {
  for (let row = 0; row < PICTURE.length; row += 2) {
    for (let x = 0; x < W; x++) {
      const top = COLORS[PICTURE[row][x]] ?? -1;
      const bottom = COLORS[PICTURE[row + 1][x]] ?? -1;
      if (top < 0 && bottom < 0) continue;
      if (top === bottom) s.put(X + x, row / 2, 0xdb, attr(top, 0));
      else if (bottom < 0) s.put(X + x, row / 2, 0xdf, attr(top, 0));
      else if (top < 0) s.put(X + x, row / 2, 0xdc, attr(bottom, 0));
      else s.put(X + x, row / 2, 0xdf, attr(top, bottom));
    }
  }
  s.write(X + Math.floor((W - WORDS.length) / 2), PICTURE.length / 2, attr(15, 0), WORDS);
}

/** Wipes it when the self test is over (the logo belongs to the BIOS screen, not to DOS). */
export function clearEnergySnore(s: TextScreen): void {
  s.fill(X, 0, X + W - 1, PICTURE.length / 2, attr(7, 0));
}
