// whatsNew.ts: which steps are new since a day, the cap, damaged values, and the stored date.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHAPTERS } from './chapters/index';
import type { Chapter, TourStep } from './steps';
import { isDay, readSeen, SEEN_KEY, seenOnFirstVisit, writeSeen } from './seenDay';
import { MAX_NEW_STEPS, newChapters, whatsNew } from './whatsNew';

const step = (id: string, since?: string) => ({ id, since }) as TourStep;
const chapter = (id: string, steps: TourStep[]) => ({ id, steps }) as unknown as Chapter;

describe('whatsNew', () => {
  const chapters = [
    chapter('a', [step('a1'), step('a2', '2026-11-01'), step('a3', '2026-11-05')]),
    chapter('b', [step('b1', '2026-11-05'), step('b2', '2026-10-01')]),
  ];
  it('offers only steps after the last visit, newest first', () => {
    expect(whatsNew('2026-10-15', chapters).map((n) => n.step.id)).toEqual(['a3', 'b1', 'a2']);
  });
  it('offers nothing on the day itself, with no date, or with a damaged one', () => {
    expect(whatsNew('2026-11-05', chapters)).toEqual([]);
    expect(whatsNew(null, chapters)).toEqual([]);
    expect(whatsNew('yesterday', chapters)).toEqual([]);
  });
  it('stops at the cap', () => {
    const many = [
      chapter(
        'c',
        Array.from({ length: 12 }, (_, i) => step(`s${i}`, '2026-11-05')),
      ),
    ];
    expect(whatsNew('2026-01-01', many)).toHaveLength(MAX_NEW_STEPS);
    expect(whatsNew('2026-01-01', many, 3)).toHaveLength(3);
  });
});

describe('the real tour', () => {
  it('tags the six steps of 2026-11-05', () => {
    const ids = whatsNew('2026-11-04').map((n) => n.step.id);
    expect(ids).toHaveLength(6);
    expect(ids).toContain('home-how-do-i');
  });
  it('gives every since a real day that is not in the future', () => {
    const today = new Date().toISOString().slice(0, 10);
    for (const c of CHAPTERS) for (const s of c.steps) if (s.since !== undefined) expect(isDay(s.since) && s.since <= today, `${c.id}/${s.id}`).toBe(true);
  });
});

describe('newChapters', () => {
  it('keeps the opening, the view change before a new step, the new step and the goodbye', () => {
    const ch = {
      id: 'x',
      steps: [
        { id: 'hi', action: 'enter' },
        { id: 'old' },
        { id: 'go1', go: { hash: '#/a' } },
        { id: 'mid' },
        { id: 'new1', since: '2026-11-05' },
        { id: 'bye', action: 'exit' },
      ],
    } as unknown as Chapter;
    const out = newChapters(whatsNew('2026-11-01', [ch]), [ch]);
    expect(out).toHaveLength(1);
    expect(out[0].steps.map((s) => s.id)).toEqual(['hi', 'go1', 'new1', 'bye']);
  });
  it('plays something for every chapter with news in the real tour', () => {
    expect(
      newChapters(whatsNew('2026-11-04'))
        .map((c) => c.id)
        .sort(),
    ).toEqual(['edit-around', 'home']);
  });
});

describe('the stored date', () => {
  beforeEach(() => {
    const m = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), clear: () => m.clear() });
  });
  it('round-trips a day and ignores a damaged value', () => {
    expect(readSeen()).toBeNull();
    expect(writeSeen('2026-11-02')).toBe(true);
    expect(readSeen()).toBe('2026-11-02');
    localStorage.setItem(SEEN_KEY, '2026-13-45');
    expect(readSeen()).toBeNull();
  });
  it('sets today on the first visit and keeps the date after', () => {
    expect(seenOnFirstVisit()).toBeNull();
    expect(readSeen()).not.toBeNull();
    writeSeen('2026-11-02');
    expect(seenOnFirstVisit()).toBe('2026-11-02');
    expect(readSeen()).toBe('2026-11-02');
  });
});
