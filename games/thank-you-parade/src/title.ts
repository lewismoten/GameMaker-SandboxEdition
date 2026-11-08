// THE THANK-YOU PARADE's title poster: rays behind the town, Marge's crop duster towing the THANK YOU banner across the
// top, the name in off-register block letters, Penny marching in from the left with her mace up and Marge on the right
// with a wave, over the striped curb.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { planePicture } from './airstrip';
import { figure } from './figure';
import { halftone, inkLine, type Pal } from './print';
import { backdrop, bunting, frame, lettering, standing, W } from './screens';

/** The THANK YOU banner on its tow rope, its right end at (x, y) (the plane's tail). */
export function banner(p: Pixels, pal: Pal, x: number, y: number, words = 'THANK YOU', wave = 0): void {
  const { c } = pal;
  const w = textWidth(words) + 12;
  const left = x - 18 - w;
  p.line(left + w, y + 6, x, y, c('ink', 1));
  for (let i = 0; i < w; i++) {
    const dy = Math.round(Math.sin(i / 9 + wave) * 1.5);
    p.rect(left + i, y + dy, 1, 13, c('white', 3));
    p.set(left + i, y + dy - 1, c('ink', 0)).set(left + i, y + dy + 13, c('ink', 0));
  }
  halftone(p, left, y - 2, w, 17, c('paper', 1), 1, [c('white', 3)]);
  text(p, left + 6, y + 3, words, words.startsWith('NICE') ? c('purple', 1) : c('blue', 1), 1, true);
}

/** The plane at (x, y), shrunk or full size. */
export function plane(p: Pixels, pal: Pal, x: number, y: number): void {
  p.blit(inkLine(planePicture(pal), pal.c('ink', 0)), x, y, 255);
}

export function titlePicture(pal: Pal): Pixels {
  const { c } = pal;
  const p = backdrop(pal, 168, 5);
  bunting(p, pal, 4);
  plane(p, pal, 196, 6);
  banner(p, pal, 200, 32);
  lettering(p, pal, 68, 'THE THANK-YOU', 2);
  lettering(p, pal, 88, 'PARADE', 4);
  const sub = 'A SANDBOX SOFTWARE SPECIAL';
  p.rect(Math.round((W - textWidth(sub)) / 2) - 8, 128, textWidth(sub) + 16, 14, c('blue', 1));
  text(p, Math.round((W - textWidth(sub)) / 2), 131, sub, c('paper', 3), 1, true);
  standing(p, figure(pal, 'penny', 'walk0'), 10, 168, 2);
  standing(p, figure(pal, 'marge', 'cheer'), 270, 168, 2, true);
  frame(p, pal);
  return p;
}
