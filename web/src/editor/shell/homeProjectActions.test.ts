// A paused Undo notice releases its state when another notice replaces it.
import { expect, it, vi } from 'vitest';
import { FakeDoc } from '../../../test/fakeDom';
import { undoToast } from './homeProjectActions';

it('expires a paused notice on replacement and each notice only once', () => {
  vi.useFakeTimers();
  const doc = new FakeDoc();
  vi.stubGlobal('document', Object.assign(doc, { querySelector: () => doc.body.children.find((el) => el.isConnected) }));
  const first = vi.fn();
  const second = vi.fn();
  try {
    undoToast('First', async () => {}, 100, first);
    const old = doc.body.children[0];
    old.fire('pointerenter');
    vi.advanceTimersByTime(200);
    expect(first).not.toHaveBeenCalled();
    undoToast('Second', async () => {}, 100, second);
    expect(first).toHaveBeenCalledTimes(1);
    expect(old.isConnected).toBe(false);
    old.children[2].fire('click');
    vi.runAllTimers();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  } finally {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  }
});
