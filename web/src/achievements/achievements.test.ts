// The achievements' bookkeeping: unlocks happen once and keep their first date, progress
// unlocks at the end and never goes back, the record survives a fresh read, derived totals
// come from the catalog, and nothing in the catalog gives away a game kept out of sight.
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const saves: Record<string, Record<string, Uint8Array>> = {};
const writes: { id: string; quiet?: boolean }[] = [];
vi.mock('../project/storage', () => ({
  loadSaveData: async (id: string) => ({ ...(saves[id] ?? {}) }),
  writeSaveFile: async (id: string, name: string, bytes: Uint8Array, o: { quiet?: boolean } = {}) => {
    writes.push({ id, quiet: o.quiet });
    (saves[id] ??= {})[name] = bytes;
  },
}));

import { ACHIEVEMENTS, CATEGORIES, DESK_PROPS, achievementById, shownText } from './catalog';
import {
  FILE,
  SAVE_ID,
  achievementsWritten,
  forgetForTests,
  loadAchievements,
  mergeRecords,
  parseRecord,
  progress,
  resetAchievements,
  tally,
  unlockAchievement,
} from './store';
import { goalProgress, goalTargets } from './goals';

const stored = () => parseRecord(saves[SAVE_ID]?.[FILE]);

beforeEach(() => {
  for (const k of Object.keys(saves)) delete saves[k];
  writes.length = 0;
  forgetForTests();
});

describe('achievements store', () => {
  it('unlocks once, keeps the first date and writes quietly', async () => {
    unlockAchievement('play-first');
    await loadAchievements();
    await achievementsWritten();
    const first = stored().unlocked['play-first'];
    expect(first).toBeTypeOf('number');
    const n = writes.length;
    unlockAchievement('play-first');
    unlockAchievement('play-first');
    await achievementsWritten();
    expect(writes.length).toBe(n);
    expect(stored().unlocked['play-first']).toBe(first);
    expect(writes.every((w) => w.id === SAVE_ID && w.quiet)).toBe(true);
  });

  it('ignores unknown ids', async () => {
    unlockAchievement('no-such-thing');
    await loadAchievements();
    await achievementsWritten();
    expect(Object.keys(stored().unlocked)).toEqual([]);
  });

  it('survives a fresh read', async () => {
    unlockAchievement('desk-power');
    await loadAchievements();
    await achievementsWritten();
    forgetForTests();
    const r = await loadAchievements();
    expect(r.unlocked['desk-power']).toBeTypeOf('number');
  });

  it('unlocks progress at the end, and progress never goes back', async () => {
    await loadAchievements();
    progress('heart-all', 3, 24);
    expect((await loadAchievements()).unlocked['heart-all']).toBeUndefined();
    progress('heart-all', 2, 24);
    expect((await loadAchievements()).progress['heart-all']).toEqual({ n: 3, of: 24 });
    progress('heart-all', 24, 24);
    await achievementsWritten();
    expect(stored().unlocked['heart-all']).toBeTypeOf('number');
  });

  it('tallies items toward a fixed total, once each, only the ones that count', async () => {
    await loadAchievements();
    for (const k of ['web', 'web', 'files', 'dos', 'windows', 'mac']) tally('export-all', k);
    let r = await loadAchievements();
    expect(r.progress['export-all']).toEqual({ n: 4, of: 5 });
    expect(r.unlocked['export-all']).toBeUndefined();
    tally('export-all', 'linux');
    r = await loadAchievements();
    expect(r.unlocked['export-all']).toBeTypeOf('number');
  });

  it('merges another tab’s record: earliest dates, furthest progress, every item', () => {
    const a = { unlocked: { x: 5 }, progress: { p: { n: 2, of: 5 } }, sets: { s: ['a'] } };
    const b = { unlocked: { x: 3, y: 9 }, progress: { p: { n: 4, of: 5 } }, sets: { s: ['b', 'a'] } };
    expect(mergeRecords(a, b)).toEqual({ unlocked: { x: 3, y: 9 }, progress: { p: { n: 4, of: 5 } }, sets: { s: ['a', 'b'] } });
  });

  it('reads a broken file as empty', () => {
    expect(parseRecord(new TextEncoder().encode('{nope'))).toEqual({ unlocked: {}, progress: {}, sets: {} });
  });

  it('resets', async () => {
    unlockAchievement('cast-visit');
    await loadAchievements();
    await resetAchievements();
    expect(stored().unlocked).toEqual({});
  });
});

