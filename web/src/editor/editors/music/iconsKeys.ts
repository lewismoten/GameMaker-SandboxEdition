// Preset icons for the Keys group and the Classic piano: each is its own instrument (upright,
// grand, tine piano, Wurlitzer-style, clavinet, glass tines, harpsichord). Drawn with iconCanvas.
import { canvas, type Canvas } from './iconCanvas';

/** A strip of keys: white keys with black ones in the 2-3 pattern (or reversed). */
function keyStrip(c: Canvas, x: number, y: number, w: number, h: number, flip = false): Canvas {
  c.fill(x, y, w, h, flip ? 'k' : 'w');
  for (let i = 0; i < w; i += 2) c.fill(x + i, y + 1 + (flip ? 0 : h - 2), 1, h - 1, flip ? 'w' : 'g');
  for (const bx of [1, 3, 6, 8, 10, 13, 15, 17]) if (bx < w - 1) c.fill(x + bx, y, 1, Math.ceil(h * 0.6), flip ? 'w' : 'k');
  return c;
}

export const KEYS_ICONS: Record<string, () => string[]> = {
  'piano-mellow': () => {
    const c = canvas().box(1, 1, 18, 14, 'n');
    c.fill(2, 2, 16, 1, 'o').box(4, 3, 12, 5, 'w').fill(5, 4, 10, 1, 'g').fill(5, 6, 10, 1, 'g');
    keyStrip(c, 2, 9, 16, 4).fill(2, 13, 16, 1, 'k');
    c.box(2, 15, 3, 4, 'n').box(15, 15, 3, 4, 'n').fill(8, 15, 4, 2, 'T').fill(9, 17, 2, 1, 'k');
    return c.rows();
  },
  epiano: () => {
    const c = canvas().box(1, 4, 18, 8, 'g');
    c.fill(2, 5, 16, 2, 'k').fill(3, 5, 4, 1, 'r').fill(8, 5, 2, 1, 'w').fill(12, 5, 5, 1, 'w');
    keyStrip(c, 2, 8, 16, 3).line(3, 12, 2, 18, 'k').line(16, 12, 17, 18, 'k').line(4, 12, 3, 18, 'g').line(15, 12, 16, 18, 'g');
    return c.rows();
  },
  'epiano-round': () => {
    const c = canvas().box(1, 3, 18, 9, 'o');
    c.ell(5, 7, 2, 2, 'g').ell(14, 7, 2, 2, 'g').fill(5, 7, 1, 1, 'k').fill(14, 7, 1, 1, 'k').fill(8, 5, 4, 1, 'T').fill(8, 8, 4, 1, 'T');
    keyStrip(c, 2, 12, 16, 4).fill(2, 16, 16, 1, 'k').box(2, 16, 2, 3, 'n').box(16, 16, 2, 3, 'n');
    return c.rows();
  },
  clavinet: () => {
    const c = canvas().box(0, 4, 20, 6, 'b');
    [
      ['r', 2],
      ['y', 5],
      ['w', 8],
      ['e', 11],
      ['r', 14],
      ['y', 17],
    ].forEach(([ch, x]) => c.fill(x as number, 5, 2, 2, ch as string));
    c.fill(2, 8, 16, 1, 'g');
    keyStrip(c, 1, 10, 18, 6).fill(1, 16, 18, 1, 'k').fill(2, 17, 2, 2, 'k').fill(16, 17, 2, 2, 'k');
    return c.rows();
  },
  'tine-glass': () => {
    const c = canvas();
    [
      [2, 8],
      [5, 5],
      [8, 3],
      [11, 4],
      [14, 6],
      [17, 9],
    ].forEach(([x, top], i) => {
      c.fill(x, top, 1, 9 - top + 1, 'c')
        .fill(x - 1, top - 1, 3, 1, 'k')
        .fill(x, top, 1, 1, 'w');
      if (i % 2) c.px(x + 1, top + 2, 'w');
    });
    c.fill(0, 10, 20, 1, 'g');
    keyStrip(c, 1, 11, 18, 6).fill(1, 17, 18, 1, 'k');
    return c.rows();
  },
  harpsichord: () => {
    const c = canvas().line(2, 7, 7, 1, 'k').line(7, 1, 18, 1, 'k').fill(8, 2, 10, 1, 'o');
    c.fill(3, 7, 15, 1, 'k').line(2, 7, 2, 8, 'k');
    c.box(1, 8, 18, 6, 'n').fill(2, 9, 16, 1, 'T').fill(8, 2, 1, 1, 'k');
    keyStrip(c, 2, 10, 16, 2, true).fill(2, 12, 16, 1, 'o');
    keyStrip(c, 3, 13, 14, 2, true).fill(1, 14, 18, 1, 'n');
    c.line(3, 15, 3, 19, 'n').line(16, 15, 16, 19, 'n').line(3, 18, 4, 19, 'k').line(16, 18, 15, 19, 'k');
    return c.rows();
  },
  grand: () => {
    const c = canvas();
    for (let x = 3; x <= 18; x++) c.fill(x, Math.round(9 - ((x - 3) * 6) / 15), 1, 10 - Math.round(9 - ((x - 3) * 6) / 15), 'k');
    c.line(3, 9, 18, 3, 'g').line(5, 9, 17, 5, 'k');
    c.fill(1, 10, 18, 3, 'k').fill(2, 10, 7, 1, 'w').fill(2, 11, 7, 1, 'g').fill(2, 12, 7, 1, 'k');
    c.fill(2, 13, 2, 6, 'k').fill(10, 13, 2, 5, 'k').fill(16, 13, 2, 6, 'k').fill(9, 17, 1, 2, 'T').fill(8, 18, 3, 1, 'T');
    return c.rows();
  },
};
