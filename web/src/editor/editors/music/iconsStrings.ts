// Preset icons for the Strings and Voices groups, plus the Classic bass and pluck: the string
// section's own instruments (cello, upright bass, nylon guitar, lyre, a plucked string), the
// singers' faces and the distant choir. Drawn with iconCanvas.
import { canvas } from './iconCanvas';


export const STRINGS_ICONS: Record<string, () => string[]> = {
  orchestra: () => {
    // a cello with its bow lying across the strings
    const c = canvas().line(9, 1, 9, 9, 'k').fill(8, 2, 3, 7, 'n').fill(9, 2, 1, 7, 'k').ell(9, 1, 1, 1, 'n');
    c.ell(9, 8.5, 3, 2.5, 'r').ell(9, 14, 5, 4, 'r').fill(7, 11, 1, 3, 'k').fill(11, 11, 1, 3, 'k').fill(8, 15, 3, 1, 'n');
    c.fill(9, 18, 1, 2, 'g').line(1, 12, 18, 11, 'n').fill(1, 12, 3, 1, 'T').px(18, 11, 'k');
    return c.rows();
  },
  pizzicato: () => {
    // a violin with one string pulled by a fingertip, ripples either side
    const c = canvas().fill(9, 1, 2, 8, 'n').ell(10, 3, 1, 1, 'n').ell(10, 8, 3, 2.5, 'o').ell(10, 14, 4, 4, 'o');
    c.fill(8, 11, 1, 3, 'k').fill(12, 11, 1, 3, 'k').fill(8, 17, 5, 1, 'n').fill(9, 16, 3, 1, 'k');
    c.line(10, 5, 10, 10, 'k').line(10, 10, 16, 8, 'w').line(16, 8, 10, 6, 'w').spr(15, 5, ['.yy.', 'yyyy', 'yyyy', '.yy.']);
    c.px(4, 6, 'g').px(3, 7, 'g').px(4, 8, 'g').px(3, 11, 'g').px(4, 12, 'g');
    return c.rows();
  },
  'upright-bass': () => {
    const c = canvas().fill(9, 0, 2, 9, 'k').fill(10, 1, 1, 8, 'n').fill(8, 0, 2, 2, 'n');
    c.ell(10, 8, 3, 2.5, 'n').ell(10, 14, 5, 4.5, 'n').fill(9, 8, 3, 1, 'o').fill(7, 11, 1, 4, 'k').fill(13, 11, 1, 4, 'k').fill(10, 9, 1, 8, 'g');
    c.fill(8, 16, 5, 1, 'T').fill(10, 18, 1, 2, 'k').fill(8, 5, 5, 1, 'o');
    return c.rows();
  },
  strings: () => {
    // a violin lying on its side with its bow below
    const c = canvas().ell(4.5, 8, 4, 4, 'o').ell(10, 8, 3, 3, 'o').fill(12, 7, 6, 3, 'n').fill(12, 7, 6, 1, 'k').fill(12, 9, 6, 1, 'k').ell(18, 8, 1, 1, 'n');
    c.fill(2, 8, 11, 1, 'g').fill(5, 5, 1, 7, 'k').fill(0, 8, 2, 1, 'k').px(3, 6, 'k').px(3, 10, 'k').px(8, 6, 'k').px(8, 10, 'k');
    c.line(1, 16, 18, 13, 'n').line(1, 17, 18, 14, 'w').px(18, 13, 'k').fill(1, 16, 3, 1, 'T');
    return c.rows();
  },
  'guitar-nylon': () => {
    const c = canvas().box(8, 0, 5, 4, 'n').fill(7, 1, 1, 2, 'g').fill(13, 1, 1, 2, 'g').fill(9, 4, 3, 7, 'k').fill(10, 4, 1, 7, 'n');
    c.ell(10, 9.5, 3, 2, 'y').ell(10, 15, 5, 4, 'y').fill(5, 9, 11, 1, 'y').ell(10, 14, 2, 2, 'k').ell(10, 14, 3, 3, 'k').ell(10, 14, 1, 1, 'k');
    c.fill(8, 17, 5, 1, 'n').fill(10, 5, 1, 12, 'g');
    return c.rows();
  },
  'harp-chime': () => {
    const c = canvas().fill(3, 1, 14, 1, 'T').line(3, 1, 3, 12, 'T').line(16, 1, 16, 12, 'T').ell(9.5, 14.5, 7, 3.5, 'T');
    for (let x = 5; x <= 14; x += 2) c.fill(x, 2, 1, 12, x % 4 === 1 ? 'w' : 'c');
    c.fill(2, 0, 16, 1, 'k').spr(15, 14, ['.w.', 'www', '.w.']).px(1, 16, 'c').px(2, 15, 'c');
    return c.rows();
  },
  pluck: () => {
    // a red pick bending one string away from the others, with its ripples
    const c = canvas();
    for (const y of [12, 15, 18]) c.fill(0, y, 20, 1, 'g');
    c.line(0, 9, 8, 13, 'k').line(8, 13, 19, 9, 'k').line(0, 10, 8, 14, 'w').line(8, 14, 19, 10, 'w');
    c.spr(5, 0, ['.kkkkkkk.', 'kkyyyyykk', 'kyyyyyyyk', '.kyyyyyk.', '..kyyyk..', '...kyk...', '....k....']);
    c.spr(13, 3, ['.c', 'c.', '.c']).spr(16, 4, ['.c', 'c.', '.c']).spr(1, 4, ['c.', '.c', 'c.']);
    return c.rows();
  },
  ooh: () => face(false),
  soprano: () => face(true),
  'choir-distant': () => {
    // a hall seen from the far end: an arch, with rows of small singers getting smaller
    const c = canvas().ell(10, 8, 7, 7, 'c').fill(2, 8, 16, 11, 'c').fill(2, 1, 16, 0, 'k');
    c.fill(1, 8, 1, 12, 'k').fill(18, 8, 1, 12, 'k').fill(1, 19, 18, 1, 'k').fill(2, 8, 16, 2, 'c');
    c.fill(10, 1, 1, 18, 'k').fill(4, 6, 12, 1, 'k');
    (
      [
        [5, 7, 'g'],
        [8, 7, 'g'],
        [11, 7, 'g'],
        [14, 7, 'g'],
      ] as const
    ).forEach(([x, y, ch]) => c.fill(x, y, 1, 1, 'w').fill(x, y + 1, 1, 2, ch));
    (
      [
        [4, 11, 'p'],
        [8, 11, 'b'],
        [12, 11, 'p'],
        [15, 11, 'b'],
      ] as const
    ).forEach(([x, y, ch]) => c.fill(x, y, 2, 2, 'w').fill(x, y + 2, 2, 3, ch));
    c.fill(6, 17, 2, 2, 'w').fill(12, 17, 2, 2, 'w');
    return c.rows();
  },
  'sub-round': () => {
    const c = canvas().ell(10, 10, 9, 9, 'g').ell(10, 10, 6, 6, 'k').ell(10, 10, 4, 4, 'g').ell(10, 10, 2, 2, 'k');
    c.px(5, 5, 'w').px(6, 5, 'w').px(5, 6, 'w').px(15, 15, 'g');
    return c.rows();
  },
  'punch-bass': () => {
    // a boxing glove landing on a speaker cone: a heavy hit
    const c = canvas().ell(14, 10, 5, 8, 'g').ell(14, 10, 3, 5, 'k');
    c.ell(8, 10, 5, 5, 'r')
      .fill(4, 13, 5, 5, 'r')
      .fill(3, 14, 1, 4, 'k')
      .fill(4, 17, 5, 1, 'k')
      .fill(4, 14, 5, 1, 'w')
      .fill(4, 16, 5, 1, 'w')
      .ell(7, 7, 2, 2, 'r')
      .fill(8, 9, 3, 1, 'k');
    c.line(0, 4, 3, 6, 'y').line(0, 10, 2, 10, 'y').line(0, 16, 2, 14, 'y').line(5, 0, 6, 2, 'y');
    return c.rows();
  },
  'slap-bass': () => bassGuitar('r', 'k', true),
  'finger-bass': () => bassGuitar('o', 'g', false),
  fretless: () => bassGuitar('e', 'k', false, true),
  bass: () => {
    // the bass clef
    const c = canvas().spr(1, 3, [
      '..kkkkk.....',
      '.kkkkkkkk...',
      'kkk....kkk.k',
      'kkk....kkk..',
      'kk.....kkk.k',
      '.......kkk..',
      '......kkk...',
      '.....kkk....',
      '....kkk.....',
      '...kkk......',
      '..kkk.......',
      '.kkk........',
      '.kk.........',
    ]);
    c.fill(15, 8, 2, 2, 'k').fill(15, 14, 2, 2, 'k').fill(1, 3, 0, 0, 'k');
    return c.rows();
  },
};

