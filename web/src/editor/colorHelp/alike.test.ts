import { describe, expect, it } from 'vitest';
import { alikePairs, alikeTo, alikeUnder, previewViews, touchingAlike, warnVisions } from './alike';

const pal = new Uint8Array(768);
const set = (i: number, r: number, g: number, b: number) =>
  pal.set(
    [r, g, b].map((v) => Math.round(v / 4.0476)),
    i * 3,
  );
// 1: orange-brown and 2: olive (alike with red-green differences); 3: green and 4: teal (blue-yellow); 5: blue
set(1, 170, 90, 20);
set(2, 110, 130, 20);
set(3, 0, 153, 0);
set(4, 0, 153, 102);
set(5, 0, 0, 255);

describe('look-alike colors', () => {
  it('flags orange-brown and olive for red-green only', () => {
    expect(['protan', 'deutan']).toContain(alikeUnder([170, 90, 20], [110, 130, 20], warnVisions('rg')));
    expect(alikeUnder([170, 90, 20], [110, 130, 20], warnVisions('by'))).toBeUndefined();
  });
  it('flags green and teal for blue-yellow only', () => {
    expect(alikeUnder([0, 153, 0], [0, 153, 102], warnVisions('by'))).toBe('tritan');
    expect(alikeUnder([0, 153, 0], [0, 153, 102], warnVisions('rg'))).toBeUndefined();
  });
  it('never flags colors that already look alike, or plainly different ones', () => {
    expect(alikeUnder([100, 100, 100], [102, 100, 100], warnVisions('both'))).toBeUndefined();
    expect(alikeUnder([255, 0, 0], [0, 0, 255], warnVisions('both'))).toBeUndefined();
  });
  it('is quiet when warnings are off', () => {
    expect(alikePairs(pal, [1, 2, 3, 4], 'off')).toEqual([]);
    expect(alikeTo(pal, 1, 'off')).toEqual([]);
  });
  it('pairs the used colors', () => {
    expect(alikePairs(pal, [1, 2, 3, 4, 5], 'rg')).toContainEqual([1, 2]);
    expect(alikePairs(pal, [1, 2, 3, 4, 5], 'by')).toContainEqual([3, 4]);
    expect(alikeTo(pal, 3, 'by')).toContain(4);
  });
  it('finds look-alikes only where they touch in a picture', () => {
    // 1 2 / 5 5: 1 and 2 touch; 3 sits far off beside 5 (no look-alike partner nearby)
    const near = new Uint8Array([1, 2, 5, 5]);
    expect(touchingAlike(near, 2, 2, pal, 'rg')).toEqual([[1, 2]]);
    const apart = new Uint8Array([1, 5, 5, 2]);
    expect(touchingAlike(apart, 2, 2, pal, 'rg')).toEqual([]);
    expect(touchingAlike(near, 2, 2, pal, 'rg', 2)).toEqual([]);
  });
  it('lists the views to preview', () => {
    expect(previewViews('normal')).toHaveLength(1);
    expect(previewViews('all').map((v) => v.id)).toEqual(['normal', 'rg', 'by']);
  });
});