describe('achievements catalog', () => {
  it('has unique ids, a known category and text for each', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    const cats = new Set(CATEGORIES.map((c) => c.id));
    for (const a of ACHIEVEMENTS) {
      expect(cats.has(a.category)).toBe(true);
      expect(a.title && a.desc && a.icon).toBeTruthy();
      if (a.hidden) expect(a.hint).toBeTruthy();
      if (a.items) expect(a.items.length).toBe(a.of);
    }
  });

  it('lists the desk props as hidden finds', () => {
    for (const id of DESK_PROPS) expect(achievementById(id)?.hidden).toBe(true);
  });

  it('hides a hidden one’s text until it is unlocked', () => {
    const egg = achievementById('egg-all')!;
    expect(shownText(egg, false).title).toBe('???');
    expect(shownText(egg, false).desc).not.toContain(egg.desc);
    expect(shownText(egg, true).title).toBe(egg.title);
  });

  it('names no game kept out of sight', () => {
    // every games/<id> whose about.json says "secret": true: neither its id nor its title may appear
    const root = join(__dirname, '../../../games');
    const words: string[] = [];
    for (const id of existsSync(root) ? readdirSync(root) : []) {
      const about = join(root, id, 'about.json');
      if (!existsSync(about)) continue;
      const a = JSON.parse(readFileSync(about, 'utf8'));
      if (a.secret) words.push(id, ...(a.title ? [a.title] : []));
    }
    const text = JSON.stringify(ACHIEVEMENTS).toLowerCase() + readFileSync(join(__dirname, 'catalog.ts'), 'utf8').toLowerCase();
    for (const w of words) expect(text).not.toContain(w.toLowerCase());
  });
});

describe('where they fire', () => {
  // every id the site fires by name: unlockAchievement('x'), progress('x', …), tally('x', …),
  // a prop's achieve('x') or pressable(…, { id: 'x' }), and a gm-achievement event's detail
  const src = join(__dirname, '..');
  const fired = new Set<string>();
  const walk = (dir: string) => {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (/\.ts$/.test(f.name) && !/\.test\.ts$/.test(f.name)) {
        const text = readFileSync(p, 'utf8');
        const res = [
          /\b(?:unlockAchievement|achieve|progress|tally)\('([\w-]+)'/g,
          /\{ id: '([\w-]+)'(?:, title|\s*\})/g,
          /detail: \{ id: '([\w-]+)' \}/g,
          /^\s*\w+: '(desk-[\w-]+)',$/gm, // DESK_PROGRAMS
        ];
        for (const re of res) for (const m of text.matchAll(re)) fired.add(m[1]);
      }
    }
  };
  walk(src);

  it('fires only ids the catalog has', () => {
    const unknown = [...fired].filter((id) => /^(desk|bbs|tty|check|make|watch|print|play|link)-/.test(id) && !achievementById(id));
    expect(unknown).toEqual([]);
  });

  it('fires every achievement somewhere', () => {
    // the ones fired from a computed id or a count: the Download chooser's export-<kind>, the
    // derived totals, and the tin hearts and felt eggs counted in start.ts
    const counted = (id: string) => /^export-/.test(id) || !!achievementById(id)?.from || /^(heart|egg)-/.test(id);
    const never = ACHIEVEMENTS.filter((a) => !fired.has(a.id) && !counted(a.id)).map((a) => a.id);
    expect(never).toEqual([]);
  });
});

describe('derived totals', () => {
  const catalog = [
    { id: 'a', original: {}, company: 'Sandbox Software', walkthrough: 'w/a.json' },
    { id: 'b', original: {} },
    { id: 'c', original: {}, series: 'bizarre', company: 'The Bard of Bizarre', walkthrough: 'w/c.json' },
    { id: 'd' },
  ] as never[];

  it('counts Sandbox, Bizarre and walkthrough games from the catalog', () => {
    expect(goalTargets(catalog, 'sandbox')).toEqual(['a', 'b']);
    expect(goalTargets(catalog, 'bizarre')).toEqual(['c']);
    expect(goalTargets(catalog, 'walkthroughs')).toEqual(['a', 'c']);
  });

  it('counts every listed Teddy game, so a new one in the catalog raises the total', () => {
    const teddies = [
      { id: 'teddy', original: {}, company: 'Sandbox Software' },
      { id: 'teddy2', original: {}, company: 'Sandbox Software' },
      { id: 'teddyfan', original: {}, company: 'Sandbox Software' },
      { id: 'teddy4' },
    ] as never[];
    expect(goalTargets(teddies, 'teddy')).toEqual(['teddy', 'teddy2']);
    expect(goalTargets([...teddies, { id: 'teddy3', original: {}, company: 'Sandbox Software' }] as never[], 'teddy')).toEqual(['teddy', 'teddy2', 'teddy3']);
    expect(goalProgress(goalTargets(teddies, 'teddy'), ['teddy'])).toEqual({ n: 1, of: 2 });
  });

  it('counts only listed games as done (one played but not listed adds nothing)', () => {
    expect(goalProgress(goalTargets(catalog, 'sandbox'), ['a', 'zz', 'd'])).toEqual({ n: 1, of: 2 });
  });
});
