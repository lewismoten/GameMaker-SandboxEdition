// SPECIALS.EXE: listing, LOCK, UNLOCK, RESET and DATE, all in localStorage.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { specialsCommand } from './specialsExe';
import { forced, isListed, keepSpecial, keptHow } from './state';
import { specialsNow } from './clock';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  });
  vi.stubGlobal('window', new EventTarget());
});
afterEach(() => vi.unstubAllGlobals());

describe('SPECIALS', () => {
  it('lists every Special on the test date, each line within 80 columns', () => {
    expect(specialsCommand(['DATE', '2026-11-11'])).toEqual(['The Specials go by 2026-11-11 now.']);
    const out = specialsCommand([]);
    expect(out[0]).toBe('Specials on Nov 11 2026 (test date)');
    expect(out.find((l) => l.startsWith('thank-you-parade'))).toContain('out until Nov 12 2026');
    expect(out.find((l) => l.startsWith('pass-the-pie'))).toContain('next Nov 26 2026');
    for (const l of out) expect(l.length).toBeLessThanOrEqual(80);
  });

  it('LOCKs, UNLOCKs and RESETs one, and says so', () => {
    expect(specialsCommand(['lock', 'LUCKY-CAT'])[0]).toMatch(/^lucky-cat: LOCKED/);
    expect(forced('lucky-cat')).toBe('lock');
    expect(specialsCommand(['UNLOCK', 'pass-the-pie'])[0]).toMatch(/^pass-the-pie: UNLOCKED/);
    expect(isListed('pass-the-pie', new Date(2026, 5, 1))).toBe(true);
    keepSpecial('pass-the-pie', 'played');
    specialsCommand(['RESET', 'pass-the-pie']);
    expect(keptHow('pass-the-pie')).toBeUndefined();
    expect(forced('pass-the-pie')).toBeUndefined();
    expect(specialsCommand(['LOCK', 'snowbound'])[0]).toMatch(/^No Special called snowbound/);
  });

  it('RESET ALL forgets everything and the test date; a bad date is refused', () => {
    specialsCommand(['DATE', '2026-11-26T07:30']);
    expect(specialsNow().getHours()).toBe(7);
    expect(specialsCommand(['DATE', '2026-02-30'])[0]).toMatch(/^Invalid date/);
    specialsCommand(['LOCK', 'lucky-cat']);
    specialsCommand(['RESET', 'ALL']);
    expect(store.size).toBe(0);
    expect(specialsCommand(['/?'])[0]).toBe('Tests the Specials, the limited-time games.');
  });
});
