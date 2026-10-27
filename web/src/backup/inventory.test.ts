// The backup's inventory against the code: every gm-* name in a file that uses browser storage
// must be a key some section backs up, a key marked not backed up, or one of the names below
// that aren't storage keys at all (events, CSS classes, a cache). Every IndexedDB database
// opened must be backed up or marked not, and each store's name and version must match its owner's.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DATABASES_NOT_BACKED_UP, KEYS_NOT_BACKED_UP, sectionOfKey, STORES, type StoreSpec } from './inventory';

const SRC = join(__dirname, '..');

/** gm-* names in storage-using files that are events, CSS classes or ids, not stored keys. */
const NOT_KEYS = new Set([
  'gm-theme-changed',
  'gm-pad-change',
  'gm-mug-change',
  'gm-score-trophies-changed',
  'gm-imported-notes-changed',
  'gm-tin-hearts-changed',
  'gm-eggs-changed',
  'gm-link',
  'gm-link-button',
  'gm-link-buttons',
  'gm-link-primary',
  'gm-not-dos-h',
  'gm-achievement',
  'gm-line-hint',
  'gm-line-warp',
  'gm-made-with',
  'gm-site', // the offline copy's cache name
  'gm-actions',
  'gm-pad',
  'gm-sys',
  'gm-touch',
  'gm-touch-hidden',
  'gm-touch-toggle',
  'gm-arrow',
  'gm-osk',
  'gm-osk-',
  'gm-osk-f',
  'gm-osk-full',
  'gm-osk-key',
  'gm-osk-nav',
  'gm-osk-open',
  'gm-osk-toggle',
  'gm-osk-abc',
  'gm-osk-row',
]);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return files(p);
    return /\.ts$/.test(name) && !/\.test\.ts$/.test(name) ? [p] : [];
  });
}

const sources = files(SRC)
  .filter((p) => !p.includes(`${join(SRC, 'backup')}`))
  .map((p) => ({ path: relative(SRC, p), text: readFileSync(p, 'utf8') }));

describe('backup inventory', () => {
  it('places every gm-* storage key', () => {
    const unplaced: string[] = [];
    for (const f of sources) {
      if (!/localStorage|sessionStorage|localJson/.test(f.text)) continue;
      for (const m of f.text.matchAll(/['"`](gm-[a-z0-9-]*)/g)) {
        const name = m[1];
        if (NOT_KEYS.has(name) || name in KEYS_NOT_BACKED_UP || sectionOfKey(name) || sectionOfKey(`${name}x`)) continue;
        unplaced.push(`${name} (${f.path})`);
      }
    }
    expect(unplaced, 'add these to a section in backup/inventory.ts, or to KEYS_NOT_BACKED_UP').toEqual([]);
  });

  it('places every IndexedDB database', () => {
    const backedUp = new Set(Object.values(STORES).map((s) => s.db));
    const unplaced: string[] = [];
    for (const f of sources) {
      if (!f.text.includes('indexedDB.open(')) continue;
      for (const m of f.text.matchAll(/DB_NAME\s*=\s*'([^']+)'/g))
        if (!backedUp.has(m[1]) && !(m[1] in DATABASES_NOT_BACKED_UP)) unplaced.push(`${m[1]} (${f.path})`);
    }
    expect(unplaced).toEqual([]);
  });

  it('opens each store as its owner does', () => {
    for (const s of Object.values(STORES) as StoreSpec[]) {
      const text = readFileSync(join(SRC, s.owner), 'utf8');
      expect(text, s.owner).toContain(`'${s.db}'`);
      expect(text, s.owner).toContain(`'${s.store}'`);
      expect(text, s.owner).toMatch(new RegExp(`DB_VERSION = ${s.version}\\b|indexedDB\\.open\\(DB_NAME, ${s.version}\\)`));
      if (s.keyPath) expect(text, s.owner).toContain(`keyPath: '${s.keyPath}'`);
    }
  });
});
