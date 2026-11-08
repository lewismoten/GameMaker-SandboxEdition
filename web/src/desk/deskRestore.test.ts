// Passive desk navigation clears stale disk requests without a missing-disk notice.
import { beforeEach, expect, it, vi } from 'vitest';
import { restoreDesk } from './deskRestore';
import { toast } from '../editor/core/ui';
import type { viewState } from '../urlState';
vi.mock('../editor/core/ui', () => ({ toast: vi.fn() }));
vi.mock('../project/files', () => ({ loadGameList: async () => [], loadCatalog: async () => [] }));
const actions = () => ({
  disks: vi.fn(async () => []),
  insert: vi.fn(),
  onDisk: vi.fn(),
  startGameMaker: vi.fn(),
  command: vi.fn(),
  power: vi.fn(),
  look: vi.fn(),
  catalog: vi.fn(),
  magazine: vi.fn(),
  mug: vi.fn(),
  openGmBox: vi.fn(),
  dosManual: vi.fn(),
  gameManual: vi.fn(),
});
const state = () => ({ get: vi.fn(), set: vi.fn() }) as unknown as ReturnType<typeof viewState>;
beforeEach(() => vi.clearAllMocks());
it('clears a graduation disk on a passive return without powering on or warning', async () => {
  const on = actions();
  const set = vi.fn();
  const view = { ...state(), set };
  await restoreDesk({ disk: 'cd:graduation-basics' }, view, on);
  expect(view.set).toHaveBeenCalledWith({ disk: undefined });
  expect(toast).not.toHaveBeenCalled();
  expect(on.power).not.toHaveBeenCalled();
  expect(on.insert).not.toHaveBeenCalled();
});
it('still explains a missing disk when play was explicitly requested', async () => {
  await restoreDesk({ disk: 'cd:missing', run: 'play' }, state(), actions());
  expect(toast).toHaveBeenCalledOnce();
});
