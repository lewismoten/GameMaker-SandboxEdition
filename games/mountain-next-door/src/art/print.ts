// The game's printed lettering and frame, for the title, the level cards and the story pages: letters cut by hand
// from a block (the PC font scaled up, its edges nicked and swelled a pixel here and there, gouged across, outlined
// in heavy ink and printed over a second color a little out of register), a torn paper strip, and a poster's
// border (ink, a paper rule, ink).
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import type { Pal } from '../../../kit/starter/palette';

const IN = 1;

/** A letter mask, hand-cut: some edge pixels nicked away, some swelled out, by a seeded hand. */
function cutMask(s: string, scale: number, seed: number): Pixels {
  const w = textWidth(s, scale) + 8;
  const h = 8 * scale + 8;
  const m = new Pixels(w, h, 0);
  text(m, 4, 4, s, IN, scale, true);
  if (scale < 2) return m;
  const rand = rng(seed);
  const out = m.crop(0, 0, w, h);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : m.get(x, y));
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const near = at(x - 1, y) + at(x + 1, y) + at(x, y - 1) + at(x, y + 1);
      if (m.get(x, y) === IN && near < 4 && near > 1 && rand() < 0.12) out.set(x, y, 0);
      else if (m.get(x, y) === 0 && near >= 1 && rand() < 0.07) out.set(x, y, IN);
    }
  return out;
}

/**
 * Hand-cut letters centered on `cx` with their top at `y`: `fill` cut with a pale gouge across every fourth row,
 * `ink` round them two pixels thick, and `second` printed two pixels down and right behind. Returns the height used.
 */
export function carved(p: Pixels, pal: Pal, cx: number, y: number, s: string, scale: number, fill: number, second: number, seed = 1): number {
  const m = cutMask(s, scale, seed);
  const x0 = Math.round(cx - m.w / 2);
  const y0 = y - 4;
  const ink = pal.c('ink', 0);
  const pale = pal.c('parch', 4);
  const hit = (x: number, y2: number) => x >= 0 && y2 >= 0 && x < m.w && y2 < m.h && m.get(x, y2) === IN;
  const put = (x: number, y2: number, c: number) => {
    if (x >= 0 && y2 >= 0 && x < p.w && y2 < p.h) p.set(x, y2, c);
  };
  const thick = scale >= 2 ? 2 : 1;
  for (let yy = -thick; yy < m.h + thick + 2; yy++)
    for (let xx = -thick; xx < m.w + thick + 2; xx++) {
      if (hit(xx - 2, yy - 2) && !hit(xx, yy)) put(x0 + xx, y0 + yy, second);
    }
  for (let yy = -thick; yy < m.h + thick; yy++)
    for (let xx = -thick; xx < m.w + thick; xx++) {
      if (hit(xx, yy)) continue;
      let edge = false;
      for (let dy = -thick; dy <= thick && !edge; dy++) for (let dx = -thick; dx <= thick && !edge; dx++) if (hit(xx + dx, yy + dy)) edge = true;
      if (edge) put(x0 + xx, y0 + yy, ink);
    }
  for (let yy = 0; yy < m.h; yy++)
    for (let xx = 0; xx < m.w; xx++) {
      if (!hit(xx, yy)) continue;
      const gouge = scale >= 2 && (yy - 4) % 4 === 1 && hit(xx - 1, yy) && hit(xx + 1, yy) && (xx + seed) % 7 !== 0;
      put(x0 + xx, y0 + yy, gouge ? pale : fill);
    }
  return 8 * scale + thick * 2;
}

/** A strip of torn paper from x0 to x1, rows y0 .. y1, its long edges ragged, inked. */
export function tornStrip(p: Pixels, pal: Pal, x0: number, y0: number, x1: number, y1: number, seed = 3): void {
  const rand = rng(seed);
  const paper = pal.c('parch', 4);
  const shade = pal.c('parch', 2);
  const ink = pal.c('ink', 0);
  for (let x = x0; x <= x1; x++) {
    const top = y0 + Math.floor(rand() * 3);
    const bottom = y1 - Math.floor(rand() * 3);
    for (let y = top; y <= bottom; y++) p.set(x, y, y >= bottom - 1 ? shade : paper);
    p.set(x, top - 1, ink).set(x, bottom + 1, ink);
  }
  for (let y = y0; y <= y1; y++) p.set(x0 - 1, y, ink).set(x1 + 1, y, ink);
}

/** A poster's border round the whole picture: four pixels of ink, a two-pixel paper rule, one of ink. */
export function printFrame(p: Pixels, pal: Pal): void {
  const ink = pal.c('ink', 0);
  const paper = pal.c('parch', 4);
  const band = (d: number, w: number, c: number) => {
    p.rect(d, d, p.w - 2 * d, w, c)
      .rect(d, p.h - d - w, p.w - 2 * d, w, c)
      .rect(d, d, w, p.h - 2 * d, c)
      .rect(p.w - d - w, d, w, p.h - 2 * d, c);
  };
  band(0, 4, ink);
  band(4, 2, paper);
  band(6, 1, ink);
}
