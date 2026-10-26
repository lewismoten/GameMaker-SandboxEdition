// Tests for surfaceOps.ts: mirroring, lines, boxes and fills across a group's joined picture.
import { describe, expect, it } from 'vitest';
import { box, floodFill, line, mirrorAll } from './surfaceOps';

describe('drawing on a joined picture', () => {
  it('mirrors across the whole picture', () => {
    expect(mirrorAll(1, 2, 40, 20, 'h')).toEqual([
      [1, 2],
      [38, 2],
    ]);
    expect(mirrorAll(0, 0, 40, 40, 'both')).toHaveLength(4);
    expect(mirrorAll(19, 0, 39, 20, 'h')).toEqual([[19, 0]]);
  });

  it('draws lines and boxes', () => {
    const pts: string[] = [];
    line({ x: 0, y: 0 }, { x: 3, y: 0 }, (x, y) => pts.push(`${x},${y}`));
    expect(pts).toEqual(['0,0', '1,0', '2,0', '3,0']);
    const b = new Set<string>();
    box({ x: 0, y: 0 }, { x: 2, y: 2 }, (x, y) => b.add(`${x},${y}`));
    expect(b.size).toBe(8);
    expect(b.has('1,1')).toBe(false);
  });

  it('fills across what would be block edges', () => {
    const w = 40;
    const px = new Uint8Array(w * 2);
    px[10] = 5;
    px[w + 10] = 5;
    floodFill(px, w, 2, 0, 0, 7);
    expect(px[0]).toBe(7);
    expect(px[9]).toBe(7);
    expect(px[11]).toBe(0);
    floodFill(px, w, 2, 39, 1, 7);
    expect(px.filter((v) => v === 7).length).toBe(78);
  });
});
