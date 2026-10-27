// Tests for the backup: a file made and read back, merges, untouched sections, partial and
// damaged files. On plain in-memory worlds (world.ts), so no browser storage is needed.
import { describe, expect, it } from 'vitest';
import { createZip } from '../project/zip';
import { parseHighScoreTable, serializeHighScoreTable } from '../project/saveData/highScores';
import { parseSlotNames, serializeSlotNames } from '../project/saveData/saveGame';
import { FORMAT, FORMAT_VERSION, makeBackup, readBackup, snapshot } from './file';
import { SECTION_IDS } from './sections';
import { planImport, projectClashes, type ImportChoices, type Mode } from './plan';
import { BackupError } from './sections/types';
import { emptyWorld, worldDiff, type World } from './world';
import type { SectionId } from './inventory';

const enc = (o: unknown) => new TextEncoder().encode(JSON.stringify(o));
const bytes = (...n: number[]) => new Uint8Array(n);
const saveWith = (inv: number[]) => enc({ version: 1, doscene: 1, world: { ci: { inv, meter: [0, 0] } } });
const his = (entries: [number, string][]) =>
  serializeHighScoreTable({ entries: [...entries, ...Array(10).fill([0, ''])].slice(0, 10).map(([score, name]) => ({ score, name })) });

let n = 0;
const ids = () => `new-${++n}`;

function seeded(): World {
  const w = emptyWorld();
  const all256 = new Uint8Array(256).map((_, i) => i);
  w.stores.projects.p1 = {
    id: 'p1',
    name: 'My Game',
    gam: 'MINE.GAM',
    updated: 5,
    files: { 'MINE.GAM': all256, 'A.PIC': bytes(9, 8) },
    companion: { todo: [{ text: 'fix' }] },
  };
  w.stores.projects.imp = { id: 'imp', name: 'Their Game', gam: 'T.GAM', updated: 6, files: { 'T.GAM': bytes(7) } };
  w.local['gm-project-source'] = JSON.stringify({ imp: 'imported' });
  w.local['gm-project-origin'] = JSON.stringify({ p1: 'nebula', imp: 'x' });
  w.local['gm-next-hidden-p1'] = '1';
  w.stores.saves['game:blaster'] = {
    'game0.sav': saveWith([149]),
    'savnames.dat': serializeSlotNames(['first']),
    'blaster.his': his([[500, 'ANN']]),
    'tinheart.dat': enc({ found: '2026-01-01T00:00:00Z', scene: 1, at: [1, 2] }),
  };
  w.stores.saves['project:p1'] = { 'game3.sav': bytes(0, 255, 1) };
  w.stores.saves['project:imp'] = { 'game0.sav': bytes(1) };
  w.stores.saves['site:achievements'] = { 'achievements.json': enc({ unlocked: { a: 1, b: 2 }, progress: {}, sets: {} }) };
  w.stores.saves['site:scores'] = { 'scores.json': enc({ best: { blaster: 500 }, total: 900, plays: 3 }) };
  w.stores.saveBackups.b1 = { id: 'b1', game: 'game:blaster', when: 1, label: 'x', files: { 'game1.sav': bytes(3) } };
  w.stores.desk.C = { ids: [['zark', 10]], deleted: ['zark/README'], dirs: [['IMAGES', 11]] };
  w.stores.desk.EXTRAS = { serial: 'GM-1234', raw: bytes(1, 2, 3) };
  w.local['gm-eggs'] = JSON.stringify({ brief: 'added' });
  w.local['gm-egg-taps'] = '4';
  w.local['gm-clock-pops'] = '2';
  w.local['gm-reg-mail'] = '{"a":1}';
  w.local['gm-bbs-sandbox-user'] = '{"points":7}';
  w.local['gm-imported-notes'] = JSON.stringify({ imp: { rating: 4, note: 'fun', fingerprint: { gam: [123] }, edited: 50 } });
  w.local['gm-removed-games'] = JSON.stringify([{ id: 'old', name: 'Old', fingerprint: { gam: [9] }, rating: 2, removed: 3 }]);
  w.local['gm-theme'] = 'dark';
  w.local['gm-library-only-type'] = 'maps';
  w.local['gm-ai-settings'] = JSON.stringify({ provider: 'openai', baseUrl: 'https://x/v1', model: 'm', apiKey: 'sk-secret' });
  w.local['gm-offline'] = 'started';
  return w;
}

