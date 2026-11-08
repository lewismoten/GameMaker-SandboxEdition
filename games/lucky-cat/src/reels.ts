// LUCKY CAT's two cartoons, drawn in code frame by frame (kit/reel.ts) in the game's woodcut, over the night street:
//   intro   Friday the 13th: a ladder topples, an umbrella pops open, the salt spills; the town points at Midnight;
//           she takes it the way a cat takes anything (a slow blink), and the 13 charms wheel round her. In the
//           last frames a ringed tail slips behind a chimney: someone else was on that roof.
//   ending  payback: Midnight pulls one rope, Rascal's own paint can tips over Rascal, and the whole town points at
//           the white raccoon holding the rope. Then the podium and the confetti.
import { Reel } from '@lewismoten/gamemaker-sandbox-tools/kit/reel';
import { centered, text } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { CHARMS, charmSprite } from './charms';
import { T, type Pal } from './print';
import { scene } from './screens';

/** FLI speed in 1/70 s: 5 is 14 frames a second. */
export const REEL_SPEED = 5;

/** A caption box across the top, comic style. */
function caption(p: Pixels, pal: Pal, s: string): void {
  const { c } = pal;
  const w = s.length * 8 + 20;
  const x = Math.round((320 - w) / 2);
  p.rect(x + 3, 13, w, 18, c('ink', 0));
  p.rect(x, 10, w, 18, c('ink', 0))
    .rect(x + 1, 11, w - 2, 16, c('paper', 4))
    .rect(x + 1, 11, 5, 5, c('red', 2));
  centered(p, 15, s, c('ink', 0));
}

/** A word balloon with `s` in it, its tail pointing down at (tx, ty). */
function balloon(p: Pixels, pal: Pal, x: number, y: number, s: string, tx: number, ty: number): void {
  const { c } = pal;
  const w = s.length * 8 + 12;
  p.line(x + Math.round(w / 2) - 3, y + 15, tx, ty, c('ink', 0)).line(x + Math.round(w / 2) + 3, y + 15, tx, ty, c('ink', 0));
  p.line(x + Math.round(w / 2) - 2, y + 15, tx, ty, c('paper', 4)).line(x + Math.round(w / 2) + 2, y + 15, tx, ty, c('paper', 4));
  p.rect(x, y, w, 16, c('ink', 0)).rect(x + 1, y + 1, w - 2, 14, c('paper', 4));
  text(p, x + 6, y + 4, s, c('ink', 0));
}

/** A townsperson in silhouette: ink coat and a hat or a bun, cut in paper; `point` aims an arm at `dir`. */
function folk(p: Pixels, pal: Pal, x: number, kind: number, point: boolean, dir: 1 | -1, hop = 0): void {
  const { c } = pal;
  const y = 158 - hop;
  const cutLine = c('paper', 3);
  const ink = c('ink', 1);
  p.rect(x - 7, y - 30, 15, 31, cutLine).rect(x - 6, y - 29, 13, 29, ink);
  p.disc(x, y - 37, 7, cutLine).disc(x, y - 37, 6, ink);
  if (kind % 3 === 0)
    p.rect(x - 9, y - 43, 19, 2, cutLine)
      .rect(x - 5, y - 50, 11, 8, cutLine)
      .rect(x - 4, y - 49, 9, 7, ink);
  else if (kind % 3 === 1) p.disc(x, y - 45, 4, cutLine).disc(x, y - 45, 3, ink);
  else p.rect(x - 7, y - 26, 15, 3, c('red', 2));
  if (point) {
    const ex = x + dir * 22;
    p.line(x + dir * 6, y - 24, ex, y - 28, cutLine)
      .line(x + dir * 6, y - 23, ex, y - 27, ink)
      .line(x + dir * 6, y - 22, ex, y - 26, ink);
  }
}

/** A sprite repainted: every pixel of one color index set to another (Rascal under white paint). */
function repaint(src: Pixels, from: number[], to: number): Pixels {
  return new Pixels(src.w, src.h).map((x, y) => {
    const v = src.get(x, y);
    return from.includes(v) ? to : v;
  });
}

