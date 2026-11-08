// The stamps' pixel art: one 20 x 24 stamp per kind, a perforated paper edge around a colored field
// with a 12 x 12 picture (a floppy disk for a catalog game, a compact disc for the Sample CD, a
// mortarboard with a gold tassel for a graduation, a question mark for a mystery game). No DOM:
// the card draws it as SVG, a build or a sheet can draw it too. Every picture had the stranger check
// at 1x and 6x (no crosses, flags or look-alikes).
import type { StampKind } from './tables';

export const STAMP_W = 20;
export const STAMP_H = 24;

const PAPER = '#fffdf6';
const EDGE = '#c9bfa6';

interface Look {
  field: string;
  /** 12 rows of 12: '.' is the field, other letters index `colors`. */
  rows: readonly string[];
  colors: Readonly<Record<string, string>>;
  /** A light outline drawn on the field around the pixels of these letters, so a dark picture reads at 1x. */
  outline?: { of: string; color: string };
}

const LOOKS: Readonly<Record<StampKind, Look>> = {
  game: {
    field: '#9cc3ea',
    rows: [
      'kkkkkkkkkkk.',
      'kbbsssssbbkk',
      'kbbsshssbbbk',
      'kbbsshssbbbk',
      'kbbsssssbbbk',
      'kbbbbbbbbbbk',
      'kbwwwwwwwwbk',
      'kbwllllllwbk',
      'kbwwwwwwwwbk',
      'kbwllllwwwbk',
      'kbwwwwwwwwbk',
      'kkkkkkkkkkkk',
    ],
    colors: { k: '#172033', b: '#2f4a7a', s: '#c8ced6', h: '#172033', w: '#ffffff', l: '#7a8aa3' },
  },
  'sample-cd': {
    field: '#5fb3a6',
    rows: [
      '....kkkk....',
      '..kksssskk..',
      '.ksssssccsk.',
      '.ksssssscck.',
      'ksssskksscsk',
      'ksssk..ksssk',
      'ksssk..ksssk',
      'kscsskkssssk',
      '.kccssssssk.',
      '.kssssssssk.',
      '..kksssskk..',
      '....kkkk....',
    ],
    colors: { k: '#1f3b38', s: '#e4e8ec', c: '#b9a6e8' },
  },
  graduation: {
    field: '#c9b3e6',
    rows: [
      '............',
      '.....gg.....',
      '...ggkkkk...',
      '.ggkkkykkkk.',
      'kkkkkkkyyyyy',
      '.kkkkkkkkk.y',
      '...kkkkkk..y',
      '...kkkkkk..y',
      '...kkkkkk.yy',
      '....kkkk..yy',
      '..........yy',
      '............',
    ],
    colors: { k: '#1e1a24', g: '#5a5266', y: '#e8b923' },
    outline: { of: 'kg', color: '#f7f2fd' },
  },
  mystery: {
    field: '#7d8794',
    rows: [
      '...wwwwww...',
      '..wwwwwwwwk.',
      '..wwkkkkwwk.',
      '...kk...wwk.',
      '.......wwwk.',
      '.....wwwwk..',
      '.....wwkk...',
      '.....wwk....',
      '......kk....',
      '.....ww.....',
      '.....wwk....',
      '......kk....',
    ],
    colors: { w: '#ffffff', k: '#3a414b' },
  },
};

/** The stamp as rows of colors (null is see-through), STAMP_H rows of STAMP_W. */
export function stampPixels(kind: StampKind): (string | null)[][] {
  const look = LOOKS[kind];
  const out: (string | null)[][] = [];
  for (let y = 0; y < STAMP_H; y++) {
    const row: (string | null)[] = [];
    for (let x = 0; x < STAMP_W; x++) {
      const rim = x === 0 || y === 0 || x === STAMP_W - 1 || y === STAMP_H - 1;
      if (rim) {
        // perforations: every other pixel of the edge is a gap
        row.push((x + y) % 2 === 0 ? EDGE : null);
        continue;
      }
      const inField = x >= 2 && x < STAMP_W - 2 && y >= 2 && y < STAMP_H - 2;
      if (!inField) {
        row.push(PAPER);
        continue;
      }
      const px = x - 4;
      const py = y - 4;
      const c = px >= 0 && px < 12 && py >= 0 && py < 12 ? look.rows[py][px] : '.';
      row.push(c === '.' ? look.field : look.colors[c]);
    }
    out.push(row);
  }
  // the outline: a field pixel beside (not diagonal to) an outlined one
  if (look.outline) {
    const { of, color } = look.outline;
    const letter = (x: number, y: number) => {
      const px = x - 4;
      const py = y - 4;
      return px >= 0 && px < 12 && py >= 0 && py < 12 ? look.rows[py][px] : '.';
    };
    for (let y = 2; y < STAMP_H - 2; y++)
      for (let x = 2; x < STAMP_W - 2; x++)
        if (letter(x, y) === '.' && [letter(x - 1, y), letter(x + 1, y), letter(x, y - 1), letter(x, y + 1)].some((c) => of.includes(c))) out[y][x] = color;
  }
  // a lighter band under the picture, like a stamp's value line
  for (let x = 4; x < STAMP_W - 4; x++) out[STAMP_H - 5][x] = PAPER;
  return out;
}

/** The stamp as an SVG string, `scale` screen pixels per art pixel, crisp edges. */
export function stampSvg(kind: StampKind, scale = 2): string {
  const rects: string[] = [];
  stampPixels(kind).forEach((row, y) => {
    // runs of one color on a row, one rect each
    for (let x = 0; x < row.length;) {
      const c = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === c) end++;
      if (c) rects.push(`<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${c}"/>`);
      x = end;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${STAMP_W} ${STAMP_H}" width="${STAMP_W * scale}" height="${STAMP_H * scale}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${rects.join('')}</svg>`;
}