async function backupOf(w: World, only: readonly SectionId[] = SECTION_IDS, withApiKey = false) {
  const { bytes } = await makeBackup(await snapshot(w, { withApiKey }), [...only], new Date(2026, 9, 27));
  return readBackup(bytes);
}

const all = (mode: Mode): ImportChoices => ({ sections: Object.fromEntries(SECTION_IDS.map((id) => [id, mode])), projects: {} });

describe('backup file', () => {
  it('round-trips everything but imported games into an empty browser, bytes exact', async () => {
    const w = seeded();
    const b = await backupOf(w, SECTION_IDS, true);
    expect(b.manifest.format).toBe(FORMAT);
    expect(b.manifest.sections.map((s) => s.id)).toEqual([...SECTION_IDS]);
    for (const mode of ['merge', 'replace'] as const) {
      const { next } = await planImport(emptyWorld(), b, all(mode), { newId: ids });
      const want = seeded();
      delete want.stores.projects.imp;
      delete want.stores.saves['project:imp'];
      delete want.local['gm-project-source'];
      delete want.local['gm-offline'];
      want.local['gm-project-origin'] = JSON.stringify({ p1: 'nebula' });
      // the imported game's note, its game not here, waits as a removed game's record
      delete want.local['gm-imported-notes'];
      want.local['gm-removed-games'] = JSON.stringify([
        { id: 'old', name: 'Old', fingerprint: { gam: [9] }, rating: 2, removed: 3 },
        { id: 'imp', name: 'Their Game', fingerprint: { gam: [123] }, rating: 4, note: 'fun', removed: 50 },
      ]);
      const d = worldDiff(want, next);
      expect(d.set).toEqual([]);
      expect(d.remove).toEqual([]);
      for (const s of d.stores) expect([s.id, s.puts, s.deletes]).toEqual([s.id, [], []]);
      expect((next.stores.projects.p1 as { files: Record<string, Uint8Array> }).files['MINE.GAM']).toEqual(new Uint8Array(256).map((_, i) => i));
    }
  });

  it('brings an imported game’s note back onto the same game, found by its fingerprint', async () => {
    const b = await backupOf(seeded(), ['notes']);
    const fresh = emptyWorld();
    fresh.stores.projects.again = { id: 'again', name: 'Their Game', gam: 'T.GAM', updated: 1, files: {} };
    fresh.local['gm-project-source'] = JSON.stringify({ again: 'imported' });
    fresh.local['gm-imported-notes'] = JSON.stringify({ again: { source: 'x.zip', fingerprint: { gam: [123] } } });
    const { next } = await planImport(fresh, b, { ...all('merge'), sections: { notes: 'merge' } });
    expect(JSON.parse(next.local['gm-imported-notes']).again).toMatchObject({ rating: 4, note: 'fun', source: 'x.zip' });
  });

  it('leaves the API key out unless asked, and keeps this browser’s key when the file has none', async () => {
    const b = await backupOf(seeded(), ['ai']);
    const here = emptyWorld();
    here.local['gm-ai-settings'] = JSON.stringify({ provider: 'ollama', baseUrl: 'h', model: 'q', apiKey: 'mine' });
    const { next } = await planImport(here, b, { ...all('replace'), sections: { ai: 'replace' } });
    expect(JSON.parse(next.local['gm-ai-settings'])).toMatchObject({ provider: 'openai', apiKey: 'mine' });
    const none = await planImport(emptyWorld(), b, { ...all('replace'), sections: { ai: 'replace' } });
    expect(JSON.parse(none.next.local['gm-ai-settings']).apiKey).toBe('');
  });
});

