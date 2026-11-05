// The Sample Disk lists the built Starters, each in its own 8.3 folder with a .GAM file.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { CatalogEntry } from '../../project/files';
import { STARTER_ORDER } from '../../project/starter';
import { SAMPLE_DISK_COUNT, floppyFolders, sampleFolders } from './sampleDisk';

/** A catalog entry as the build lists a Starter, read from the game's own about.json (STEPS.EXE plays STEPS.GAM). */
function entry(id: string): CatalogEntry {
  const about = JSON.parse(readFileSync(new URL(`../../../../games/${id}/about.json`, import.meta.url), 'utf8')) as {
    title: string;
    series: string;
    exe: string;
    dosName?: string;
  };
  const gam = about.exe.replace(/\.exe$/i, '.gam').toLowerCase();
  return { id, title: about.title, series: about.series, original: {}, gam, exe: about.exe, dosName: about.dosName, files: [gam] } as unknown as CatalogEntry;
}

/** The Starters that are built so far (STARTER_ORDER also lists ones planned). */
const BUILT = STARTER_ORDER.filter((id) => existsSync(new URL(`../../../../games/${id}/about.json`, import.meta.url)));

describe('the Sample Disk', () => {
  const catalog = [...BUILT].reverse().map((id) => entry(id));
  const folders = sampleFolders(catalog);

  it('lists every built Starter in learning order', () => {
    expect(folders.map((f) => f.entry.id)).toEqual(BUILT);
    expect(folders.length).toBeGreaterThanOrEqual(8);
  });

  it('puts only the first three on the diskette, all of them on the CD', () => {
    expect(floppyFolders(catalog).map((f) => f.entry.id)).toEqual(BUILT.slice(0, SAMPLE_DISK_COUNT));
    expect(SAMPLE_DISK_COUNT).toBe(3);
  });

  it('gives each a different 8.3 folder name', () => {
    const names = folders.map((f) => f.dir);
    expect(names.slice(0, 10)).toEqual(['FIRSTSTP', 'KEYSDOOR', 'MONSTERS', 'ROOMS', 'COINS', 'SMASHIT', 'DIGIT', 'HAZARDS', 'POWERUP', 'THROWIT']);
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) expect(n).toMatch(/^[A-Z0-9_]{1,8}$/);
  });

  it('has a .GAM file in each', () => {
    for (const f of folders) expect(f.entry.gam).toMatch(/^[a-z0-9_]{1,8}\.gam$/);
  });

  it('takes every Starter folder from its dosName', () => {
    expect(folders.map((f) => f.dir)).toEqual(folders.map((f) => f.entry.dosName));
  });

  it('leaves out games that are not Starters (a secret game, a Sandbox game)', () => {
    const other = { ...entry('first-steps'), id: 'other', series: undefined } as CatalogEntry;
    expect(sampleFolders([other, ...catalog]).map((f) => f.entry.id)).toEqual(BUILT);
  });

  it('gives a Starter added later a name of its own that fits 8.3', () => {
    const later = [
      { ...entry('first-steps'), dosName: undefined, id: 'long-new-starter' },
      { ...entry('first-steps'), dosName: undefined, id: 'long-new-starter-2' },
    ] as CatalogEntry[];
    const names = sampleFolders([...catalog, ...later]).map((f) => f.dir);
    expect(new Set(names).size).toBe(catalog.length + 2);
    for (const n of names) expect(n).toMatch(/^[A-Z0-9_~]{1,8}$/);
  });
});
