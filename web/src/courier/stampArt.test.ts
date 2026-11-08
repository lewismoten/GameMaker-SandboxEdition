// The stamps' pixel art: every kind is a whole 20 x 24 stamp, see-through only at its perforations.
import { describe, expect, it } from 'vitest';
import { STAMP_H, STAMP_W, stampPixels, stampSvg } from './stampArt';
import type { StampKind } from './tables';

const KINDS: StampKind[] = ['game', 'sample-cd', 'graduation', 'mystery'];

describe('stamp art', () => {
  it('fills every pixel inside the edge, with a gap at every other edge pixel', () => {
    for (const k of KINDS) {
      const px = stampPixels(k);
      expect(px).toHaveLength(STAMP_H);
      for (const [y, row] of px.entries()) {
        expect(row, k).toHaveLength(STAMP_W);
        for (const [x, c] of row.entries()) {
          const rim = x === 0 || y === 0 || x === STAMP_W - 1 || y === STAMP_H - 1;
          if (!rim) expect(c, `${k} ${x},${y}`).toMatch(/^#[0-9a-f]{6}$/);
          else expect(c === null, `${k} ${x},${y}`).toBe((x + y) % 2 === 1);
        }
      }
    }
  });

  it('draws as a hidden, crisp SVG of its size', () => {
    const svg = stampSvg('mystery', 3);
    expect(svg).toContain(`width="${STAMP_W * 3}"`);
    expect(svg).toContain('aria-hidden="true"');
    expect(svg).toContain('shape-rendering="crispEdges"');
  });
});
