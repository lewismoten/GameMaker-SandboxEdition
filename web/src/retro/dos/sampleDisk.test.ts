// The Sample Disk lists the six Starters, each in its own 8.3 folder with a .GAM file.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { CatalogEntry } from '../../project/files';
import { STARTER_ORDER } from '../../project/starter';
import { SAMPLE_DIRS, sampleFolders } from './sampleDisk';

/** A catalog entry as the build lists a Starter, read from the game's own about.json (STEPS.EXE plays STEPS.GAM). */
function entry(id: string): CatalogEntry {
  const about = JSON.parse(readFileSync(new URL(`../../../../games/${id}/about.json`, import.meta.url), 'utf8')) as {
    title: string;
    series: string;
    exe: string;
  };
  const gam = about.exe.replace(/\.exe$/i, '.gam').toLowerCase();
  return { id, title: about.title, series: about.series, original: {}, gam, exe: about.exe, files: [gam] } as unknown as CatalogEntry;
}

describe('the Sample Disk', () => {
  const catalog = [...STARTER_ORDER].reverse().map((id) => entry(id));
  const folders = sampleFolders(catalog);

  it('lists the six Starters in learning order', () => {
    expect(folders.map((f) => f.entry.id)).toEqual(STARTER_ORDER);
    expect(folders).toHaveLength(6);
  });

  it('gives each a different 8.3 folder name', () => {
    const names = folders.map((f) => f.dir);
    expect(names).toEqual(['FIRSTSTP', 'KEYSDOOR', 'MONSTERS', 'ROOMS', 'COINS', 'HAZARDS']);
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) expect(n).toMatch(/^[A-Z0-9_]{1,8}$/);
  });

  it('has a .GAM file in each', () => {
    for (const f of folders) expect(f.entry.gam).toMatch(/^[a-z0-9_]{1,8}\.gam$/);
  });

  it('names every Starter in STARTER_ORDER', () => {
    expect(Object.keys(SAMPLE_DIRS).sort()).toEqual([...STARTER_ORDER].sort());
  });

  it('leaves out games that are not Starters (a secret game, a Sandbox game)', () => {
    const other = { ...entry('first-steps'), id: 'other', series: undefined } as CatalogEntry;
    expect(sampleFolders([other, ...catalog]).map((f) => f.entry.id)).toEqual(STARTER_ORDER);
  });

  it('gives a Starter added later a name of its own that fits 8.3', () => {
    const later = [
      { ...entry('first-steps'), id: 'long-new-starter' },
      { ...entry('first-steps'), id: 'long-new-starter-2' },
    ] as CatalogEntry[];
    const names = sampleFolders([...catalog, ...later]).map((f) => f.dir);
    expect(new Set(names).size).toBe(8);
    for (const n of names) expect(n).toMatch(/^[A-Z0-9_~]{1,8}$/);
  });
});
