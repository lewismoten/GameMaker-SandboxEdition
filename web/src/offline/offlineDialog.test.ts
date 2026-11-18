// A partial prepared copy can be removed even when another download cannot fit.
import { afterEach, expect, it, vi } from 'vitest';
import { FakeDoc, type FakeEl } from '../../test/fakeDom';
import { openOfflineDialog } from './offlineDialog';
import { offlineStatus, removeOffline, type OfflineStatus } from './offlineCopy';
vi.mock('./replay', () => ({ inArchiveReplay: () => false }));
vi.mock('./offlineCopy', () => ({ offlineStatus: vi.fn(), removeOffline: vi.fn(), hasRoom: () => false, sizeText: () => '1 KB' }));
vi.mock('../editor/core/ui', async (original) => ({
  ...(await original<typeof import('../editor/core/ui')>()),
  modal: async (_title: string, build: (close: () => void) => unknown) => {
    build(() => {});
    await Promise.resolve();
  },
}));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
it.each(['unfinished', 'outdated'] as const)('offers Remove for a %s copy with ready=false and no room', async (copy) => {
  const doc = new FakeDoc();
  const elements: FakeEl[] = [];
  const create = doc.createElement.bind(doc);
  doc.createElement = (tag) => {
    const el = create(tag);
    elements.push(el);
    return el;
  };
  vi.stubGlobal('document', doc);
  vi.mocked(offlineStatus).mockResolvedValue({
    supported: true,
    ready: false,
    copy,
    removable: true,
    tiers: ['core'],
    tierFiles: [],
    storedMissing: 10,
    wireMissing: 10,
  } as unknown as OfflineStatus);
  await openOfflineDialog();
  const remove = elements.find((el) => el.tag === 'button' && el.children.some((c) => c.textContent === 'Remove offline copies'))!;
  expect(elements.some((el) => el.children.includes(remove))).toBe(true);
  remove.fire('click');
  await Promise.resolve();
  expect(removeOffline).toHaveBeenCalledOnce();
});
