// PASS THE PIE's title picture: a warm autumn evening street, Rory in his scarf under a big pie, a row of houses
// with lit windows and leaves blowing past. 320x200.
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { outlined, centered, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Pal } from '../../kit/starter/palette';
import { pie } from './art';

const W = 320;

export function titlePicture(pal: Pal, rory: Pixels): Pixels {
  const { c } = pal;
  const p = new Pixels(W, 200);
  // the sky: bands from gold at the horizon up through orange to rose
  const bands = [c('gold', 4), c('gold', 3), c('orange', 3), c('orange', 2), c('pink', 2), c('pink', 1)];
  for (let y = 0; y < 150; y++) p.rect(0, y, W, 1, bands[Math.min(5, 5 - Math.floor((y / 150) * 6))]);
  p.disc(246, 118, 24, c('gold', 5)); // the sun low behind the roofs
  // houses: a row of small ones, each with lit windows and a chimney
  const colors = ['brick', 'blue', 'green', 'purple', 'teal'] as const;
  for (let i = 0; i < 8; i++) {
    const x = i * 42 - 6;
    const h = 40 + ((i * 17) % 22);
    const col = colors[i % 5];
    p.rect(x, 150 - h, 40, h, c(col, 2)).rect(x, 150 - h, 40, 2, c(col, 3));
    p.rect(x + 8, 150 - h + 10, 9, 12, c('gold', 5)).rect(x + 24, 150 - h + 10, 9, 12, c('gold', 4));
    p.rect(x + 30, 150 - h - 8, 5, 8, c('stone', 2));
  }
  for (let y = 150; y < 200; y++) p.rect(0, y, W, 1, y < 156 ? c('grass', 2) : c('dirt', y < 172 ? 3 : 2));
  const rand = rng(11);
  for (let i = 0; i < 34; i++)
    p.rect(Math.floor(rand() * W), 6 + Math.floor(rand() * 160), 3, 2, [c('red', 3), c('orange', 3), c('gold', 3), c('orange', 2)][i % 4]);
  const name = 'PASS THE PIE';
  outlined(p, Math.round((W - textWidth(name, 3)) / 2), 14, name, c('white', 3), c('brick', 0), 3, c('ink', 0));
  const tag = 'A THANKSGIVING SPECIAL';
  const rw = textWidth(tag) + 20;
  bevel(p, Math.round((W - rw) / 2), 54, rw, 14, pal.r('parch'), 3, 2);
  centered(p, 58, tag, c('brick', 0));
  p.rect(126, 188, 68, 3, c('dirt', 0));
  scaleBlit(p, rory, 140, 106, 2);
  scaleBlit(p, pie(pal), 140, 70, 2, false, c('sky', 3));
  return p;
}
