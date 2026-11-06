// deskShelf: leaving the desk while the shelf is still being drawn releases it once it is made.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogEntry } from '../project/files';

const dispose = vi.fn();
let finish: () => void;
let drawing: () => void;
let started: Promise<void>;
beforeEach(() => {
  dispose.mockClear();
  started = new Promise<void>((resolve) => (drawing = resolve));
});
vi.mock('./boxes/shelf', () => ({
  gameShelf: () =>
    new Promise((resolve) => {
      finish = () => resolve({ element: { remove: () => undefined }, face: () => undefined, dispose });
      drawing();
    }),
}));

describe('deskShelf', () => {
  it('disposes a shelf that finishes drawing after the desk was left', async () => {
    const { deskShelf } = await import('./deskShelf');
    const scene = { querySelectorAll: () => [], querySelector: () => null };
    const desk = { querySelector: () => scene };
    const s = deskShelf(desk as never, { insert: () => undefined, manual: () => undefined, restoreBox: undefined } as never);
    const filling = s.fill([{ id: 'x' } as CatalogEntry]);
    // The lazy import may take any number of turns; leave only once drawing has begun.
    await started;
    s.dispose();
    finish();
    await filling;
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
