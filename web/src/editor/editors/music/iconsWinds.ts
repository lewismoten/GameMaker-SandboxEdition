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
    // a Leslie speaker cabinet: louvred front, a spinning horn behind it, and a wobbling hum
    const c = canvas().box(4, 1, 12, 18, 'n').fill(5, 2, 10, 1, 'o').ell(9.5, 8, 4, 4, 'k').fill(6, 8, 8, 1, 'T').fill(9, 5, 2, 7, 'g');
    c.fill(5, 14, 10, 1, 'k').fill(5, 16, 10, 1, 'k').fill(5, 15, 10, 1, 'o').fill(5, 17, 10, 1, 'o');
    for (let y = 3; y <= 13; y++) {
      c.px(1 + Math.round(1.2 * Math.sin(y * 1.1)), y, 'p').px(18 - Math.round(1.2 * Math.sin(y * 1.1)), y, 'p');
    }
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
    // a slide trombone: two long slide tubes, a U-bend and brace, and a flared bell below
    const c = canvas();
    for (const y of [1, 5]) c.fill(3, y, 17, 3, 'k').fill(4, y + 1, 15, 1, 'T');
    c.fill(2, 1, 3, 7, 'k').fill(3, 2, 1, 5, 'T').fill(17, 1, 3, 15, 'k').fill(18, 2, 1, 13, 'T');
    c.fill(6, 13, 12, 3, 'k').fill(6, 14, 12, 1, 'T');
    for (let x = 0; x < 7; x++) {
      const half = 1 + (6 - x) * 0.8;
      const top = Math.round(14 - half),
        bot = Math.round(14 + half);
      c.fill(x, top, 1, bot - top + 1, 'k').fill(x, top + 1, 1, Math.max(0, bot - top - 1), x < 2 ? 'w' : 'T');
    }
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
    // a euphonium: wide upturned bell, coiled body, valves, and a crescendo wedge
    const c = canvas();
    for (let y = 0; y <= 5; y++) {
      const half = 3 + y * 0.5;
      c.fill(Math.round(13.5 - half), y, Math.round(half * 2), 1, 'k');
      c.fill(Math.round(14.5 - half), y, Math.round(half * 2) - 2, 1, y < 1 ? 'g' : 'T');
    }
    c.fill(4, 3, 4, 2, 'k').fill(2, 2, 3, 1, 'g').ell(8.5, 9.5, 6, 3.5, 'T').ell(8.5, 9.5, 3, 1.5, '.');
    c.fill(11, 5, 6, 4, 'T').fill(10, 5, 1, 4, 'k').fill(17, 5, 1, 4, 'k');
    for (const x of [5, 7, 9]) c.fill(x, 6, 1, 2, 'g');
    c.line(1, 17, 18, 14, 'r').line(1, 17, 18, 19, 'r').line(18, 14, 18, 19, 'r');
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
    // a clarinet: mouthpiece with its reed, key-dotted body, flared bell, and a crescendo wedge
    const c = canvas().box(3, 4, 12, 5, 'k').fill(4, 5, 10, 1, 'n').fill(4, 6, 10, 2, 'k');
    for (const x of [6, 9, 12]) c.fill(x, 5, 1, 1, 'g').fill(x, 7, 1, 1, 'g');
    c.fill(0, 5, 4, 3, 'k').fill(1, 6, 3, 1, 'y').fill(0, 7, 1, 1, '.');
    c.fill(15, 2, 2, 9, 'k').fill(16, 3, 1, 7, 'g').fill(17, 1, 3, 11, 'k').fill(18, 2, 1, 9, 'g').fill(17, 5, 1, 3, 'k');
    c.line(1, 17, 18, 14, 'r').line(1, 17, 18, 19, 'r').line(18, 14, 18, 19, 'r');
    return c.rows();
  },
};