describe('merge rules', () => {
  it('achievements are a union, scores keep the higher', async () => {
    const theirs = emptyWorld();
    theirs.stores.saves['site:achievements'] = { 'achievements.json': enc({ unlocked: { b: 1, c: 9 }, progress: {}, sets: {} }) };
    theirs.stores.saves['site:scores'] = { 'scores.json': enc({ best: { blaster: 100, brief: 70 }, total: 2000, plays: 1 }) };
    const { next, changes } = await planImport(seeded(), await backupOf(theirs), all('merge'));
    const a = JSON.parse(new TextDecoder().decode((next.stores.saves['site:achievements'] as Record<string, Uint8Array>)['achievements.json']));
    expect(a.unlocked).toEqual({ a: 1, b: 1, c: 9 });
    const s = JSON.parse(new TextDecoder().decode((next.stores.saves['site:scores'] as Record<string, Uint8Array>)['scores.json']));
    expect(s).toEqual({ best: { blaster: 500, brief: 70 }, total: 2000, plays: 3 });
    expect(changes.find((c) => c.id === 'achievements')?.lines).toEqual(['Unlocks 1 achievement']);
  });

  it('saves: adds what is missing, joins high scores, keeps the chosen slot and puts the other in Save backups', async () => {
    const theirs = emptyWorld();
    theirs.stores.saves['game:blaster'] = {
      'game0.sav': saveWith([1]),
      'game2.sav': saveWith([2]),
      'savnames.dat': serializeSlotNames(['other', '', 'second']),
      'blaster.his': his([
        [900, 'BOB'],
        [500, 'ANN'],
      ]),
    };
    for (const slots of ['mine', 'theirs'] as const) {
      const { next } = await planImport(seeded(), await backupOf(theirs, ['saves']), {
        ...all('merge'),
        sections: { saves: slots === 'mine' ? 'merge' : 'theirs' },
      });
      const f = next.stores.saves['game:blaster'] as Record<string, Uint8Array>;
      expect(f['game2.sav']).toEqual(saveWith([2]));
      expect(f['game0.sav']).toEqual(slots === 'mine' ? saveWith([149]) : saveWith([1]));
      expect(parseSlotNames(f['savnames.dat']).slice(0, 3)).toEqual([slots === 'mine' ? 'first' : 'other', '', 'second']);
      expect(parseHighScoreTable(f['blaster.his']).entries.slice(0, 3)).toEqual([
        { score: 900, name: 'BOB' },
        { score: 500, name: 'ANN' },
        { score: 0, name: '' },
      ]);
      expect(f['tinheart.dat']).toBeDefined(); // the hearts section's, left alone
      const aside = Object.values(next.stores.saveBackups).find((b) => (b as { id: string }).id !== 'b1') as { files: Record<string, Uint8Array> };
      expect(aside.files['game0.sav']).toEqual(slots === 'mine' ? saveWith([1]) : saveWith([149]));
    }
  });

  it('projects: a clashing id is kept as both, replaced or skipped; saves follow a kept copy', async () => {
    const theirs = seeded();
    (theirs.stores.projects.p1 as { name: string }).name = 'Changed';
    const b = await backupOf(theirs, ['projects', 'saves']);
    expect(projectClashes(seeded(), b)).toEqual([{ id: 'p1', name: 'Changed', here: 'My Game' }]);
    const both = await planImport(seeded(), b, { ...all('merge'), sections: { projects: 'merge', saves: 'merge' } }, { newId: () => 'copy' });
    expect(Object.keys(both.next.stores.projects).sort()).toEqual(['copy', 'imp', 'p1']);
    expect((both.next.stores.projects.copy as { name: string }).name).toBe('Changed (restored)');
    expect(both.next.stores.saves['project:copy']).toEqual({ 'game3.sav': bytes(0, 255, 1) });
    expect(JSON.parse(both.next.local['gm-project-origin'])).toEqual({ p1: 'nebula', imp: 'x', copy: 'nebula' });
    const rep = await planImport(seeded(), b, { ...all('merge'), sections: { projects: 'merge' }, projects: { p1: 'replace' } });
    expect((rep.next.stores.projects.p1 as { name: string }).name).toBe('Changed');
    const skip = await planImport(seeded(), b, { ...all('merge'), sections: { projects: 'merge' }, projects: { p1: 'skip' } });
    expect(worldDiff(seeded(), skip.next).stores.every((s) => !s.puts.length && !s.deletes.length)).toBe(true);
  });

  it('eggs and hearts found stay found; a broken egg stays broken', async () => {
    const theirs = seeded();
    theirs.local['gm-eggs'] = JSON.stringify({ depth: 'added', logic: 'added' });
    theirs.local['gm-egg-taps'] = '2';
    theirs.stores.saves['game:teddy'] = { 'tinheart.dat': enc({ found: 'x', scene: 1, at: [0, 0] }) };
    const here = emptyWorld();
    here.local['gm-eggs'] = JSON.stringify({ logic: 'broken' });
    here.local['gm-egg-taps'] = '9';
    const { next } = await planImport(here, await backupOf(theirs, ['eggs', 'hearts']), all('merge'));
    // blaster's egg was in a save there (saves not brought back): it comes as added
    expect(JSON.parse(next.local['gm-eggs'])).toEqual({ logic: 'broken', depth: 'added', blaster: 'added' });
    expect(next.local['gm-egg-taps']).toBe('9');
    expect(Object.keys(next.stores.saves).sort()).toEqual(['game:blaster', 'game:teddy']);
    expect(Object.keys(next.stores.saves['game:blaster'] as object)).toEqual(['tinheart.dat']);
  });

  it('preferring the file or this browser settles every clash its way', async () => {
    const theirs = seeded();
    (theirs.stores.projects.p1 as { name: string }).name = 'Changed';
    theirs.local['gm-theme'] = 'light';
    theirs.local['gm-imported-notes'] = JSON.stringify({ imp: { rating: 1, note: 'older', fingerprint: { gam: [123] }, edited: 10 } });
    theirs.stores.desk.EXTRAS = { serial: 'GM-9999' };
    const b = await backupOf(theirs, ['projects', 'prefs', 'notes', 'desk']);
    const file = await planImport(seeded(), b, all('theirs'));
    expect((file.next.stores.projects.p1 as { name: string }).name).toBe('Changed');
    expect(Object.keys(file.next.stores.projects).sort()).toEqual(['imp', 'p1']);
    expect(file.next.local['gm-theme']).toBe('light');
    expect(JSON.parse(file.next.local['gm-imported-notes']).imp.note).toBe('older');
    expect(file.next.stores.desk.EXTRAS).toEqual({ serial: 'GM-9999' });
    const mine = await planImport(seeded(), b, all('mine'));
    const d = worldDiff(seeded(), mine.next);
    expect([d.set, d.remove, d.stores.flatMap((x) => [...x.puts, ...x.deletes])]).toEqual([[], [], []]);
  });

  it('notes keep the newer edit; settings keep this browser’s and fill the rest', async () => {
    const here = seeded();
    here.local['gm-imported-notes'] = JSON.stringify({ imp: { rating: 1, note: 'older', fingerprint: { gam: [123] }, edited: 10 } });
    here.local['gm-theme'] = 'light';
    delete here.local['gm-library-only-type'];
    const { next } = await planImport(here, await backupOf(seeded(), ['notes', 'prefs']), all('merge'));
    expect(JSON.parse(next.local['gm-imported-notes']).imp).toMatchObject({ rating: 4, note: 'fun' });
    expect(next.local['gm-theme']).toBe('light');
    expect(next.local['gm-library-only-type']).toBe('maps');
  });
});

