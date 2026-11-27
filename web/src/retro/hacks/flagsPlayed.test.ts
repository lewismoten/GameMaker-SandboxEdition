// PLAYED must preserve badge progress when the command cannot be applied.
import { afterEach, expect, it, vi } from 'vitest';
import * as store from '../../achievements/store';
import * as goals from '../../achievements/goals';
import * as files from '../../project/files';
import { FlagError, ITEMS } from './flagsItems';

const played = ITEMS.find((item) => item.id === 'PLAYED')!;
function seedProgress() {
  const sets = { played: ['a'], finished: ['a'] };
  const record = { unlocked: {}, progress: {}, sets: structuredClone(sets) };
  const read = vi.spyOn(store, 'loadAchievements').mockResolvedValue(record);
  const write = vi.spyOn(store, 'replaceAchievements').mockImplementation(async (next) => {
    Object.assign(record, next);
  });
  vi.spyOn(goals, 'refreshGoals').mockResolvedValue();
  return { sets, record, read, write };
}
afterEach(() => vi.restoreAllMocks());

it.each([['DNOE'], ['DONE', 'EXTRA']])('rejects trailing arguments starting with %s before accessing progress', async (...tail) => {
  const { sets, record, read, write } = seedProgress();
  vi.spyOn(files, 'loadGameList').mockResolvedValue([{ id: 'a', title: 'A', kind: 'gameware', path: 'a/', gam: 'A.GAM', original: {}, series: 'starter' }]);
  await expect(played.set!(['STARTERS', '1', ...tail])).rejects.toBeInstanceOf(FlagError);
  expect(record.sets).toEqual(sets);
  expect(read).not.toHaveBeenCalled();
  expect(write).not.toHaveBeenCalled();
});
