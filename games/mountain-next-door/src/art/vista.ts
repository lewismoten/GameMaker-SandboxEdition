// The game's own backdrop for every full-screen picture (title, menu, level cards, story pages, the end), in the
// same trail-guide woodcut as its blocks: a sky in flat bands with hatched seams, a pale sun ringed in ink, a far
// range of jagged peaks with snow and hatched shadow sides, a dark treeline of firs and autumn oaks, then the
// level's own turf and earth. restage() puts it behind a picture the shared screens drew over their sunny scene.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Book } from '../../../kit/starter/book';
import { scene } from '../../../kit/starter/screens';
import type { Pal } from '../../../kit/starter/palette';

const W = 320;
const H = 200;

export function vista(pal: Pal, book: Book, ground = 160, seed = 3): Pixels {
  const s = pal.r('sky');
  const ink = pal.c('ink', 0);
  const p = new Pixels(W, H, s[1]);
  // the sky: five flat bands, lighter toward the horizon, each seam hatched
  const bands = 5;
  for (let k = 0; k < bands; k++) {
    const y0 = Math.round((k * (ground - 30)) / bands);
    const y1 = Math.round(((k + 1) * (ground - 30)) / bands);
    p.rect(0, y0, W, ground - y0, s[Math.min(5, 1 + k)]);
    for (let y = y0; y < Math.min(y1, y0 + 4); y++) for (let x = 0; x < W; x++) if ((x + y * 3) % 6 === 0) p.set(x, y, s[Math.min(5, k)]);
  }
  // the sun, low and pale, ringed in ink
  const rand = rng(seed);
  const sx = 40 + Math.floor(rand() * 240);
  p.disc(sx, ground - 70, 13, pal.c('white', 3)).ring(sx, ground - 70, 13, s[0]);
  for (let y = ground - 78; y < ground - 62; y += 3) p.rect(sx - 9, y, 18, 1, pal.c('parch', 4));
  // the far range: jagged peaks, snow on the tops, the shadowed sides hatched
  const peaks: [number, number][] = [];
  for (let x = -20; x < W + 40; x += 38 + Math.floor(rand() * 30)) peaks.push([x, ground - 50 - Math.floor(rand() * 28)]);
  const ridge = (x: number) => {
    let best = ground - 18;
    for (const [px, py] of peaks) best = Math.min(best, py + Math.abs(x - px) * 0.9);
    return Math.round(best);
  };
  for (let x = 0; x < W; x++) {
    const top = ridge(x);
    const left = ridge(x - 1) <= top; // sunlit if the slope falls to the right
    for (let y = top; y < ground; y++) {
      let c = s[0];
      if (y - top < 4 && top < ground - 50) c = pal.c('white', 3);
      else if (!left && (x + y) % 3 === 0) c = ink;
      p.set(x, y, c);
    }
    p.set(x, top, ink);
  }
  // the treeline: pointed firs and round oaks, dark, with autumn leaves on the oaks
  const m = pal.r('moss');
  let x = -6;
  while (x < W + 6) {
    const h = 16 + Math.floor(rand() * 14);
    if (rand() < 0.55) {
      for (let k = 0; k < h; k++) {
        const half = Math.round((k / h) * 6);
        p.rect(x - half, ground - h + k, half * 2 + 1, 1, k % 4 === 3 ? m[1] : m[0]);
      }
      p.set(x, ground - h - 1, ink);
    } else {
      const r = 6 + Math.floor(rand() * 4);
      p.disc(x, ground - r - 4, r, m[1]).ring(x, ground - r - 4, r, ink);
      for (let i = 0; i < 6; i++) p.set(x - r + 2 + Math.floor(rand() * (r * 2 - 3)), ground - 4 - Math.floor(rand() * r * 2), pal.c('orange', 3));
    }
    x += 7 + Math.floor(rand() * 8);
  }
  p.rect(0, ground - 4, W, 4, m[0]);
  for (let y = ground; y < H; y += 20) for (let gx = 0; gx < W; gx += 20) p.blit(book.pics.get(y === ground ? 'grass' : 'dirt') as Pixels, gx, y, 255);
  return p;
}

/** A picture the shared screens drew over their sunny scene, with this game's vista behind it instead. */
export function restage(pic: Pixels, pal: Pal, book: Book, ground: number, seed: number): Pixels {
  const sunny = scene(pal, book, ground, seed);
  const back = vista(pal, book, ground, seed);
  return pic.map((x, y, c) => (y < ground && c === sunny.get(x, y) ? back.get(x, y) : c));
}
