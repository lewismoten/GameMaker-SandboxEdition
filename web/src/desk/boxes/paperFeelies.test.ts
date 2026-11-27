// A closed box should never start its delayed thumbnail work.
import { expect, it, vi } from 'vitest';
import { FakeDoc } from '../../../test/fakeDom';
import { paperFeelieTiles } from './paperFeelies';

vi.mock('./boxList', () => ({ showInBox: vi.fn() }));
vi.mock('../../manual/printables/yieldNow', () => ({ whenQuiet: () => Promise.resolve() }));

it('skips the first sheet when the box closes before the thumbnail timer fires', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('document', new FakeDoc());
  try {
    const first = vi.fn().mockResolvedValue(undefined);
    const [tile] = paperFeelieTiles([{ id: 'card', title: 'Card', icon: '', first, render: () => Promise.resolve([]) }], vi.fn());
    document.body.append(tile);
    tile.remove();
    await vi.runAllTimersAsync();
    expect(first).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  }
});
