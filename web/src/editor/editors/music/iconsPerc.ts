// Preset icons for the Mallets, Percussion and Drum kit groups: each bar instrument, bell and
// drum piece is its own picture (a glockenspiel is not a xylophone is not a celesta; a boomy
// kick is not a punchy one; every hi-hat is on its own stand or top view). Drawn with iconCanvas.
import { canvas, type Canvas } from './iconCanvas';

/** A pair of mallets with the given head color, resting upper right. */
function mallets(c: Canvas, head: string, x = 12, y = 0): Canvas {
  return c
    .line(x, y + 5, x + 6, y + 1, 'n')
    .line(x + 1, y + 5, x + 7, y + 1, 'n')
    .ell(x - 0.5, y + 5.5, 1.5, 1.5, head)
    .ell(x + 7.5, y + 0.5, 1.5, 1.5, head);
}

export const PERC_ICONS: Record<string, () => string[]> = {
  glockenspiel: () => {
    const c = canvas().box(1, 6, 18, 12, 'n').fill(2, 7, 16, 10, 'o');
    for (let i = 0; i < 8; i++)
      c.fill(2 + i * 2, 9 + Math.floor(i / 2), 2, 8 - Math.floor(i / 2), i % 2 ? 'g' : 'w')
        .fill(2 + i * 2, 9 + Math.floor(i / 2), 1, 8 - Math.floor(i / 2), 'w')
        .fill(3 + i * 2, 9 + Math.floor(i / 2), 1, 8 - Math.floor(i / 2), 'g');
    c.fill(2, 10, 16, 0, 'k');
    return mallets(c, 'r', 4, 0).rows();
  },
  celesta: () => {
    const c = canvas().box(1, 3, 18, 9, 'n').fill(2, 4, 16, 3, 'c');
    for (let x = 3; x < 17; x += 2) c.fill(x, 4, 1, 3, 'w').fill(x + 1, 4, 1, 3, 'b');
    c.fill(2, 8, 16, 3, 'k').box(2, 12, 16, 4, 'w');
    for (const x of [5, 7, 10, 12, 14]) c.fill(x, 13, 1, 2, 'k');
    c.fill(3, 16, 2, 3, 'n').fill(15, 16, 2, 3, 'n').px(9, 9, 'y').px(10, 9, 'y');
    return c.rows();
  },
  xylophone: () => {
    const c = canvas().fill(1, 15, 18, 1, 'n').fill(1, 8, 18, 1, 'n').line(2, 16, 1, 19, 'n').line(17, 16, 18, 19, 'n');
    for (let i = 0; i < 8; i++) {
      const top = 5 + Math.floor(i / 2),
        h = 11 - Math.floor(i / 2);
      c.fill(2 + i * 2, top, 2, h, i % 2 ? 'y' : 'T')
        .fill(2 + i * 2, top, 1, h, 'k')
        .fill(2 + i * 2, top - 1, 2, 1, 'k')
        .fill(2 + i * 2, top + h, 2, 1, 'k');
    }
    return mallets(c, 'w', 2, 0).rows();
  },
  chimes: () => {
    // five hanging tubes, shortest to longest, from a wooden bar
    const c = canvas().box(0, 0, 20, 3, 'n').fill(1, 1, 18, 1, 'o');
    [6, 8, 11, 14, 16].forEach((len, i) => {
      const x = 1 + i * 4;
      c.px(x + 1, 3, 'k')
        .box(x, 4, 3, len, 'g')
        .fill(x + 1, 5, 1, len - 2, 'w');
    });
    return c.rows();
  },
  'vibes-wobbly': () => {
    const c = canvas();
    for (let i = 0; i < 6; i++)
      c.box(2 + i * 3, 6 + Math.floor(i / 2), 3, 8 - Math.floor(i / 2), 'c').fill(3 + i * 3, 7 + Math.floor(i / 2), 1, 6 - Math.floor(i / 2), 'w');
    for (let x = 1; x < 19; x++) c.px(x, 16 + Math.round(1.5 * Math.sin(x * 0.8)), 'p').px(x, 17 + Math.round(1.5 * Math.sin(x * 0.8)), 'p');
    c.ell(4, 2, 2, 1.5, 'g').ell(15, 2, 2, 1.5, 'g').fill(4, 2, 12, 0, 'g');
    return c.rows();
  },
  'steel-clank': () => {
    const c = canvas()
      .fill(2, 5, 15, 3, 'k')
      .fill(3, 6, 13, 1, 'g')
      .fill(16, 6, 3, 1, 'k')
      .fill(5, 8, 8, 2, 'k')
      .fill(7, 10, 4, 5, 'k')
      .fill(5, 15, 9, 3, 'k')
      .fill(6, 16, 7, 1, 'g')
      .fill(3, 5, 12, 1, 'g');
    c.line(1, 1, 3, 3, 'y').line(7, 0, 8, 3, 'y').line(12, 0, 11, 3, 'y').line(18, 1, 16, 3, 'y').px(10, 1, 'w').px(4, 1, 'w');
    return c.rows();
  },
  'sparkle-bell': () => {
    const c = canvas()
      .ell(10, 11, 6, 6, 'g')
      .fill(3, 14, 15, 3, 'g')
      .fill(3, 17, 15, 1, 'k')
      .fill(2, 16, 17, 1, 'k')
      .ell(10, 18.5, 1, 1, 'k')
      .fill(10, 2, 1, 2, 'k');
    c.fill(7, 7, 2, 5, 'w').px(7, 6, 'w');
    c.spr(15, 1, ['..y..', '..y..', 'yywyy', '..y..', '..y..']).spr(1, 4, ['.y.', 'yyy', '.y.']).spr(16, 9, ['.y.', 'yyy', '.y.']);
    return c.rows();
  },
  'melodic-kick': () => {
    // the bass drum seen from the side with its foot pedal and beater
    const c = canvas().box(4, 3, 9, 13, 'r').fill(4, 3, 1, 13, 'g').fill(12, 3, 1, 13, 'g').fill(6, 5, 4, 0, 'k').fill(6, 4, 1, 11, 'w');
    c.fill(2, 16, 15, 2, 'g').fill(2, 17, 15, 1, 'k').fill(13, 7, 3, 1, 'k').ell(17, 7.5, 1.5, 1.5, 'w').fill(15, 8, 1, 8, 'k').fill(16, 14, 2, 3, 'k');
    c.fill(0, 18, 3, 1, 'k').fill(14, 18, 4, 1, 'k');
    return c.rows();
  },
  'melodic-snare': () => {
    // a snare on its stand
    const c = canvas().box(3, 5, 14, 6, 'w').fill(3, 5, 14, 1, 'g').fill(3, 10, 14, 1, 'g');
    for (let x = 5; x < 16; x += 3) c.fill(x, 6, 1, 4, 'g');
    c.fill(9, 11, 2, 5, 'k').line(10, 16, 3, 19, 'k').line(10, 16, 17, 19, 'k').line(10, 16, 10, 19, 'k');
    c.line(1, 1, 8, 4, 'n').line(18, 1, 11, 4, 'n').px(1, 1, 'w').px(18, 1, 'w');
    return c.rows();
  },
  'melodic-hat': () => {
    // a hi-hat from above: the cymbal, its bell and rivets, a stick tapping it
    const c = canvas().ell(9.5, 10.5, 8, 8, 'T').ell(9.5, 10.5, 5.5, 5.5, 'y', 'o').ell(9.5, 10.5, 2, 2, 'T', 'o');
    for (const [x, y] of [
      [4, 5],
      [14, 5],
      [4, 16],
      [15, 16],
    ])
      c.px(x, y, 'o');
    c.line(18, 1, 11, 8, 'n').line(19, 2, 12, 9, 'n').px(18, 0, 'w');
    return c.rows();
  },
  'kick-boomy': () => {
    const c = canvas().ell(8.5, 10, 7, 8, 'b').ell(8.5, 10, 5, 6, 'k').ell(8.5, 10, 1.5, 1.5, 'g');
    for (const r of [0, 1, 2])
      c.line(16 + r, 5 + r, 16 + r + 1, 8 + r, 'c')
        .line(16 + r + 1, 8 + r, 16 + r + 1, 12 - r, 'c')
        .line(16 + r + 1, 12 - r, 16 + r, 15 - r, 'c');
    return c.rows();
  },
  'snare-fat': () => {
    const c = canvas().box(3, 6, 14, 11, 'n').ell(10, 6.5, 7, 3, 'w', 'k');
    for (const x of [5, 8, 11, 14]) c.fill(x, 9, 1, 7, 'T').px(x, 8, 'g');
    c.fill(3, 16, 14, 1, 'g').fill(4, 17, 12, 1, 'k').line(2, 1, 8, 5, 'o').line(17, 1, 11, 5, 'o').px(2, 0, 'w').px(17, 0, 'w');
    return c.rows();
  },
  clap: () => {
    // two forearms bringing their palms together, with the clap burst above
    const c = canvas();
    const arm = (x0: number, y0: number, x1: number, y1: number) => {
      for (const d of [-2, -1, 0, 1, 2]) c.line(x0, y0 + d, x1, y1 + d, 'k');
      for (const d of [-1, 0, 1]) c.line(x0, y0 + d, x1, y1 + d, 'y');
    };
    arm(0, 19, 7, 11);
    arm(19, 19, 12, 11);
    c.ell(7.5, 10, 2.5, 3, 'y').ell(12, 10, 2.5, 3, 'y').fill(9, 8, 2, 5, 'y');
    c.line(10, 5, 10, 1, 'r').line(7, 5, 4, 2, 'r').line(13, 5, 16, 2, 'r').line(4, 8, 1, 8, 'r').line(15, 8, 18, 8, 'r');
    return c.rows();
  },
  rimshot: () => {
    // a stick striking the rim of a red snare, a spark at the hit
    const c = canvas().box(2, 11, 15, 7, 'r').fill(2, 10, 15, 1, 'w').fill(2, 11, 15, 1, 'g').fill(2, 17, 15, 1, 'g');
    for (const x of [5, 8, 11, 14]) c.px(x, 14, 'w');
    c.line(0, 1, 14, 9, 'n').line(0, 2, 14, 10, 'n').ell(1, 1.5, 1, 1, 'w');
    c.line(16, 7, 19, 4, 'y').line(17, 9, 19, 9, 'y').line(14, 6, 15, 3, 'y').px(16, 8, 'w');
    return c.rows();
  },
  'tom-low': () => {
    const c = canvas().ell(10, 6.5, 8, 3, 'w').box(2, 6, 17, 9, 'b').ell(10, 6.5, 7, 2.5, 'w').fill(2, 6, 1, 1, 'k');
    c.fill(4, 7, 1, 7, 'c').fill(15, 7, 1, 7, 'c').line(4, 15, 3, 19, 'g').line(10, 15, 10, 19, 'g').line(16, 15, 17, 19, 'g');
    return c.rows();
  },
  'tom-high': () => {
    // a small cyan tom up on its stand
    const c = canvas().box(5, 3, 10, 8, 'c').ell(10, 3.5, 5, 1.5, 'w').fill(7, 5, 1, 5, 'w').fill(12, 5, 1, 5, 'w');
    c.fill(9, 11, 2, 4, 'g').line(10, 15, 3, 19, 'g').line(10, 15, 17, 19, 'g').line(10, 15, 10, 19, 'g').line(1, 9, 5, 9, 'k').fill(1, 8, 1, 3, 'k');
    return c.rows();
  },
  'timpani-tom': () => {
    const c = canvas().box(4, 3, 12, 11, 'p').ell(10, 3.5, 6, 2, 'w').fill(5, 5, 1, 8, 'w').fill(14, 5, 1, 8, 'w').fill(8, 14, 4, 2, 'g');
    c.fill(10, 16, 1, 2, 'k').fill(5, 18, 11, 1, 'g').fill(3, 19, 14, 1, 'k').fill(14, 17, 4, 1, 'k').px(17, 16, 'k');
    return c.rows();
  },
  ride: () => {
    const c = canvas()
      .fill(9, 10, 2, 8, 'g')
      .line(9, 18, 4, 19, 'g')
      .line(10, 18, 16, 19, 'g')
      .ell(10, 8, 9, 2, 'T')
      .ell(10, 6, 3, 2, 'y', 'o')
      .fill(2, 8, 16, 0, 'o');
    c.fill(3, 9, 14, 1, 'o').line(2, 1, 9, 4, 'n').px(2, 1, 'w');
    return c.rows();
  },
  'hat-open': () => {
    const c = canvas().fill(9, 9, 2, 10, 'g').line(9, 18, 4, 19, 'g').line(10, 18, 16, 19, 'g');
    c.ell(10, 4, 8, 1.5, 'T').fill(2, 4, 16, 0, 'o').ell(10, 11, 8, 1.5, 'T').fill(9, 6, 2, 3, 'g');
    c.px(1, 7, 'w').px(0, 8, 'w').px(18, 7, 'w').px(19, 8, 'w').px(5, 8, 'w').px(14, 8, 'w');
    return c.rows();
  },
  'hat-pedal': () => {
    const c = canvas().ell(10, 2.5, 8, 1.5, 'T').ell(10, 5, 8, 1.5, 'T').fill(9, 7, 2, 7, 'g');
    c.fill(4, 15, 13, 2, 'k').fill(5, 15, 11, 1, 'g').fill(14, 11, 4, 4, 'k').fill(13, 14, 2, 2, 'k').fill(14, 12, 3, 1, 'w').line(10, 14, 10, 15, 'g');
    c.fill(2, 17, 16, 2, 'k').fill(3, 17, 14, 1, 'g');
    return c.rows();
  },
  'steel-drum': () => {
    // a steel pan from above: the bowl with its oval note fields
    const c = canvas().ell(9.5, 9.5, 9, 9, 'g');
    c.ell(9.5, 9.5, 7, 7, 'b');
    c.ell(9.5, 9.5, 1.5, 1.5, 'w', 'w');
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + 0.5;
      c.ell(9.5 + 4.8 * Math.cos(a), 9.5 + 4.8 * Math.sin(a), 1.5, 1.5, 'w', 'w');
    }
    return c.rows();
  },
};
