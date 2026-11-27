// A bulk removal needs a saved Undo copy for each game it deletes.
import { expect, it, vi } from 'vitest';
import type { DeletedGame } from '../../project/recentlyDeleted';
import { removeImported } from './importRemove';

const batch = vi.hoisted(() => [
  { id: 'a', name: 'First' },
  { id: 'b', name: 'Second' },
]);
const spies = vi.hoisted(() => ({
  remove: vi.fn(),
  restore: vi.fn(),
  undo: vi.fn<(message: string, undo: () => Promise<void>) => void>(),
}));
vi.mock('../../project/storage', () => ({
  listProjects: async () => batch,
  loadProject: async () => undefined,
  loadRecord: async (id: string) => {
    if (id === 'b') throw new Error('Read failed');
    return { id, name: 'First', files: {} };
  },
  putRecord: spies.restore,
  deleteProject: spies.remove,
}));
vi.mock('../../project/recentlyDeleted', async (original) => {
  const actual = await original<typeof import('../../project/recentlyDeleted')>();
  const kept = new Map<string, DeletedGame>();
  return { ...actual, browserShelf: { put: (g: DeletedGame) => kept.set(g.id, g), all: () => [...kept.values()], remove: (id: string) => kept.delete(id) } };
});
vi.mock('./homeOrigin', () => ({ isImported: () => true, originId: vi.fn(), rememberOrigin: vi.fn(), setImported: vi.fn(), forgetOrigin: vi.fn() }));
vi.mock('../core/ui', () => ({ modal: () => batch, toast: vi.fn() }));
vi.mock('./importChooser', () => ({
  working: (_title: string, _start: string, work: (signal: AbortSignal, tell: () => void) => Promise<void>) => work(new AbortController().signal, vi.fn()),
}));
vi.mock('./homeProjectActions', () => ({ undoToast: spies.undo }));

it('keeps a game whose snapshot read fails and restores the earlier removal with Undo', async () => {
  await removeImported(vi.fn());
  expect(spies.remove.mock.calls).toEqual([['a']]);
  const [message, undo] = spies.undo.mock.calls[0];
  expect(message).toContain('Removed 1 game.');
  expect(message).toContain('Second');
  await undo();
  expect(spies.restore.mock.calls).toEqual([[{ id: 'a', name: 'First', files: {} }]]);
});
