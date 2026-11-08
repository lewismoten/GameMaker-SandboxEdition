// The graduations' own title and menu pictures, set apart from the ordinary Starters' sunny ones (screens.ts):
// a deep academic band in the stage's drape color, a gold double border, a mortarboard over the name, the stage
// set like a certificate heading ("HONORS IN / FIRST STEPS"), a gold seal on ribbons and laurel sprigs. The
// diploma (the grand graduation) adds a third border and stars. Same 320x200 and Starter palette.
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { centered, outlined, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Graduation } from './graduationConfig';
import type { Pal } from './palette';

const W = 320;
const H = 200;

/** The stage's accent ramp name (its hall's drapes). */
export const accentOf = (cfg: Graduation): string => cfg.theme.drape ?? 'purple';
/** The diploma is the grand one. */
export const isGrand = (cfg: Graduation): boolean => cfg.id === 'graduation-diploma';

/** The deep band: the accent's darkest shade in broad stripes, a gold double border (triple for the grand one) and corner studs. */
export function band(pal: Pal, cfg: Graduation): Pixels {
  const p = new Pixels(W, H);
  const a = pal.r(accentOf(cfg));
  p.rect(0, 0, W, H, a[0]);
  for (let x = 0; x < W; x += 16) p.rect(x, 0, 8, H, a[1]);
  const g = pal.r('gold');
  p.frame(2, 2, W - 4, H - 4, g[3])
    .frame(3, 3, W - 6, H - 6, g[4])
    .frame(6, 6, W - 12, H - 12, g[2]);
  if (isGrand(cfg)) p.frame(9, 9, W - 18, H - 18, g[3]);
  for (const [x, y] of [
    [4, 4],
    [W - 5, 4],
    [4, H - 5],
    [W - 5, H - 5],
  ])
    p.disc(x, y, 3, g[4]).disc(x, y, 1, g[1]);
  return p;
}

/** A mortarboard (square cap) about 40 wide with its tassel, centered on cx, top at y. */
export function mortarboard(p: Pixels, pal: Pal, cx: number, y: number): void {
  const k = pal.r('ink');
  const g = pal.r('gold');
  p.rect(cx - 9, y + 10, 18, 7, k[0]).rect(cx - 8, y + 11, 16, 2, k[1]);
  for (let dy = -8; dy <= 8; dy++) {
    const half = Math.round(20 * (1 - Math.abs(dy) / 8));
    p.rect(cx - half, y + 8 + dy, half * 2, 1, dy < 0 ? k[2] : k[1]);
    p.set(cx - half, y + 8 + dy, k[0]).set(cx + half - 1, y + 8 + dy, k[0]);
  }
  p.disc(cx, y + 8, 2, g[4]);
  p.line(cx, y + 8, cx + 16, y + 12, g[4]).line(cx + 16, y + 12, cx + 16, y + 20, g[3]);
  p.rect(cx + 15, y + 18, 3, 5, g[4]);
}

/** A gold seal, radius 11, with two ribbon tails below it, centered at (cx, cy). */
export function seal(p: Pixels, pal: Pal, cx: number, cy: number, accent: string): void {
  const g = pal.r('gold');
  const r = pal.r(accent);
  p.rect(cx - 8, cy + 4, 6, 20, r[2]).rect(cx + 2, cy + 4, 6, 20, r[3]);
  p.rect(cx - 8, cy + 4, 1, 20, r[1]).rect(cx + 7, cy + 4, 1, 20, r[1]);
  p.rect(cx - 5, cy + 20, 3, 4, pal.c('ink', 0)).rect(cx + 2, cy + 20, 3, 4, pal.c('ink', 0));
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    p.disc(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10, 2, g[3]);
  }
  p.disc(cx, cy, 10, g[2]).disc(cx, cy, 8, g[4]).ring(cx, cy, 6, g[2]).disc(cx, cy, 3, g[5]);
  p.set(cx, cy, g[1]);
}

