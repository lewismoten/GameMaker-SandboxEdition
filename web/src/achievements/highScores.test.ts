// The live web/desk save hook must check the stored table after the name prompt's write.
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { serializeHighScores } from '@lewismoten/gamemaker-sandbox-engine/formats/highscore';

const state = vi.hoisted((): { saves: Record<string, Record<string, Uint8Array>>; writes: string[]; fail: boolean } => ({
  saves: {},
  writes: [],
  fail: false,
}));
vi.mock('../project/storage', () => ({
  loadSaveData: async (id: string) => ({ ...state.saves[id] }),
  listProjects: async () => [{ id: 'mine', gam: 'OWN.GAM' }],
  writeSaveFile: async (id: string, name: string, bytes: Uint8Array) => {
    if (state.fail) return;
    state.writes.push(id);
    (state.saves[id] ??= {})[name] = bytes;
  },
}));
vi.mock('../project/files', async (original) => ({
  ...(await original<object>()),
  loadCatalogList: async () => [
    { id: 'one', gam: 'ONE.GAM' },
    { id: 'two', gam: 'ONE.GAM' },
  ],
}));
vi.mock('../tinHearts/tinHearts', () => ({ huntStates: async () => [] }));
vi.mock('../eggs/eggState', () => ({ eggStates: async () => [] }));
import { playSaves } from './playSaves';
import { achievementsWritten, forgetForTests, loadAchievements, resetAchievements, FILE, SAVE_ID } from './store';
import { scanHighScores } from './highScores';
import { wholeTable } from './highScoreTable';
import { achievements as backupAchievements } from '../backup/sections/achievements';
import { emptyWorld } from '../backup/world';

const table = () => serializeHighScores(Array.from({ length: 10 }, (_, i) => ({ score: 100 - i, name: 'Lewis' })));
afterEach(() => vi.unstubAllGlobals());
beforeEach(() => {
  state.saves = {};
  state.writes = [];
  state.fail = false;
  forgetForTests();
});

it('persists the final high-score write and unlocks from that stored table', async () => {
  const hooks = playSaves('game:one', 'ONE.GAM');
  await hooks.onFileWrite!('one.his', table());
  await achievementsWritten();
  expect(state.saves['game:one']['one.his']).toEqual(table());
  expect((await loadAchievements()).unlocked['play-all-mine']).toBeTypeOf('number');
});

it('matches trimmed mixed case without changing names, and allows displayed nonzero negative scores', () => {
  const bytes = serializeHighScores(Array.from({ length: 10 }, (_, i) => ({ score: -1, name: i % 2 ? ' LEWIS ' : 'lewis' })));
  const before = bytes.slice();
  expect(wholeTable(bytes)).toBeTypeOf('string');
  expect(bytes).toEqual(before);
});

it('rejects mixed names, internal-space differences, zero scores, blank names and truncated slots', () => {
  for (const other of ['Else', 'Lew is', '', '   ']) {
    const rows = Array.from({ length: 10 }, () => ({ score: 10, name: 'Lewis' }));
    rows[9].name = other;
    expect(wholeTable(serializeHighScores(rows))).toBeUndefined();
  }
  expect(wholeTable(serializeHighScores(Array.from({ length: 10 }, () => ({ score: 0, name: 'Player' }))))).toBeUndefined();
  for (let n = 0; n < 10; n++) {
    expect(wholeTable(serializeHighScores(Array.from({ length: n }, () => ({ score: 1, name: 'Lewis' }))))).toBeUndefined();
  }
  expect(wholeTable(table().slice(0, 339))).toBeUndefined();
  expect(wholeTable()).toBeUndefined();
});

it('does not pool partial games or count another .his file, a bundle, or a save slot', async () => {
  const partial = serializeHighScores(Array.from({ length: 5 }, () => ({ score: 1, name: 'Lewis' })));
  state.saves['game:one'] = { 'one.his': partial, 'other.his': table(), 'game0.sav': table() };
  state.saves['game:two'] = { 'one.his': partial };
  state.saves['bundle:one'] = { 'one.his': table() };
  await scanHighScores();
  await playSaves('bundle:one', 'one.gam').onFileWrite!('one.his', table());
  expect((await loadAchievements()).unlocked['play-all-mine']).toBeUndefined();
  expect(playSaves(undefined, 'one.gam').onFileWrite).toBeUndefined();
});

it('does not award unpersisted bytes after a failed write', async () => {
  state.fail = true;
  await playSaves('game:one', 'one.gam').onFileWrite!('one.his', table());
  expect((await loadAchievements()).unlocked['play-all-mine']).toBeUndefined();
});

it('initial scan and player-open checks find saved tables and preserve the first unlock through reload and backup', async () => {
  state.saves['game:two'] = { 'ONE.HIS': table() };
  await scanHighScores();
  await achievementsWritten();
  const first = (await loadAchievements()).unlocked['play-all-mine'];
  expect(first).toBeTypeOf('number');
  const count = state.writes.length;
  await Promise.all([scanHighScores(), scanHighScores()]);
  await achievementsWritten();
  expect(state.writes).toHaveLength(count);
  const payload = { files: { [FILE]: state.saves[SAVE_ID][FILE] } };
  expect(backupAchievements.count(payload)).toBe(1);
  const merged = backupAchievements.merge({ files: {} }, payload, {
    world: emptyWorld(),
    projects: {},
    slots: 'mine',
    idMap: {},
    now: 0,
    newId: () => 'unused',
  });
  expect(backupAchievements.count(merged)).toBe(1);
  forgetForTests();
  expect((await loadAchievements()).unlocked['play-all-mine']).toBe(first);
  delete state.saves[SAVE_ID];
  forgetForTests();
  playSaves('game:two', 'ONE.GAM');
  await vi.waitFor(async () => expect((await loadAchievements()).unlocked['play-all-mine']).toBeTypeOf('number'));
  await achievementsWritten();
});

it('keeps unchanged tables forgotten after Reset and reload, but counts a changed qualifying table', async () => {
  state.saves['game:one'] = { 'one.his': table() };
  await scanHighScores();
  await achievementsWritten();
  await resetAchievements();
  forgetForTests();
  await scanHighScores();
  expect((await loadAchievements()).unlocked['play-all-mine']).toBeUndefined();
  const changed = table();
  new DataView(changed.buffer).setInt32(0, 200, true);
  await playSaves('game:one', 'one.gam').onFileWrite!('one.his', changed);
  expect((await loadAchievements()).unlocked['play-all-mine']).toBeTypeOf('number');
  await achievementsWritten();
});

it('keeps the ordinary F5 save achievement on the shared hook', async () => {
  await playSaves('project:mine', 'own.gam').onFileWrite!('game0.sav', new Uint8Array());
  expect((await loadAchievements()).unlocked['play-save']).toBeTypeOf('number');
  await achievementsWritten();
});

it('includes own-game overlays on reload and does not reserve common player names', async () => {
  state.saves['project:mine'] = { 'own.his': serializeHighScores(Array.from({ length: 10 }, () => ({ score: 1, name: 'Player' }))) };
  await scanHighScores();
  expect((await loadAchievements()).unlocked['play-all-mine']).toBeTypeOf('number');
  await achievementsWritten();
});

it('does not unlock while the guided tour is playing', async () => {
  vi.stubGlobal('document', { documentElement: { classList: { contains: () => true } } });
  await playSaves('game:one', 'one.gam').onFileWrite!('one.his', table());
  await scanHighScores();
  expect((await loadAchievements()).unlocked['play-all-mine']).toBeUndefined();
});