describe('what an import touches', () => {
  it('changes only the chosen sections', async () => {
    const theirs = emptyWorld();
    theirs.stores.saves['site:achievements'] = { 'achievements.json': enc({ unlocked: { z: 1 }, progress: {}, sets: {} }) };
    theirs.local['gm-theme'] = 'light';
    const b = await backupOf(theirs);
    const { next } = await planImport(seeded(), b, { ...all('replace'), sections: { achievements: 'replace' } });
    const d = worldDiff(seeded(), next);
    expect(d.set).toEqual([]);
    expect(d.remove).toEqual([]);
    expect(d.stores.flatMap((s) => [...s.puts.map(([k]) => `${s.id}/${k}`), ...s.deletes])).toEqual(['saves/site:achievements']);
  });

  it('a partial file holds only its sections, and the others stay as they are', async () => {
    const b = await backupOf(emptyWorld(), ['trophies', 'prefs']);
    expect(Object.keys(b.payloads).sort()).toEqual(['prefs', 'trophies']);
    const { next, changes } = await planImport(seeded(), b, all('replace'));
    expect(changes.map((c) => c.id)).toEqual(['trophies', 'prefs']);
    expect(next.stores.saves['site:achievements']).toBeDefined();
    expect(next.stores.projects.p1).toBeDefined();
    expect(next.local['gm-theme']).toBeUndefined();
    expect(next.local['gm-ai-settings']).toBeDefined();
  });

  it('merging a browser with its own backup changes nothing', async () => {
    const { next, changes } = await planImport(seeded(), await backupOf(seeded()), all('merge'));
    const d = worldDiff(seeded(), next);
    expect([d.set, d.remove]).toEqual([[], []]);
    for (const s of d.stores) expect([s.id, s.puts, s.deletes]).toEqual([s.id, [], []]);
    expect(changes.flatMap((c) => c.lines)).toEqual([]);
  });
});

