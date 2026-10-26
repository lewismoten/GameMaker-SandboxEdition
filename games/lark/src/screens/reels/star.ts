// star.fli, chapter eleven's turn (before the seed's thank-you): at the top of the tall plant the
// star caught in its leaves shakes out its points, pulls free and sails up across the sky to its
// place, and the whole plant glows (its greens brightened by palette alone) while the mustard
// seed beams.
import { Pixels } from '../../../../kit/pixels';
import { Reel } from '../../../../kit/reel';
import { blob, gradient, scaleBlit } from '../../art/draw';
import { c, r } from '../../art/pal';
import { seed } from '../../sprites/guests';
import { H, W, blend, caption, close, lit, stars } from './common';

const CAUGHT = { x: 160, y: 78 };
const HOME = { x: 250, y: 28 };

const LEAVES: [number, number, number, number][] = [
  [116, 186, 42, 12],
  [206, 162, 42, 12],
  [120, 136, 36, 10],
  [200, 112, 32, 9],
  [140, 94, 22, 7],
  [180, 90, 22, 7],
];

function plantTop(): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, H, r('dusk'), 0, 2);
  stars(p, 41, H - 60, 110);
  // the far ground, a long way down
  p.rect(0, 192, W, 8, c('grass', 0));
  // the stem, swaying up from below, and its leaves
  for (let y = 84; y < H; y++) {
    const x = Math.round(160 + Math.sin(y / 18) * 4);
    p.rect(x - 3, y, 7, 1, c('leaf', 1)).rect(x - 3, y, 2, 1, c('leaf', 3));
  }
  for (const [x, y, rx, ry] of LEAVES) {
    blob(p, x, y, rx, ry, r('leaf'), 0, 4);
    p.line(x - rx + 4, y, x + rx - 4, y, c('leaf', 1));
  }
  return p;
}

/** A five-pointed star of radius `rad`, turned `turn`. */
function star(p: Pixels, cx: number, cy: number, rad: number, turn: number): void {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = turn - Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? rad * 0.45 : rad;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.9]);
  }
  for (let y = Math.floor(cy - rad); y <= cy + rad; y++)
    for (let x = Math.floor(cx - rad); x <= cx + rad; x++) {
      let inside = false;
      for (let i = 0, j = 9; i < 10; j = i++) {
        const [xi, yi] = pts[i];
        const [xj, yj] = pts[j];
        if (yi > y + 0.5 !== yj > y + 0.5 && x + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) p.set(x, y, Math.hypot(x - cx, y - cy) < rad * 0.35 ? c('yellow', 3) : c('yellow', 2));
    }
}

/** Leafy tendrils tangled round the star. */
function tangle(p: Pixels, x: number, y: number): void {
  for (const d of [0, 1]) {
    p.line(x - 18, y + 12 + d, x + 9, y - 9 + d, c('leaf', 2)).line(x + 18, y + 10 + d, x - 7, y - 12 + d, c('leaf', 2));
    p.line(x - 15, y - 3 + d, x + 15, y + 4 + d, c('leaf', 1));
  }
}

/** Where the star is `t` of the way home (a curve up and over). */
function flight(t: number): { x: number; y: number } {
  const mx = 140;
  const my = 10;
  return {
    x: (1 - t) * (1 - t) * CAUGHT.x + 2 * (1 - t) * t * mx + t * t * HOME.x,
    y: (1 - t) * (1 - t) * CAUGHT.y + 2 * (1 - t) * t * my + t * t * HOME.y,
  };
}

export function starFli(): Uint8Array {
  const bg = plantTop();
  const night = lit('night');
  // the glow: the plant's greens lit up gold-green
  const day = lit('day');
  const glow = Uint8Array.from(night);
  for (const i of [...r('leaf'), ...r('green')]) for (let ch = 0; ch < 3; ch++) glow[i * 3 + ch] = Math.min(63, day[i * 3 + ch] + (ch < 2 ? 12 : 0));
  const reel = new Reel(night);
  const seedAt = (p: Pixels, joy: boolean) => scaleBlit(p, seed(joy ? 'joy' : 'smile', 'sprout'), 186, 46, 3);
  for (let k = 1; k <= 8; k++) reel.frame(bg, (p) => (star(p, CAUGHT.x, CAUGHT.y, 16, 0), tangle(p, CAUGHT.x, CAUGHT.y), seedAt(p, false)), 1, k / 8);
  // it shakes out its points
  for (let k = 0; k < 14; k++)
    reel.frame(bg, (p) => {
      const dx = k % 2 ? 2 : -2;
      star(p, CAUGHT.x + dx, CAUGHT.y, 16, dx * 0.06);
      if (k < 11) tangle(p, CAUGHT.x, CAUGHT.y);
      seedAt(p, false);
      caption(p, 'THE STAR SHAKES OUT ITS POINTS...');
    });
  // and sails up across the sky to its place, a trail of sparkles behind it
  const N = 26;
  for (let k = 1; k <= N; k++)
    reel.frame(bg, (p) => {
      for (let j = 1; j <= 5; j++) {
        if (k - j * 2 < 0) break;
        const s = flight((k - j * 2) / N);
        p.disc(s.x, s.y, Math.max(0.6, 2.4 - j * 0.4), c('yellow', Math.max(0, 3 - Math.floor(j / 2))));
      }
      const at = flight(k / N);
      star(p, at.x, at.y, 16 - (10 * k) / N, k * 0.25);
      seedAt(p, true);
      caption(p, '...AND SAILS HOME.');
    });
  // home: it twinkles, and the plant glows
  for (let k = 0; k < 22; k++) {
    const pal = blend(night, glow, Math.min(1, k / 10));
    reel.frame(
      bg,
      (p) => {
        const ray = k < 8 ? 22 - k * 1.5 : 10 + (k % 4 < 2 ? 3 : 0);
        p.line(HOME.x - ray, HOME.y, HOME.x + ray, HOME.y, c('yellow', 3)).line(HOME.x, HOME.y - ray, HOME.x, HOME.y + ray, c('yellow', 3));
        star(p, HOME.x, HOME.y, 6, 0);
        seedAt(p, true);
        caption(p, 'AND THE WHOLE PLANT GLOWS.');
      },
      1,
      1,
      pal,
    );
  }
  return close(reel);
}
