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

it('renders saved choices while verification is pending without claiming readiness', async () => {
  const doc = new FakeDoc();
  const elements: FakeEl[] = [];
  const create = doc.createElement.bind(doc);
  doc.createElement = (tag) => {
    const el = create(tag);
    elements.push(el);
    return el;
  };
  vi.stubGlobal('document', doc);
  let finish!: (status: OfflineStatus) => void;
  vi.mocked(offlineStatus).mockImplementation((_selection, onSelection) => {
    onSelection?.({
      supported: true,
      ready: false,
      copy: 'unfinished',
      removable: true,
      tiers: ['core', 'cd'],
      tierFiles: [],
      storedMissing: 10,
      wireMissing: 10,
    } as unknown as OfflineStatus);
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  await openOfflineDialog();
  const inputs = elements.filter((el) => el.tag === 'input');
  expect(inputs).toHaveLength(9);
  expect(inputs.every((el) => el.hasAttribute('disabled'))).toBe(true);
  expect(inputs.filter((el) => el.hasAttribute('checked'))).toHaveLength(2);
  expect(elements.some((el) => el.textContent === 'Checking saved files…')).toBe(true);
  expect(elements.some((el) => el.textContent.includes('Ready offline'))).toBe(false);
  expect(elements.some((el) => el.tag === 'button' && el.children.some((c) => c.textContent === 'Close'))).toBe(true);
  finish({ supported: true, ready: true, tiers: ['core', 'cd'], tierFiles: [], storedMissing: 0, wireMissing: 0 } as unknown as OfflineStatus);
  await Promise.resolve();
  const verifiedInputs = elements.filter((el) => el.tag === 'input').slice(9);
  expect(verifiedInputs).toHaveLength(9);
  expect(verifiedInputs.filter((el) => el.hasAttribute('disabled'))).toHaveLength(1);
  expect(elements.some((el) => el.textContent.includes('Ready offline'))).toBe(true);
});
