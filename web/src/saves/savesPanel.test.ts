// Only a completed safety backup covers later edits in the same panel.
import { expect, it, vi } from 'vitest';
import { backupNow } from '../project/saveData';
import { ensureSafetyBackup } from './savesPanel';

vi.mock('../project/saveData', async (original) => ({ ...(await original<typeof import('../project/saveData')>()), backupNow: vi.fn() }));

it('retries a failed backup and skips later backups once one succeeds', async () => {
  const panel = { backedUp: false, target: { saveId: 'game', title: 'Game', gam: null, files: vi.fn() } };
  vi.mocked(backupNow).mockRejectedValueOnce(new Error('Storage full'));

  await expect(ensureSafetyBackup(panel)).rejects.toThrow('Storage full');
  expect(panel.backedUp).toBe(false);

  await ensureSafetyBackup(panel);
  expect(panel.backedUp).toBe(true);
  await ensureSafetyBackup(panel);
  expect(backupNow).toHaveBeenCalledTimes(2);
});
