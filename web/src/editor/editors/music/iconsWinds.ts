// Preset icons for the Organ, Brass and Woodwinds groups, plus the Classic organ and brass:
// consoles, pipes and a kazoo; trombone, tuba and bugle; an oboe and the two reeds. Drawn with
// iconCanvas; the pipe organ, accordion, harmonica, trumpet, horn, flute, clarinet, sax and pan
// flute keep their drawings in presetIcons.ts.
import { canvas } from './iconCanvas';

export const WINDS_ICONS: Record<string, () => string[]> = {
  tonewheel: () => {
    const c = canvas().box(1, 1, 18, 8, 'n').fill(2, 2, 16, 1, 'o');
    for (let x = 3, i = 0; x <= 16; x += 2, i++) c.fill(x, 3, 1, 5, 'w').fill(x, 7, 1, 1, ['r', 'k', 'w', 'b'][i % 4]);
    c.box(1, 10, 18, 4, 'w').box(1, 14, 18, 4, 'w');
    for (const y of [11, 15]) for (const x of [4, 6, 9, 11, 13, 16]) c.fill(x, y, 1, 2, 'k');
    c.fill(3, 18, 3, 2, 'k').fill(14, 18, 3, 2, 'k');
    return c.rows();
  },
  'combo-organ': () => {
    const c = canvas().box(1, 4, 18, 6, 'b').fill(2, 5, 16, 1, 'c');
    [
      ['r', 3],
      ['w', 5],
      ['y', 7],
      ['r', 9],
      ['w', 11],
      ['y', 13],
      ['r', 15],
    ].forEach(([ch, x]) => c.fill(x as number, 7, 1, 2, ch as string));
    c.box(1, 10, 18, 4, 'w');
    for (const x of [4, 6, 9, 11, 13, 16]) c.fill(x, 11, 1, 2, 'k');
    c.line(4, 14, 15, 19, 'g').line(15, 14, 4, 19, 'g').line(5, 14, 16, 19, 'g').line(14, 14, 3, 19, 'g');
    return c.rows();
  },
  kazoo: () => {
    const c = canvas().ell(7, 11, 6, 3, 'r');
    for (let x = 8; x < 19; x++) {
      const h = 3 + Math.floor((x - 8) * 0.45);
      c.fill(x, 11 - h, 1, h * 2, 'k').fill(x, 12 - h, 1, h * 2 - 2, 'r');
    }
    c.fill(18, 5, 1, 12, 'k').fill(17, 6, 1, 10, 'k').fill(12, 8, 1, 7, 'r').fill(6, 5, 5, 3, 'g').fill(7, 6, 3, 1, 'w').fill(8, 5, 1, 1, 'k');
    c.fill(2, 10, 1, 2, 'w').px(0, 9, 'c').px(0, 13, 'c');
    return c.rows();
  },
  'organ-wobble': () => {
    const c = canvas().box(2, 1, 7, 13, 'T').fill(3, 2, 5, 2, 'T').fill(3, 3, 5, 1, 'k').box(11, 4, 7, 10, 'T').fill(12, 6, 5, 1, 'k');
    c.fill(5, 5, 1, 7, 'o').fill(14, 8, 1, 4, 'o');
    for (let x = 1; x < 19; x++) c.px(x, 16 + Math.round(1.5 * Math.sin(x * 0.9)), 'p').px(x, 17 + Math.round(1.5 * Math.sin(x * 0.9)), 'p');
    return c.rows();
  },
  organ: () => {
    const c = canvas().box(2, 2, 16, 9, 'n').fill(3, 3, 14, 1, 'o');
    [4, 7, 10, 13].forEach((x) => c.ell(x + 1, 6, 1.5, 1.5, 'w').px(x + 1, 6, 'k'));
    c.box(2, 11, 16, 4, 'w');
    for (const x of [5, 7, 10, 12, 14]) c.fill(x, 12, 1, 2, 'k');
    c.fill(4, 15, 2, 3, 'n').fill(14, 15, 2, 3, 'n').box(6, 17, 3, 3, 'r').box(11, 17, 3, 3, 'r');
    return c.rows();
  },
  'synth-brass': () => {
    // a trumpet in synth purple with a square wave running under it
    const c = canvas().box(1, 4, 11, 4, 'p').fill(2, 5, 9, 1, 'c').fill(11, 3, 1, 6, 'k');
    for (let x = 12; x <= 18; x++)
      c.fill(x, 5 - Math.floor((x - 11) / 2), 1, 2 + Math.floor((x - 11) / 2) * 2, 'p')
        .px(x, 5 - Math.floor((x - 11) / 2), 'k')
        .px(x, 6 + Math.floor((x - 11) / 2), 'k');
    for (const x of [4, 6, 8]) c.fill(x, 1, 1, 3, 'c').fill(x - 1, 0, 3, 1, 'k');
    c.line(1, 15, 5, 15, 'c')
      .line(5, 11, 5, 15, 'c')
      .line(5, 11, 10, 11, 'c')
      .line(10, 11, 10, 15, 'c')
      .line(10, 15, 14, 15, 'c')
      .line(14, 11, 14, 15, 'c')
      .line(14, 11, 18, 11, 'c');
    return c.fill(1, 17, 18, 1, 'b').rows();
  },
  trombone: () => {
    const c = canvas().fill(1, 4, 15, 11, 'k').fill(2, 5, 13, 2, 'T').fill(2, 12, 13, 2, 'T').fill(2, 5, 2, 9, 'T').fill(5, 8, 12, 3, '.');
    c.fill(5, 7, 10, 1, 'k').fill(5, 11, 10, 1, 'k');
    c.fill(13, 2, 1, 15, 'g').fill(13, 8, 1, 3, '.');
    for (let i = 0; i < 6; i++) c.fill(15 + Math.floor(i / 2), 4 - i + 0, 1, 1, 'k').fill(15 + Math.floor(i / 2), 14 + i, 1, 1, 'k');
    c.fill(16, 5, 3, 9, 'T').fill(18, 1, 1, 17, 'k').fill(17, 2, 1, 15, 'T');
    return c.rows();
  },
  tuba: () => {
    const c = canvas();
    for (let y = 1; y <= 8; y++) {
      const half = 8 - Math.floor((y - 1) * 0.55);
      c.fill(10 - half, y, half * 2, 1, 'T')
        .px(10 - half, y, 'k')
        .px(9 + half, y, 'k');
    }
    c.fill(2, 1, 16, 1, 'k').fill(4, 8, 12, 1, 'k').fill(7, 9, 6, 2, 'T').px(7, 9, 'k').px(12, 9, 'k');
    c.ell(10, 14.5, 7, 4.5, 'T').ell(10, 14.5, 3.5, 2, '.').fill(16, 5, 2, 5, 'w').fill(16, 5, 2, 1, 'k').px(1, 15, 'k').fill(0, 13, 3, 3, 'g');
    return c.rows();
  },
  'brass-swell': () => {
    const c = canvas();
    for (let x = 1; x <= 14; x++) {
      const h = 1 + Math.round((x - 1) * 0.45);
      c.fill(x, 8 - h, 1, h * 2 + 1, 'k').fill(x, 9 - h, 1, h * 2 - 1, 'T');
    }
    c.fill(14, 1, 2, 15, 'k').fill(14, 2, 1, 13, 'T').fill(1, 8, 4, 2, 'k').fill(2, 8, 3, 1, 'g');
    c.line(3, 18, 18, 15, 'r').line(3, 18, 18, 19, 'r').line(18, 15, 18, 19, 'r');
    return c.rows();
  },
  brass: () => {
    const c = canvas().ell(8, 12, 6, 5, 'T').ell(8, 12, 3, 2.5, '.');
    c.fill(0, 3, 1, 0, 'k');
    for (let x = 8; x <= 16; x++) {
      const h = 1 + Math.round((x - 8) * 0.55);
      c.fill(x, 5 - h, 1, h * 2, 'k').fill(x, 6 - h, 1, h * 2 - 2, 'T');
    }
    c.fill(16, 0, 2, 11, 'k').fill(16, 1, 1, 9, 'T').fill(1, 4, 8, 2, 'k').fill(1, 5, 7, 1, 'T').fill(0, 3, 2, 4, 'g').fill(8, 6, 1, 1, 'k');
    c.fill(6, 14, 1, 3, 'r').fill(10, 15, 1, 3, 'r');
    return c.rows();
  },
  oboe: () => {
    const c = canvas();
    c.line(4, 15, 15, 4, 'k').line(5, 15, 16, 4, 'k').line(5, 14, 15, 5, 'n').line(4, 14, 14, 4, 'k');
    c.fill(15, 0, 1, 1, 'T').line(15, 4, 17, 1, 'T').line(16, 4, 18, 1, 'o').px(17, 0, 'k');
    [
      [7, 12],
      [9, 10],
      [11, 8],
      [13, 6],
    ].forEach(([x, y]) => c.ell(x, y, 1, 1, 'g'));
    c.fill(1, 15, 5, 5, 'k').fill(2, 16, 3, 3, 'k').line(1, 19, 5, 19, 'k').line(1, 16, 4, 19, 'g');
    c.ell(3, 17, 2, 2, 'k').px(2, 16, 'g');
    return c.rows();
  },
  'reed-soft': () => {
    const c = canvas().fill(8, 11, 4, 8, 'g').fill(8, 11, 1, 8, 'k').fill(11, 11, 1, 8, 'k').fill(8, 18, 4, 1, 'k');
    c.fill(8, 13, 4, 3, 'r').fill(8, 14, 4, 1, 'k');
    for (let y = 1; y < 11; y++) {
      const half = 1 + Math.floor((11 - y) * 0.4);
      c.px(10 - half, y, 'k')
        .px(9 + half, y, 'k')
        .fill(10 - half + 1, y, half * 2 - 1, 1, 'y');
    }
    c.fill(7, 0, 6, 1, 'k').fill(9, 1, 2, 4, 'k').px(1, 4, 'w').px(2, 3, 'w').px(3, 4, 'w').px(17, 8, 'w').px(16, 7, 'w').px(18, 7, 'w');
    return c.rows();
  },
  'reed-swell': () => {
    // a clarinet mouthpiece with its reed and ligature, and a crescendo wedge
    const c = canvas();
    for (const d of [-2, -1, 0, 1, 2]) c.line(2, 13 + d, 12, 3 + d, d === 0 ? 'k' : 'k');
    for (const d of [-1, 0, 1]) c.line(3, 13 + d, 12, 4 + d, 'k');
    c.line(5, 9, 11, 3, 'o').line(6, 9, 12, 3, 'T').line(4, 11, 2, 13, 'o');
    c.line(7, 10, 9, 8, 'g').line(8, 11, 10, 9, 'g').line(7, 9, 9, 7, 'g');
    c.line(3, 17, 18, 15, 'r').line(3, 17, 18, 19, 'r').line(18, 15, 18, 19, 'r');
    return c.rows();
  },
};