/** A sprig of laurel from (x, y) bending toward `dir` (1 right, -1 left), 8 leaves. */
function sprig(p: Pixels, pal: Pal, x: number, y: number, dir: 1 | -1): void {
  const l = pal.r('green');
  for (let i = 0; i < 8; i++) {
    const px = x + dir * i * 7;
    const py = y - Math.round(Math.sin((i / 7) * 1.4) * 10);
    p.disc(px, py, 1, l[1]);
    p.disc(px + dir, py - 3, 2, l[3]).disc(px + dir * 2, py - 3, 1, l[4]);
    p.disc(px - dir, py + 3, 2, l[2]).disc(px, py + 3, 1, l[3]);
  }
}

/** The gold lettering: bright face, dark outline, soft shadow. */
export function goldLetters(p: Pixels, pal: Pal, y: number, s: string, scale: number): void {
  outlined(p, Math.round((W - textWidth(s, scale)) / 2), y, s, pal.c('gold', 4), pal.c('ink', 0), scale, pal.c('ink', 1));
}

/** The certificate heading's small label: "HONORS IN" (the diploma's "FIRST CLASS HONORS IN"). */
export const labelOf = (cfg: Graduation): string => (isGrand(cfg) ? `${cfg.honors} HONORS IN` : 'HONORS IN');

/** A few gold sparkles (plus signs) scattered in the open band. */
function sparkles(p: Pixels, pal: Pal, seed: number): void {
  const rand = rng(seed);
  for (let i = 0; i < 14; i++) {
    const x = 14 + Math.floor(rand() * (W - 28));
    const y = 104 + Math.floor(rand() * 60);
    const c = pal.c('gold', 3 + (i % 2));
    p.set(x, y, c)
      .set(x - 1, y, c)
      .set(x + 1, y, c)
      .set(x, y - 1, c)
      .set(x, y + 1, c);
  }
}

/** The graduation's title picture. */
export function graduationTitle(pal: Pal, cfg: Graduation, title: string, hero: Pixels, door: Pixels): Pixels {
  const p = band(pal, cfg);
  const a = pal.r(accentOf(cfg));
  sparkles(p, pal, 5);
  mortarboard(p, pal, 160, 9);
  goldLetters(p, pal, 31, title, title.length > 11 ? 2 : 3);
  // the certificate heading
  bevel(p, 12, 56, 296, 42, pal.r('parch'), 3, 2);
  p.frame(16, 60, 288, 34, pal.c('gold', 2));
  centered(p, 63, labelOf(cfg), pal.c('wood', 1), 1);
  const stage = cfg.upper;
  centered(p, 75, stage, pal.c('ink', 0), stage.length * 16 <= 280 ? 2 : 1);
  p.rect(60, 92, 200, 1, pal.c('gold', 2));
  seal(p, pal, 160, 112, accentOf(cfg));
  sprig(p, pal, 144, 128, -1);
  sprig(p, pal, 176, 128, 1);
  if (isGrand(cfg)) for (const x of [96, 224]) centered(p, 106, '*', pal.c('gold', 4), 2, undefined, x);
  // the stage: a runner of the accent color with a gold edge, the graduate and the door
  p.rect(6, 176, W - 12, 18, a[2])
    .rect(6, 176, W - 12, 2, pal.c('gold', 4))
    .rect(6, 178, W - 12, 1, pal.c('gold', 1));
  p.rect(120, 179, 80, 15, a[3]);
  scaleBlit(p, hero, 40, 176 - 80, 2);
  scaleBlit(p, door, 236, 176 - 80, 2);
  text(p, 96, 183, 'SANDBOX SOFTWARE', pal.c('gold', 5));
  return p;
}

/** The menu picture: the name over the band and a board for PLAYGAME's words. */
export function graduationMenu(pal: Pal, cfg: Graduation, title: string, hero: Pixels): Pixels {
  const p = band(pal, cfg);
  goldLetters(p, pal, 14, title, title.length > 11 ? 2 : 3);
  const c = pal.c;
  p.rect(56, 46, 208, 132, c('gold', 1)).rect(58, 48, 204, 128, c('gold', 3));
  p.rect(62, 52, 196, 120, c('parch', 4)).frame(62, 52, 196, 120, c('wood', 2));
  scaleBlit(p, hero, 272, 90, 2);
  return p;
}
