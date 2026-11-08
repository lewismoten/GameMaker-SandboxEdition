// LUCKY CAT's two cartoons, drawn in code frame by frame (kit/reel.ts) over the town of the title picture:
//   intro   a ladder topples, an umbrella pops open indoors, the salt spills; the townsfolk point at Midnight; she
//           squares her shoulders and the 13 charms spin around her
//   ending  confetti falls on the town square: Midnight on the podium under the OFFICIAL LUCKY MASCOT banner,
//           Rascal waving beside her
import { Reel } from '@lewismoten/gamemaker-sandbox-tools/kit/reel';
import { centered, text } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { scene } from '../../kit/starter/screens';
import { CHARMS, charmSprite } from './charms';
import { town } from './pictures';

/** FLI speed in 1/70 s: 5 is 14 frames a second. */
export const REEL_SPEED = 5;

/** The street the cartoons play on: sky, hills, the town and the grass at y 160. */
function street(pal: Pal, book: Book, seed: number, rows = true): Pixels {
  const p = scene(pal, book, 160, seed, rows);
  town(p, pal, 152, 262);
  return p;
}

/** A word balloon with `s` in it, its tail pointing down at (tx, ty). */
function balloon(p: Pixels, pal: Pal, x: number, y: number, s: string, tx: number, ty: number): void {
  const w = s.length * 8 + 12;
  bevel(p, x, y, w, 16, pal.r('parch'), 3, 2);
  p.rect(x + 3, y + 3, w - 6, 10, pal.c('parch', 4));
  text(p, x + 6, y + 4, s, pal.c('ink', 0));
  p.line(x + Math.round(w / 2) - 2, y + 16, tx, ty, pal.c('wood', 1)).line(x + Math.round(w / 2) + 2, y + 16, tx, ty, pal.c('wood', 1));
}

/** A townsperson: a round head, a colored coat; `point` holds an arm out toward the cat. */
function folk(p: Pixels, pal: Pal, x: number, ramp: string, point: boolean, hop = 0): void {
  const { c } = pal;
  const y = 152 - hop;
  p.rect(x - 5, y - 24, 11, 24, c(ramp, 2)).frame(x - 5, y - 24, 11, 24, c('ink', 0));
  p.disc(x, y - 30, 6, c('skin', 3)).ring(x, y - 30, 6, c('ink', 0));
  p.rect(x - 3, y - 32, 2, 2, c('ink', 0)).rect(x + 2, y - 32, 2, 2, c('ink', 0));
  p.rect(x - 2, y - 27, 5, 1, c('ink', 0));
  if (point) p.line(x + 5, y - 20, x + 17, y - 22, c('skin', 2)).line(x + 5, y - 19, x + 17, y - 21, c('skin', 2));
  p.rect(x - 4, y, 4, 8, c('ink', 1)).rect(x + 2, y, 4, 8, c('ink', 1));
}

