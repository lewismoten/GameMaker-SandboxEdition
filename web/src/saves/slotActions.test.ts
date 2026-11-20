// Storage failures should reach the player and leave the slot's working copy intact.
import { expect, it, vi } from 'vitest';
import { pickFiles } from '../editor/core/ui';
import { deleteSlot, writeSlotBytes } from '../project/saveData';
import type { Panel } from './panelState';
import { importSav, removeSlot } from './slotActions';

vi.mock('../editor/core/ui', () => ({ pickFiles: vi.fn() }));
vi.mock('../project/saveData', () => ({ parseSave: vi.fn(), deleteSlot: vi.fn(), writeSlotBytes: vi.fn() }));
vi.mock('./panelText', () => ({ confirmDialog: () => true }));

it.each([
  [importSav, writeSlotBytes, 'import'],
  [removeSlot, deleteSlot, 'delete'],
] as const)('handles a storage rejection from %s', async (action, write, verb) => {
  vi.mocked(pickFiles).mockResolvedValue([new File([], 'game.sav')]);
  vi.mocked(write).mockRejectedValueOnce(new Error('Storage blocked'));
  const panel = { target: { saveId: 'game' }, safety: vi.fn(), work: new Map([[0, {}]]), toast: vi.fn() };

  await action(panel as unknown as Panel, 0);

  expect(panel.toast).toHaveBeenCalledWith(`Could not ${verb} the save: Storage blocked`, 'error');
  expect(panel.work.has(0)).toBe(true);
});
