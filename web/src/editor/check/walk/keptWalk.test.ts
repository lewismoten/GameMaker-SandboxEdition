// What Make a walkthrough keeps: a partial walkthrough of the scenes the bot got through (and
// where it stopped), those scenes played again when it is made again, each scene's Mine or Bot
// choice, and a look-only game's walkthrough and plays kept in this browser apart from the game
// (forgotten when the game changes), carried into a copy of it.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../project/storage', () => ({
  saveProject: vi.fn(() => Promise.resolve()),
  newId: () => 'new-id',
  loadSaveData: () => Promise.resolve({}),
  writeSaveFile: () => Promise.resolve(),
}));

import { GameFiles } from '../../../project/files';
import { getSection } from '../../../project/companion';
import { serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { MLEN, newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { Project } from '../../core/project';
import { makeReadOnly } from '../../core/readOnly';
import { testGame, WALL } from '../testGame';
import { autoWalk } from './autoWalk';
import { howFar, keepFor, keepLookOnly, keptFor, reuseFrom, savedFrom, withKept, WALK_SECTION } from './keptWalk';
import { myPlays, playsToUse, usePlay, keepPlay } from './mine';
import { verifyWalk } from './verify';

// prettier-ignore
const OPEN = [
  '##############',
  '#............#',
  '#............#',
  '#S..........E#',
  '##############',
];

/** Two levels: the first open, the second with a wall the hero can't pass before its exit. */
function twoLevels() {
  const t = testGame(OPEN);
  const second = structuredClone(t.game.scenes[2]);
  second.desc = 'Walled';
  second.files[1] = 'walled.map';
  t.game.scenes[2].links[0] = { ...t.game.scenes[2].links[0], toScene: 3, to: t.game.scenes[0].links[0].to };
  t.game.scenes.push(second);
  const map = newMap();
  map.blocks.fill(WALL);
  OPEN.forEach((row, y) => [...row].forEach((ch, x) => ch !== '#' && (map.blocks[y * MLEN + x] = 0)));
  for (let y = 1; y <= 3; y++) map.blocks[y * MLEN + 7] = WALL;
  t.files.set('test.gam', serializeGame(t.game));
  t.files.set('walled.map', serializeMap(map));
  return t;
}

class MemoryStore {
  readonly m = new Map<string, string>();
  getItem = (k: string) => this.m.get(k) ?? null;
  setItem = (k: string, v: string) => void this.m.set(k, v);
  removeItem = (k: string) => void this.m.delete(k);
}

describe('a walkthrough the bot makes only partway', () => {
  it('keeps the scenes it got through, says where it stopped, and plays to there', async () => {
    const t = twoLevels();
    const r = await autoWalk(t.game, t, 'test', { budgetMs: 4000 });
    expect(r.won).toBe(false);
    expect(r.scenes.map((s) => [s.name, !!s.strategy])).toEqual([
      ['Level', true],
      ['Walled', false],
    ]);
    expect(r.walk).toMatchObject({ partial: true, ending: 'It found no way through Walled.', chapters: [{ scene: 2, title: 'Level' }] });
    expect(r.walk!.segments).toHaveLength(1);
    const v = await verifyWalk(new GameFiles(t.files), 'test.gam', r.walk!, { maxMinutes: 2 });
    expect(v.frames).toBeGreaterThan(0);

    const saved = savedFrom(r, v);
    expect(saved.scenes.some((s) => 'heat' in s)).toBe(false);
    expect(howFar(saved)).toMatchObject({ through: 1, stoppedIn: { name: 'Walled' } });

    // made again: the first scene is played with the same keys, without searching
    const reuse = reuseFrom(saved)!;
    expect(reuse).toEqual([{ scene: 2, keys: r.walk!.segments[0].keys, strategy: r.scenes[0].strategy, paths: undefined }]);
    const again = await autoWalk(t.game, t, 'test', { budgetMs: 4000, reuse });
    expect(again.scenes[0].tried).toEqual([r.scenes[0].strategy]);
    expect(again.walk!.segments[0].keys).toBe(r.walk!.segments[0].keys);
  }, 60_000);

  it('stopped, still keeps the scenes before', async () => {
    const t = twoLevels();
    let level = 0;
    // a play of the second scene, so it is told of that scene at once (a small search may never report)
    const r = await autoWalk(t.game, t, 'test', { budgetMs: 4000, mine: { 3: '' }, progress: (scene) => (level = scene) === 3 });
    expect(level).toBe(3);
    expect(r.stopped).toBe('Stopped.');
    expect(r.walk).toMatchObject({ partial: true, ending: 'It was stopped partway through Walled.' });
    expect(r.walk!.segments).toHaveLength(1);
  }, 60_000);

  it('plays nothing again when what was kept doesn’t line up', () => {
    expect(reuseFrom(undefined)).toBeUndefined();
    const saved = {
      when: '',
      won: false,
      scenes: [{ scene: 2, name: 'A', tried: [], strategy: 'runner' as const }],
      walk: { segments: [{ scene: 5, keys: '' }] } as never,
    };
    expect(reuseFrom(saved)).toBeUndefined();
  });
});

describe('each scene’s Mine or Bot', () => {
  it('is kept in the companion and steers which plays are used', () => {
    const t = testGame(OPEN);
    const p = Project.fromFiles(new GameFiles([...t.files]), 'Test', 'p1');
    keepPlay(p, { scene: 2, next: 1, keys: 'AQI=', ticks: 9 });
    expect(playsToUse(p)).toEqual({ 2: 'AQI=' });
    usePlay(p, 2, 'bot');
    expect(myPlays(p)[2].use).toBe('bot');
    expect(playsToUse(p)).toEqual({});
    expect(getSection(p.companion!, p.gam, 'myPlays', {})).toHaveProperty('2.use', 'bot');
  });
});

describe('a look-only game’s walkthrough', () => {
  const entry = { id: 'cave', pack: 'p1', gamCrc: 7, bytes: 100 };

  it('is kept in this browser apart from the game, and forgotten when the game changes', () => {
    const store = new MemoryStore();
    const t = testGame(OPEN);
    const p = Project.fromFiles(new GameFiles([...t.files]), 'Cave', 'look:cave');
    makeReadOnly(p, { title: 'Cave', attempted: () => undefined });
    const before = new Map(p.files.entries());
    expect(keepLookOnly(p, entry, store).keeps()).toBe(true);
    keepPlay(p, { scene: 2, next: 1, keys: 'AQI=', ticks: 9 });
    p.setExtras(p.gam, WALK_SECTION, { when: 'now', won: true, scenes: [] });
    expect(Object.keys(keptFor(entry, store)!).sort()).toEqual(['myPlays', 'walkthrough']);
    // the game's files are as they were
    expect(new Map(p.files.entries())).toEqual(before);

    // opened again: the walkthrough and plays are there
    const q = Project.fromFiles(new GameFiles([...t.files]), 'Cave', 'look:cave');
    keepLookOnly(q, entry, store);
    expect(q.extras(q.gam, WALK_SECTION, undefined)).toMatchObject({ won: true });
    expect(myPlays(q)[2].keys).toBe('AQI=');

    // a changed game starts again
    expect(keptFor({ ...entry, pack: 'p2' }, store)).toBeUndefined();
    // a copy carries them
    const copy = withKept(undefined, 'test.gam', entry, store)!;
    expect(getSection(copy, 'test.gam', WALK_SECTION, undefined)).toMatchObject({ won: true });
    // all gone: forgotten
    expect(keepFor(entry, { walkthrough: undefined, myPlays: undefined }, store)).toBe(true);
    expect(store.m.size).toBe(0);
  });

  it('says so when this browser won’t keep it', () => {
    const t = testGame(OPEN);
    const p = Project.fromFiles(new GameFiles([...t.files]), 'Cave', 'look:cave');
    const full = {
      getItem: () => null,
      setItem: () => {
        throw new Error('full');
      },
      removeItem: () => undefined,
    };
    const k = keepLookOnly(p, entry, full);
    p.setExtras(p.gam, WALK_SECTION, { when: 'now', won: true, scenes: [] });
    expect(k.keeps()).toBe(false);
  });
});
