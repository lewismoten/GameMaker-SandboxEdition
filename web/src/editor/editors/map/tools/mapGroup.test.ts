// Groups captured from maps keep their layout and repeated tile references without changing the map.
import { describe, expect, it } from 'vitest';
import { selectionGroup } from './mapGroup';

describe('map selection groups', () => {
  it('keeps the selected tile layout, including repeated block references', () => {
    const blocks = new Uint8Array(10000);
    blocks.set([7, 8], 302);
    blocks.set([7, 9], 402);
    const group = selectionGroup('Tree', blocks, { x: 2, y: 3, w: 2, h: 2 }, 256);
    expect(group).toEqual({ name: 'Tree', cols: 2, rows: 2, cells: [7, 8, 7, 9] });
    expect(blocks[302]).toBe(7);
    expect(blocks[402]).toBe(7);
  });
  it('rejects oversized selections instead of silently truncating their picture', () => {
    expect(selectionGroup('Large', new Uint8Array(10000), { x: 0, y: 0, w: 9, h: 2 }, 256)).toBeUndefined();
    expect(selectionGroup('Tall', new Uint8Array(10000), { x: 0, y: 0, w: 2, h: 9 }, 256)).toBeUndefined();
  });
});
