import { describe, expect, it } from 'vitest';
import { keepScroll } from './keepScroll';

interface FakeBox {
  scrollTop: number;
  querySelector(selector: string): FakeBox | null;
}
const box = (scrollTop: number): FakeBox => ({ scrollTop, querySelector: () => null });

describe('keepScroll', () => {
  it('puts the list back where it was after a redraw moved it', () => {
    const list = box(7341);
    keepScroll(list, '.x', () => (list.scrollTop = 7276));
    expect(list.scrollTop).toBe(7341);
  });

  it('puts back the drop-down list the redraw replaced', () => {
    let inner = box(500);
    const list: FakeBox = { scrollTop: 0, querySelector: () => inner };
    keepScroll(list, '.x', () => (inner = box(0)));
    expect(inner.scrollTop).toBe(500);
  });

  it('leaves a list alone when nothing moved it', () => {
    const list = box(120);
    keepScroll(list, '.x', () => undefined);
    expect(list.scrollTop).toBe(120);
  });
});