/** The intro cartoon. */
export function introReel(pal: Pal, cat: Pixels, smug: Pixels, rascal: Pixels): Reel {
  const { c } = pal;
  const reel = new Reel(pal.pal);
  const bg = scene(pal, 160, 14);
  const rand = rng(5);
  const day = new Pixels(320, 200);
  day.px.set(bg.px);
  caption(day, pal, 'FRIDAY THE 13TH. FENNEL HOLLOW.');
  reel.fadeIn(day, 5);
  reel.add(day, 10);
  // the ladder topples across the street
  for (let i = 0; i <= 10; i++)
    reel.frame(
      bg,
      (p) => {
        caption(p, pal, '7:02 PM. A LADDER FALLS OVER.');
        const a = (i / 10) * (Math.PI / 2.2);
        const bx = 120;
        for (const d of [0, 9]) {
          const x0 = bx + d * Math.cos(a);
          const y0 = 158 - d * Math.sin(a) * 0.3;
          p.line(Math.round(x0), Math.round(y0), Math.round(x0 + Math.sin(a) * 80), Math.round(y0 - Math.cos(a) * 80), c('paper', 3));
          p.line(Math.round(x0) + 1, Math.round(y0), Math.round(x0 + Math.sin(a) * 80) + 1, Math.round(y0 - Math.cos(a) * 80), c('ink', 0));
        }
      },
      i === 10 ? 6 : 1,
    );
  // an umbrella pops open
  for (let i = 0; i <= 8; i++)
    reel.frame(
      bg,
      (p) => {
        caption(p, pal, '7:03. AN UMBRELLA OPENS. INDOORS.');
        const r = 4 + i * 2.4;
        p.rect(160, 120, 2, 36, c('ink', 0));
        for (let y = 0; y < r; y++) {
          const half = Math.round(Math.sqrt(r * r - (r - y) ** 2));
          p.rect(161 - half, 120 - Math.round(r) + y, half * 2, 1, c('red', 2));
        }
        p.rect(161 - Math.round(r), 120, Math.round(r) * 2, 1, c('paper', 3));
      },
      i === 8 ? 6 : 1,
    );
  // the salt spills
  for (let i = 0; i <= 8; i++)
    reel.frame(
      bg,
      (p) => {
        caption(p, pal, '7:04. THE SALT. ALL OF IT.');
        p.rect(200 + i, 140 + i * 2, 12, 16 - i, c('paper', 4)).frame(200 + i, 140 + i * 2, 12, 16 - i, c('ink', 0));
        for (let k = 0; k < i * 6; k++) p.set(214 + Math.floor(rand() * 40) - 8 + i * 2, 150 + Math.floor(rand() * 10), c('paper', 4));
      },
      i === 8 ? 6 : 1,
    );
  // the town points at Midnight
  for (let i = 0; i < 16; i++)
    reel.frame(
      bg,
      (p) => {
        caption(p, pal, '7:05. THE TOWN REACHES A VERDICT.');
        folk(p, pal, 40, 0, i > 1, 1, i % 4 < 2 ? 0 : 1);
        folk(p, pal, 82, 1, i > 3, 1, i % 4 < 2 ? 1 : 0);
        folk(p, pal, 124, 2, i > 5, 1, i % 4 < 2 ? 0 : 1);
        scaleBlit(p, i > 11 ? smug : cat, 220, 158 - 80, 2, true, T);
        if (i > 5) balloon(p, pal, 20, 52, 'BLACK CAT! BAD LUCK!', 70, 104);
      },
      i === 15 ? 8 : 1,
    );
  // Midnight takes the case: the 13 charms wheel round her
  for (let i = 0; i < 34; i++)
    reel.frame(
      bg,
      (p) => {
        caption(p, pal, i < 16 ? 'MIDNIGHT HAS BEEN BLAMED FOR WORSE.' : 'SO SHE TAKES THE CASE.');
        scaleBlit(p, cat, 140, 158 - 80, 2, false, T);
        const shown = Math.min(13, i + 1);
        for (let k = 0; k < shown; k++) {
          const a = (k / 13) * Math.PI * 2 + i * 0.2;
          p.blit(charmSprite(pal, CHARMS[k]), Math.round(160 + Math.cos(a) * 70 - 10), Math.round(112 + Math.sin(a) * 34 - 10), T);
        }
        // a ringed tail slips behind a chimney, up on the roof at the right
        if (i > 20 && i < 30) scaleBlit(p, rascal, 296 + Math.min(0, 24 - i) * 2 + 10, 96, 1, true, T);
      },
      i === 33 ? 8 : 1,
    );
  reel.fadeOut(5);
  return reel;
}

