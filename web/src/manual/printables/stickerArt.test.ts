// The sticker sheet rules (printables README): every sticker at least MIN_SIZE across, its bleed
// printed past its cut line all the way round, and a die-cut's border one smooth piece round all
// of its art. The packing itself (inside the area, GAP between cut lines) is test/manualStickers.test.ts.
import { describe, expect, it } from 'vitest';
import { BLEED, layoutStickers } from './stickerArt';
import { CUT_OFFSET, cutGeom, edgeDistance, inside, MIN_SIZE, outline, type Pt, type Solid, type StickerGeom } from './stickerGeom';

/** A die-cut's art from rows of '#' (solid) and '.', each cell `cell` inches. */
function solid(rows: string[], cell = 0.05): Solid {
  const cols = rows[0].length;
  const bits = new Uint8Array(cols * rows.length);
  rows.forEach((r, j) => [...r].forEach((c, i) => (bits[j * cols + i] = c === '#' ? 1 : 0)));
  return { cols, rows: rows.length, cell, bits };
}

/** The art's solid cells' centers, in the die-cut's own coordinates. */
function cellCenters(s: Solid): Pt[] {
  const out: Pt[] = [];
  for (let j = 0; j < s.rows; j++)
    for (let i = 0; i < s.cols; i++) if (s.bits[j * s.cols + i]) out.push([CUT_OFFSET + (i + 0.5) * s.cell, CUT_OFFSET + (j + 0.5) * s.cell]);
  return out;
}

// a character with two arms and a narrow gap between its legs, 1 x 1.2 in
const figure = solid(
  [
    '....######....',
    '....######....',
    '....######....',
    '##############',
    '#.....##.....#',
    '#.....##.....#',
    '......##......',
    '....######....',
    '....######....',
    '....##..##....',
    '....##..##....',
    '....##..##....',
    '....##..##....',
    '...###..###...',
  ],
  0.06,
);

const SHAPES: StickerGeom[] = [
  { w: 1.6, h: 1.6, shape: 'circle' },
  { w: 1.6, h: 1.6, shape: 'burst' },
  { w: 1.6, h: 1.6, shape: 'star' },
  { w: 1.55, h: 1.45, shape: 'heart' },
  { w: 1.9, h: 1.3, shape: 'bubble' },
  { w: 1.9, h: 1.3, shape: 'badge' },
  { w: 1.55, h: 1.55, shape: 'floppy' },
  { w: 1.75, h: 1.45, shape: 'tv' },
  cutGeom(figure),
];

describe('bleed', () => {
  it.each(SHAPES.map((g) => [g.shape, g] as const))('a %s prints its color past the cut line all the way round', (_, g) => {
    const cut = outline(g);
    for (const [x, y] of outline(g, BLEED)) {
      expect(inside(cut, x, y)).toBe(false);
      expect(edgeDistance(cut, x, y)).toBeGreaterThan(BLEED * 0.75);
    }
  });
});

describe('die-cuts', () => {
  const g = cutGeom(figure);
  const cut = outline(g);

  it('keeps a border of at least CUT_OFFSET round all of the art', () => {
    for (const [x, y] of cellCenters(figure)) {
      expect(inside(cut, x, y)).toBe(true);
      expect(edgeDistance(cut, x, y)).toBeGreaterThan(CUT_OFFSET);
    }
  });

  it('fills the narrow gap between the legs and under the arms, so the blade follows one smooth line', () => {
    // between the legs, near the bottom
    expect(inside(cut, CUT_OFFSET + 7 * 0.06, CUT_OFFSET + 13 * 0.06)).toBe(true);
    // under an arm, beside the body
    expect(inside(cut, CUT_OFFSET + 3 * 0.06, CUT_OFFSET + 6.5 * 0.06)).toBe(true);
  });

  it('turns gently all the way round: no steps or spikes for the blade to catch on', () => {
    let sharpest = 0;
    for (let i = 0; i < cut.length; i++) {
      const [a, b, c] = [cut[(i + cut.length - 1) % cut.length], cut[i], cut[(i + 1) % cut.length]];
      const t = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(b[1] - a[1], b[0] - a[0]);
      sharpest = Math.max(sharpest, Math.abs(Math.atan2(Math.sin(t), Math.cos(t))));
    }
    expect((sharpest * 180) / Math.PI).toBeLessThan(50);
  });

  it('bridges parts of the art that stand apart, so nothing is left outside the cut', () => {
    const apart = solid(
      [
        '########..........',
        '########..........',
        '########..........',
        '..................',
        '..................',
        '..........########',
        '..........########',
      ],
      0.06,
    );
    const cut2 = outline(cutGeom(apart));
    for (const [x, y] of cellCenters(apart)) expect(inside(cut2, x, y)).toBe(true);
  });
});

describe('a sheet', () => {
  const stickers: StickerGeom[] = [...SHAPES, ...SHAPES.slice(0, 4)];
  const fillers = [cutGeom(solid(['####', '####', '####', '####'], 0.19))];
  const pages = layoutStickers(stickers, fillers, 20);

  it('puts every sticker on a sheet', () => {
    expect(pages.flat().filter((p) => p.index < stickers.length)).toHaveLength(stickers.length);
  });

  it('keeps every sticker at least MIN_SIZE across', () => {
    for (const p of pages.flat()) expect(Math.min(p.w, p.h)).toBeGreaterThanOrEqual(MIN_SIZE);
  });

  it('refuses a sticker under MIN_SIZE across', () => {
    expect(() => layoutStickers([{ w: 2, h: MIN_SIZE - 0.1, shape: 'rect' }])).toThrow(/under/);
  });
});
