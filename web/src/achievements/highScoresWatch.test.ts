// Exercise the real deferred watcher on main/desk: initial saved data and later save events.
import { afterEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ scans: 0 }));
vi.mock('./highScores', () => ({
  scanHighScores: async () => {
    state.scans++;
  },
}));
vi.mock('./store', () => ({
  loadAchievements: async () => ({}),
  currentAchievements: () => ({}),
  listenToOtherTabs: () => {},
  progress: () => {},
  tally: () => {},
  unlockAchievement: () => {},
}));
vi.mock('./goals', () => ({ refreshGoals: async () => {} }));
vi.mock('../tinHearts/tinHearts', () => ({ huntStates: async () => [], watchHearts: () => {} }));
vi.mock('../eggs/eggState', () => ({ eggStates: async () => [], EGGS_CHANGED: 'eggs' }));
vi.mock('../eggs/teddyEgg', () => ({ laidFromSaves: () => false }));
vi.mock('../project/storage', () => ({ SAVES_CHANGED: 'gm-saves-changed' }));
vi.mock('../project/catalogWatch', () => ({ CATALOG_CHANGED: 'catalog' }));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it('scans at startup and coalesces save changes', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('window', new EventTarget());
  const { startAchievements } = await import('./start');
  startAchievements();
  startAchievements();
  await vi.advanceTimersByTimeAsync(1500);
  expect(state.scans).toBe(1);
  window.dispatchEvent(new Event('gm-saves-changed'));
  window.dispatchEvent(new Event('gm-saves-changed'));
  await vi.advanceTimersByTimeAsync(600);
  expect(state.scans).toBe(2);
});
