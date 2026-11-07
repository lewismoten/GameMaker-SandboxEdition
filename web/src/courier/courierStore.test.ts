// The courier's mail store and tables: letters come once, only through deliver(), deleting one
// never brings it back, bad saved data is dropped, the Quiet switch keeps the buddy's other
// fields, and nothing in the tables pushes play or names a secret game.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { deleteLetter, deliver, delivered, hasNewMail, loadCourier, loadQuiet, markRead, saveQuiet, waitingLetter } from './courierStore';
import { FARAWAY, LETTERS, PHRASES, STAMP_WORDS, WORLDS, worldName } from './tables';

const stored = new Map<string, string>();
beforeEach(() => {
  stored.clear();
  vi.useFakeTimers();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => stored.get(k) ?? null,
    setItem: (k: string, v: string) => stored.set(k, v),
    removeItem: (k: string) => stored.delete(k),
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('courier mail store', () => {
  it('starts empty, and no letter arrives on its own, however long it waits', () => {
    expect(loadCourier()).toEqual({ mail: [], got: [], postcards: [], packages: [] });
    vi.advanceTimersByTime(30 * 24 * 3600_000);
    expect(loadCourier().mail).toEqual([]);
    expect(hasNewMail()).toBe(false);
  });

  it('delivers a letter once, newest first, and marks it read', () => {
    expect(deliver('bbs-sandbox', '1994-11-07')).toBe(true);
    expect(deliver('bbs-sandbox', '1994-11-08')).toBe(false);
    expect(deliver('bbs-sofa', '1994-11-08')).toBe(true);
    expect(loadCourier().mail.map((m) => m.id)).toEqual(['bbs-sofa', 'bbs-sandbox']);
    expect(hasNewMail()).toBe(true);
    markRead('bbs-sofa');
    markRead('bbs-sandbox');
    expect(hasNewMail()).toBe(false);
  });

  it('never brings a deleted letter back', () => {
    deliver('bbs-sofa', '1994-11-07');
    deleteLetter('bbs-sofa');
    expect(loadCourier().mail).toEqual([]);
    expect(delivered('bbs-sofa')).toBe(true);
    expect(deliver('bbs-sofa', '1994-11-08')).toBe(false);
    expect(waitingLetter('SOFA')).toBeUndefined();
  });

  it('refuses letters the table does not have, and drops them from saved data', () => {
    expect(deliver('not-a-letter', '1994-11-07')).toBe(false);
    stored.set(
      'gm-courier',
      JSON.stringify({
        mail: [{ id: 'nope', day: 'x' }, { id: 'bbs-sofa', day: '1994-11-07', read: 'yes' }, 7],
        postcards: [{ world: 2, stamps: [{ kind: 'game', game: 'snow' }, { kind: 'mystery', game: 'leak' }, { kind: 'weird' }] }, { world: 'x' }],
        packages: ['a', 'b', 'c', 'd'],
      }),
    );
    const c = loadCourier();
    expect(c.mail).toEqual([{ id: 'bbs-sofa', day: '1994-11-07', read: false }]);
    // a mystery stamp keeps no id, whatever was saved
    expect(c.postcards).toEqual([{ world: 2, stamps: [{ kind: 'game', game: 'snow' }, { kind: 'mystery' }] }]);
    expect(c.packages).toHaveLength(3);
    stored.set('gm-courier', 'not json');
    expect(loadCourier().mail).toEqual([]);
  });

  it('the Quiet switch keeps what else the desk buddy remembers', () => {
    stored.set('gm-desk-buddy', JSON.stringify({ met: true, helloDay: '2026-11-07' }));
    expect(loadQuiet()).toBe(false);
    saveQuiet(true);
    expect(JSON.parse(stored.get('gm-desk-buddy')!)).toEqual({ met: true, helloDay: '2026-11-07', quiet: true });
    expect(loadQuiet()).toBe(true);
  });
});

describe('courier tables', () => {
  const words = (): string[] => [...WORLDS, ...PHRASES, ...Object.values(STAMP_WORDS), ...LETTERS.flatMap((l) => [l.from, l.subject, ...l.body])];

  it('one letter per board, with a DOS packet name', () => {
    expect(new Set(LETTERS.map((l) => l.board)).size).toBe(LETTERS.length);
    for (const l of LETTERS) expect(l.packet).toMatch(/^[A-Z0-9]{1,8}\.QWK$/);
  });

  it('an unknown world id is a plain placeholder', () => {
    expect(worldName(0)).toBe(WORLDS[0]);
    expect(worldName(999)).toBe(FARAWAY);
  });

  it('never pushes play, grades or totals, and keeps letters short', () => {
    const pushy =
      /\b(should|must|try|come back|don't forget|tomorrow|daily|streak|perfect|grade|gpa|percent|left|remaining|of \d|hurry|miss(ed)? you|lonely|sad|hungry|honors)\b|%/i;
    for (const w of words()) expect(w, w).not.toMatch(pushy);
    for (const l of LETTERS) expect(l.body.join(' ').split(/\s+/).length, l.id).toBeLessThanOrEqual(70);
    // one voice, US English
    for (const w of words()) expect(w, w).not.toMatch(/\b(colour|favourite|centre|grey)\b/i);
  });

  it('names no secret game', () => {
    const games = resolve(__dirname, '../../../games');
    const secret: string[] = [];
    for (const id of readdirSync(games)) {
      const f = resolve(games, id, 'about.json');
      if (!existsSync(f)) continue;
      const about = JSON.parse(readFileSync(f, 'utf8')) as { secret?: boolean; title?: string };
      if (about.secret) secret.push(id, ...(about.title ? [about.title] : []));
    }
    expect(secret.length).toBeGreaterThan(0);
    const text = words().join('\n').toLowerCase();
    for (const s of secret) expect(text.includes(s.toLowerCase()), 'a secret game is named').toBe(false);
  });
});
