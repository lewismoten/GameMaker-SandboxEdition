import { describe, expect, it } from 'vitest';
import { History } from '../src/editor/history';

describe('History', () => {
  it('undoes and redoes in order', () => {
    const h = new History<number>();
    let v = 0;
    for (const next of [1, 2, 3]) {
      h.record(v);
      v = next;
    }
    v = h.undo(v)!;
    expect(v).toBe(2);
    v = h.undo(v)!;
    expect(v).toBe(1);
    v = h.redo(v)!;
    expect(v).toBe(2);
    expect(h.canRedo).toBe(true);
  });
  it('forgets the redo list after a new change', () => {
    const h = new History<number>();
    h.record(0);
    expect(h.undo(1)).toBe(0);
    h.record(0);
    expect(h.canRedo).toBe(false);
    expect(h.redo(5)).toBeUndefined();
  });
  it('keeps at most the limit', () => {
    const h = new History<number>(2);
    h.record(1);
    h.record(2);
    h.record(3);
    expect(h.undo(4)).toBe(3);
    expect(h.undo(3)).toBe(2);
    expect(h.undo(2)).toBeUndefined();
  });
});