describe('damaged files', () => {
  const manifest = (o: object = {}) => ({ format: FORMAT, version: FORMAT_VERSION, created: 'x', site: {}, sections: [], ...o });
  const zip = (files: Record<string, string>) => createZip(Object.entries(files).map(([name, t]) => ({ name, data: new TextEncoder().encode(t) })));
  const fails = async (b: Uint8Array | Promise<Uint8Array>, msg: RegExp) => {
    const err = await readBackup(await b).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(BackupError);
    expect((err as Error).message).toMatch(msg);
  };

  it('says why a file can’t be used', async () => {
    await fails(new TextEncoder().encode('hello'), /isn’t a Game-Maker backup/);
    await fails(zip({ 'a.txt': 'x' }), /no manifest/);
    await fails(zip({ 'manifest.json': '{' }), /manifest can’t be read/);
    await fails(zip({ 'manifest.json': JSON.stringify({ format: 'other' }) }), /isn’t a Game-Maker backup/);
    await fails(zip({ 'manifest.json': JSON.stringify(manifest({ version: FORMAT_VERSION + 1 })) }), /newer version/);
    await fails(zip({ 'manifest.json': JSON.stringify(manifest({ sections: [{ id: 'saves' }] })) }), /missing sections\/saves.json/);
    await fails(zip({ 'manifest.json': JSON.stringify(manifest({ sections: [{ id: 'saves' }] })), 'sections/saves.json': '{"saves":3}' }), /damaged/);
    await fails(zip({ 'manifest.json': JSON.stringify(manifest({ sections: [{ id: 'eggs' }] })), 'sections/eggs.json': 'nope' }), /Felt eggs/);
    const good = (await makeBackup(await snapshot(seeded()), [...SECTION_IDS])).bytes;
    await fails(good.slice(0, good.length - 30), /damaged/);
  });

  it('skips sections from a later version it doesn’t know', async () => {
    const b = await readBackup(await zip({ 'manifest.json': JSON.stringify(manifest({ sections: [{ id: 'future', title: 'Future things' }] })) }));
    expect(b.unknown).toEqual(['Future things']);
  });
});