/** The ending cartoon: payback, then the podium. */
export function endingReel(pal: Pal, smug: Pixels, cheer: Pixels, rascal: Pixels): Reel {
  const { c } = pal;
  const reel = new Reel(pal.pal);
  const bg = scene(pal, 160, 24);
  const white = repaint(rascal, pal.r('smoke'), c('paper', 4));
  const first = new Pixels(320, 200);
  first.px.set(bg.px);
  caption(first, pal, 'ONE ROPE. JUST ONE.');
  scaleBlit(first, smug, 60, 158 - 80, 2, false, T);
  reel.fadeIn(first, 5);
  // Midnight pulls; the can over Rascal tips and the paint comes down
  for (let i = 0; i < 24; i++)
    reel.frame(
      bg,
      (p) => {
        caption(p, pal, i < 8 ? 'ONE ROPE. JUST ONE.' : 'RASCAL BUILT A GOOD MACHINE.');
        const pull = Math.min(6, i);
        p.line(92, 40, 92, 96 + pull, c('gold', 3)).line(92, 40, 230, 40, c('gold', 3));
        p.rect(222, 34, 18, 6, c('ink', 0));
        scaleBlit(p, smug, 60, 158 - 80, 2, false, T);
        const tip = Math.min(1, Math.max(0, (i - 6) / 4));
        p.rect(224 + Math.round(tip * 6), 42, 12, 10, c('ink', 1)).rect(226 + Math.round(tip * 6), 43, 8, 3, c('paper', 4));
        if (i > 9) for (let k = 0; k < 6; k++) p.rect(228 + k * 2, 52 + (((i - 10) * 6 + k * 5) % 30), 2, 4, c('paper', 4));
        scaleBlit(p, i > 14 ? white : rascal, 210, 158 - 80, 2, true, T);
      },
      i === 23 ? 6 : 1,
    );
  // the town arrives and points the other way
  for (let i = 0; i < 18; i++)
    reel.frame(
      bg,
      (p) => {
        caption(p, pal, 'THE TOWN REACHES A NEW VERDICT.');
        scaleBlit(p, smug, 60, 158 - 80, 2, false, T);
        scaleBlit(p, white, 210, 158 - 80, 2, true, T);
        folk(p, pal, 120, 0, i > 2, 1, i % 4 < 2 ? 0 : 1);
        folk(p, pal, 160, 2, i > 4, 1, i % 4 < 2 ? 1 : 0);
        folk(p, pal, 300, 1, i > 6, -1, i % 4 < 2 ? 0 : 1);
        if (i > 7) balloon(p, pal, 150, 40, 'THE RACCOON!', 220, 90);
      },
      i === 17 ? 8 : 1,
    );
  // the podium
  const rand = rng(11);
  const confetti = Array.from({ length: 70 }, () => ({
    x: Math.floor(rand() * 320),
    y: Math.floor(rand() * 200),
    v: 3 + Math.floor(rand() * 3),
    col: [c('red', 2), c('gold', 3), c('paper', 4)][Math.floor(rand() * 3)],
  }));
  for (let t = 0; t < 46; t++)
    reel.frame(
      bg,
      (p) => {
        caption(p, pal, 'OFFICIAL GOOD LUCK OF FENNEL HOLLOW');
        p.rect(109, 127, 102, 26, c('paper', 3)).rect(110, 128, 100, 24, c('ink', 1));
        centered(p, 136, '13', c('gold', 3), 2);
        scaleBlit(p, cheer, 140, 128 - 80 + (t % 8 < 4 ? 0 : -3), 2, false, T);
        scaleBlit(p, white, 250, 158 - 80, 2, true, T);
        for (const k of confetti) {
          const y = (k.y + t * k.v) % 200;
          p.rect((k.x + Math.round(Math.sin((t + k.v * 7) / 4) * 4) + 320) % 320, y, 3, 2, k.col);
        }
      },
      1,
    );
  reel.fadeOut(5);
  return reel;
}
