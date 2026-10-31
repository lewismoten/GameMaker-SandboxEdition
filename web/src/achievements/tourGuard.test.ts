// While a guided tour plays (the html element's tour-on class) nothing counts toward an
// achievement, nobody waits on a skipped change, and a Reset isn't undone by a write queued before it.
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const saves: Record<string, Record<string, Uint8Array>> = {};
vi.mock('../project/storage', () => ({
  loadSaveData: async (id: string) => ({ ...(saves[id] ?? {}) }),
  writeSaveFile: async (id: string, name: string, bytes: Uint8Array) => {
    (saves[id] ??= {})[name] = bytes;
  },
}));

import {
  achievementsWritten,
  countOccurrence,
  forgetForTests,
  loadAchievements,
  progress,
  remember,
  resetAchievements,
  tally,
  unlockAchievement,
} from './store';

beforeEach(() => {
  for (const k of Object.keys(saves)) delete saves[k];
  forgetForTests();
});
let touring = false;
function stubTour() {
  vi.stubGlobal('document', { documentElement: { classList: { contains: (c: string) => touring && c === 'tour-on' } } });
}
afterEach(() => vi.unstubAllGlobals());

describe('achievements during a tour', () => {
  it('counts nothing, and remember still answers', async () => {
    await loadAchievements();
    stubTour();
    touring = true;
    unlockAchievement('cast-visit');
    progress('heart-all', 24, 24);
    tally('export-all', 'web');
    await countOccurrence('won:x', 3);
    expect(await remember('played', 'x')).toEqual([]);
    touring = false;
    const r = await loadAchievements();
    expect(r.unlocked).toEqual({});
    expect(r.sets).toEqual({});
  });
});

describe('reset', () => {
  it('is not undone by a write queued just before it', async () => {
    await loadAchievements();
    unlockAchievement('cast-visit');
    await achievementsWritten();
    unlockAchievement('play-first'); // its write is still queued when the reset comes
    await resetAchievements();
    await achievementsWritten();
    expect((await loadAchievements()).unlocked).toEqual({});
    expect(JSON.parse(new TextDecoder().decode(saves['site:achievements']['achievements.json'])).unlocked).toEqual({});
  });
});