/** The intro cartoon. */
export function introReel(pal: Pal, book: Book, cat: Pixels): Reel {
  const { c } = pal;
  const reel = new Reel(pal.pal);
  const bg = street(pal, book, 14, false); // the title cartoon keeps its dithered sky
  const rand = rng(5);
  // 1. the town on Friday the 13th
  const banner = (p: Pixels, s: string) => {
    bevel(p, 40, 14, 240, 22, pal.r('parch'), 3, 2);
    p.rect(44, 18, 232, 14, c('parch', 4));
    centered(p, 22, s, c('ink', 0));
  };
  const day = new Pixels(320, 200);
  day.px.set(bg.px);
  banner(day, 'FRIDAY THE 13TH');
  reel.fadeIn(day, 5);
  reel.add(day, 8);
  // 2. the ladder topples across the street
  for (let i = 0; i <= 10; i++) {
    reel.frame(
      bg,
      (p) => {
        banner(p, 'THE LADDER FELL!');
        const a = (i / 10) * (Math.PI / 2.2);
        const bx = 120;
        for (const d of [0, 9]) {
          const x0 = bx + d * Math.cos(a);
          const y0 = 152 - d * Math.sin(a) * 0.3;
          p.line(Math.round(x0), Math.round(y0), Math.round(x0 + Math.sin(a) * 80), Math.round(y0 - Math.cos(a) * 80), c('orange', 2));
          p.line(Math.round(x0) + 1, Math.round(y0), Math.round(x0 + Math.sin(a) * 80) + 1, Math.round(y0 - Math.cos(a) * 80), c('orange', 3));
        }
        for (let r = 1; r < 8; r++) {
          const f = r / 8;
          p.line(
            Math.round(bx + Math.sin(a) * 80 * f),
            Math.round(152 - Math.cos(a) * 80 * f),
            Math.round(bx + 9 * Math.cos(a) + Math.sin(a) * 80 * f),
            Math.round(152 - 9 * Math.sin(a) * 0.3 - Math.cos(a) * 80 * f),
            c('wood', 3),
          );
        }
      },
      i === 10 ? 4 : 1,
    );
  }
  // 3. an umbrella pops open indoors
  for (let i = 0; i <= 8; i++) {
    reel.frame(
      bg,
      (p) => {
        banner(p, 'AN UMBRELLA!');
        const r = 4 + i * 2.4;
        p.rect(160, 120, 2, 30, c('ink', 1));
        p.disc(161, 120, r, c('red', 2));
        p.rect(161 - Math.round(r), 120, Math.round(r) * 2, Math.round(r), c('sky', 3));
        for (let k = -2; k <= 2; k++) p.disc(161 + k * (r / 2.2), 120, 2, c('red', 2));
        p.rect(161 - Math.round(r), 120, Math.round(r) * 2, 1, c('red', 1));
      },
      i === 8 ? 4 : 1,
    );
  }
  // 4. the salt spills
  for (let i = 0; i <= 8; i++) {
    reel.frame(
      bg,
      (p) => {
        banner(p, 'THE SALT SPILLED!');
        p.rect(200 + i, 138 + i * 2, 12, 16 - i, c('white', 3)).frame(200 + i, 138 + i * 2, 12, 16 - i, c('ink', 0));
        for (let k = 0; k < i * 5; k++) {
          const dx = Math.floor(rand() * 40) - 8;
          const dy = Math.floor(rand() * 14);
          p.set(214 + dx + i * 2, 148 + dy, c('white', 3));
        }
      },
      i === 8 ? 4 : 1,
    );
  }
  // 5. the townsfolk point at Midnight
  for (let i = 0; i < 12; i++) {
    reel.frame(
      bg,
      (p) => {
        banner(p, 'WHO DID IT? THE CAT!');
        folk(p, pal, 40, 'red', i > 1, i % 4 < 2 ? 0 : 1);
        folk(p, pal, 80, 'blue', i > 3, i % 4 < 2 ? 1 : 0);
        folk(p, pal, 120, 'green', i > 5, i % 4 < 2 ? 0 : 1);
        scaleBlit(p, cat, 210, 160 - 80, 2);
        if (i > 5) balloon(p, pal, 28, 54, 'BAD LUCK CAT!', 70, 100);
        if (i > 8) p.rect(236, 80 + (i % 2), 2, 3, c('sky', 5));
      },
      i === 11 ? 5 : 1,
    );
  }
  // 6. Midnight has had enough: the 13 charms spin around her
  for (let i = 0; i < 30; i++) {
    reel.frame(
      bg,
      (p) => {
        banner(p, 'NOT A CHANCE!');
        scaleBlit(p, cat, 140, 160 - 80, 2);
        const shown = Math.min(13, i + 1);
        for (let k = 0; k < shown; k++) {
          const a = (k / 13) * Math.PI * 2 + i * 0.22;
          const rr = 46 + Math.sin(i * 0.4 + k) * 4;
          p.blit(charmSprite(pal, CHARMS[k]), Math.round(160 + Math.cos(a) * rr * 1.5 - 10), Math.round(112 + Math.sin(a) * rr * 0.8 - 10), 255);
        }
        if (i > 18) balloon(p, pal, 36, 40, 'I AM THE LUCKIEST!', 140, 100);
      },
      i === 29 ? 6 : 1,
    );
  }
  reel.fadeOut(5);
  return reel;
}

/** The ending cartoon; `rascal` (a 20x40 picture) waves beside her when given. */
export function endingReel(pal: Pal, book: Book, cheer: Pixels, rascal?: Pixels): Reel {
  const { c } = pal;
  const reel = new Reel(pal.pal);
  const bg = street(pal, book, 24);
  const rand = rng(11);
  const confetti = Array.from({ length: 70 }, () => ({
    x: Math.floor(rand() * 320),
    y: Math.floor(rand() * 200),
    v: 3 + Math.floor(rand() * 3),
    col: [c('red', 2), c('gold', 4), c('blue', 3), c('pink', 2), c('green', 3)][Math.floor(rand() * 5)],
  }));
  const draw = (p: Pixels, t: number) => {
    // the podium and its banner
    p.rect(110, 128, 100, 24, c('wood', 2)).frame(110, 128, 100, 24, c('wood', 0)).rect(110, 128, 100, 3, c('wood', 4));
    centered(p, 138, '1ST', c('gold', 4));
    bevel(p, 30, 22, 260, 24, pal.r('parch'), 3, 2);
    p.rect(34, 26, 252, 16, c('parch', 4));
    centered(p, 30, 'OFFICIAL LUCKY MASCOT', c('red', 1));
    scaleBlit(p, cheer, 140, 128 - 80 + (t % 8 < 4 ? 0 : -3), 2);
    // her ribbon, on the podium front
    p.rect(150, 144, 20, 5, c('red', 2));
    if (rascal) scaleBlit(p, rascal, 228, 152 - 80, 2);
    for (const k of confetti) {
      const y = (k.y + t * k.v) % 200;
      p.rect((k.x + Math.round(Math.sin((t + k.v * 7) / 4) * 4) + 320) % 320, y, 3, 2, k.col);
    }
  };
  const first = new Pixels(320, 200);
  first.px.set(bg.px);
  draw(first, 0);
  reel.fadeIn(first, 5);
  for (let t = 1; t < 56; t++) reel.frame(bg, (p) => draw(p, t), 1);
  reel.fadeOut(5);
  return reel;
}
