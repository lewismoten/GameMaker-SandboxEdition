// FIREWORKS' title picture: the name over a night sky, a ring and a peony bursting over the rooftops of a sleeping
// town, a rocket on its way up, and Mara cheering on the grass. The bursts are the game's own frames (sparks.ts).
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { bevel, gradient } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { H, W } from '../../kit/starter/screens';
import { burstKind, burstPicture, rocketPicture, sampleTimes } from './sparks';

const GROUND = 168;

/** A burst of `name` at frame `frame`, its middle at (x, y). */
function burst(p: Pixels, pal: Pal, name: 'ring' | 'peony' | 'willow' | 'pop' | 'popTeal', frame: number, x: number, y: number): void {
  const kind = burstKind(name);
  const pic = burstPicture(pal, kind, sampleTimes(kind.ticks)[frame], frame);
  p.blit(pic, Math.round(x - pic.w / 2), Math.round(y - pic.h / 2), 255);
}

/** `hero` is Mara cheering (20x40); `book` holds the town's blocks and the grass. */
export function titlePicture(pal: Pal, book: Book, hero: Pixels, name: string, tagline: string): Pixels {
  const { c, r } = pal;
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, GROUND, r('sky').slice(0, 4), 0, 3);
  const rand = rng(17);
  for (let i = 0; i < 40; i++) p.set(Math.floor(rand() * W), Math.floor(rand() * 130), rand() < 0.3 ? c('white', 1) : c('sky', 5));
  // the town along the bottom: dark blocks of houses, a few windows lit
  const roofs = ['house.roof', 'house.chimney', 'house.roof'];
  const heights = [2, 1, 3, 2, 1, 2, 3, 1, 2, 2, 1, 3, 2, 1, 2, 2];
  for (let i = 0; i < W / 20; i++) {
    const tall = heights[i];
    for (let k = 0; k < tall; k++) {
      const part = k === tall - 1 ? roofs[i % roofs.length] : (i + k) % 3 === 0 ? 'house.wallLit' : 'house.wall';
      p.blit(book.pics.get(part)!, i * 20, GROUND - 20 * (k + 1));
    }
  }
  for (let x = 0; x < W; x += 20) {
    p.blit(book.pics.get('grass')!, x, GROUND);
    p.blit(book.pics.get('dirt')!, x, GROUND + 20);
  }
  // the show: a peony and a ring at their fullest, a willow drooping, two small pops and a rocket climbing
  burst(p, pal, 'willow', 3, 158, 104);
  burst(p, pal, 'peony', 2, 84, 96);
  burst(p, pal, 'ring', 2, 252, 92);
  burst(p, pal, 'pop', 2, 300, 132);
  burst(p, pal, 'popTeal', 1, 200, 72);
  p.blit(rocketPicture(pal, 0), 204, 128, 255);
  // the name and the ribbon
  const size = name.length > 11 ? 2 : 3;
  outlined(p, Math.round((W - textWidth(name, size)) / 2), 14, name, c('gold', 4), c('ink', 0), size, c('sky', 0));
  const ribbon = textWidth(tagline) + 20;
  const rx = Math.round((W - ribbon) / 2);
  bevel(p, rx, 44, ribbon, 14, r('parch'), 3, 2);
  text(p, rx + 10, 48, tagline, c('ink', 0));
  // Mara, cheering, and the launcher beside her
  scaleBlit(p, hero, 24, GROUND - 80, 2);
  scaleBlit(p, book.pics.get('launch.pink')!, 70, GROUND - 40, 2);
  return p;
}