/** Faces: a rounded "ooh" mouth, or a soprano with long hair, a bun and a wide-open mouth. */
function face(soprano: boolean): string[] {
  const c = canvas();
  if (soprano) c.ell(10, 3, 2, 2, 'T').ell(10, 11, 8, 8, 'T');
  c.ell(10, 10.5, 6, 7, 'y').fill(7, 8, 2, 1, 'k').fill(11, 8, 2, 1, 'k');
  if (soprano) c.ell(10, 14, 2, 3, 'k').ell(10, 14.5, 1, 2, 'r').fill(5, 3, 0, 0, 'k').spr(2, 1, ['.w.', 'www', '.w.']);
  else
    c.ell(10, 14, 2, 2, 'k')
      .fill(10, 14, 1, 1, 'r')
      .px(9, 14, 'r')
      .line(1, 10, 2, 8, 'c')
      .line(1, 12, 2, 14, 'c')
      .line(18, 10, 17, 8, 'c')
      .line(18, 12, 17, 14, 'c');
  return c.rows();
}

/** An electric bass standing upright: neck with four tuners, a two-horn body, two pickups. */
function bassGuitar(body: string, trim: string, slap: boolean, smooth = false): string[] {
  const c = canvas().box(8, 0, 5, 3, 'n').fill(7, 0, 1, 1, 'g').fill(13, 0, 1, 1, 'g').fill(7, 2, 1, 1, 'g').fill(13, 2, 1, 1, 'g');
  c.fill(9, 3, 3, 8, 'k').fill(10, 3, 1, 8, smooth ? 'k' : 'n');
  if (!smooth) for (let y = 4; y < 11; y += 2) c.px(9, y, 'g').px(11, y, 'g');
  c.ell(10, 15, 5, 4, body).fill(6, 9, 2, 5, body).fill(13, 9, 2, 5, body).fill(6, 9, 1, 1, 'k').fill(14, 9, 1, 1, 'k');
  c.fill(8, 13, 5, 1, 'k')
    .fill(8, 15, 5, 1, trim === 'g' ? 'g' : 'k')
    .fill(8, 17, 5, 1, 'g')
    .fill(10, 3, 1, 15, 'w');
  if (slap) c.spr(14, 6, ['.yy..', 'yyyy.', 'yyyyy', '.yyy.']).line(17, 3, 19, 1, 'r').line(18, 5, 19, 4, 'r');
  else if (smooth) c.px(4, 6, 'e').px(5, 7, 'e').px(4, 8, 'e').px(3, 9, 'e');
  else c.fill(8, 8, 1, 1, 'y').fill(12, 6, 1, 1, 'y');
  return c.rows();
}
