// Edge sets: the right sides open in each slot, waves that meet, outlines, and finding room.
import { describe, expect, it } from 'vitest';
import { BLEN } from '../../../formats/blocks';
import { EDGE_SLOTS, freeRun, isOutside, makeEdgeSet } from './edgeSet';

const flat = { depth: 4, wavy: false };
const fill = new Uint8Array(BLEN * BLEN).fill(10);
const dirt = new Uint8Array(BLEN * BLEN).fill(50);

describe('edgeSet', () => {
  it('opens the named sides', () => {
    const top = EDGE_SLOTS.indexOf('Top edge');
    expect(isOutside(top, 10, 0, flat)).toBe(true);
    expect(isOutside(top, 10, 3, flat)).toBe(true);
    expect(isOutside(top, 10, 4, flat)).toBe(false);
    expect(isOutside(top, 10, BLEN - 1, flat)).toBe(false);
    const br = EDGE_SLOTS.indexOf('Bottom-right corner');
    expect(isOutside(br, BLEN - 1, 5, flat)).toBe(true);
    expect(isOutside(br, 5, BLEN - 1, flat)).toBe(true);
    expect(isOutside(br, 5, 5, flat)).toBe(false);
  });

  it('opens only the corner of an inner corner', () => {
    const gap = EDGE_SLOTS.indexOf('Inner corner, gap bottom-left');
    expect(isOutside(gap, 0, BLEN - 1, flat)).toBe(true);
    expect(isOutside(gap, 0, 0, flat)).toBe(false);
    expect(isOutside(gap, BLEN - 1, BLEN - 1, flat)).toBe(false);
    expect(isOutside(gap, 6, BLEN - 1, flat)).toBe(false);
  });

  it('waves the same at both ends, so neighbors meet', () => {
    const wavy = { depth: 5, wavy: true };
    const top = EDGE_SLOTS.indexOf('Top edge');
    const col = (x: number) => Array.from({ length: BLEN }, (_, y) => isOutside(top, x, y, wavy)).filter(Boolean).length;
    expect(Math.abs(col(0) - col(BLEN - 1))).toBeLessThanOrEqual(1);
    expect(new Set(Array.from({ length: BLEN }, (_, x) => col(x))).size).toBeGreaterThan(1);
  });

  it('paints fill, outside and an outline', () => {
    const set = makeEdgeSet(fill, dirt, { ...flat, outline: (c) => c - 1 });
    expect(set).toHaveLength(12);
    const top = set[EDGE_SLOTS.indexOf('Top edge')];
    expect(top[0]).toBe(50);
    expect(top[4 * BLEN + 3]).toBe(9);
    expect(top[10 * BLEN + 3]).toBe(10);
  });

  it('finds a run of blank blocks', () => {
    const blocks = Array.from({ length: 40 }, () => ({ pixels: new Uint8Array(BLEN * BLEN) }));
    blocks[5].pixels[3] = 1;
    expect(freeRun(blocks)).toBe(6);
    expect(freeRun(blocks.slice(0, 15))).toBe(-1);
  });
});
