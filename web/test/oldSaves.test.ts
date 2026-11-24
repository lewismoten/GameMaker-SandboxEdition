// Old saves keep opening: every dated fixture under test/fixtures/saves/ (written by that release's own code)
// is opened with the current code and nothing may be lost. See test/fixtures/saves/README.md.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { aboutOf } from '../src/project/aboutGame';
import { GameFiles } from '../src/project/files';
import { parseCompanion, getSection, releaseNotesOf, exportPreviewsOf, takeCompanion } from '../src/project/companion';
import { checkpointList, versionAt } from '../src/project/checkpoint';
import { readReservations } from '../src/editor/editors/palette/paletteReservations';
import { readBackup } from '../src/backup/file';
import { planImport } from '../src/backup/plan';
import { emptyWorld } from '../src/backup/world';
import { SECTION_IDS } from '../src/backup/sections';
import { parseHighScoreTable } from '../src/project/saveData/highScores';
import { parseSave, parseSlotNames } from '../src/project/saveData/saveGame';
import type { ProjectRecord } from '../src/project/storage';

const root = join(__dirname, 'fixtures/saves');
const dirs = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);
const read = (dir: string, name: string) => new Uint8Array(readFileSync(join(root, dir, name)));

describe.each(dirs)('saves from %s', (dir) => {
  const november24 = dir === '2026-11-24-develop-beda6ecc7';
  const companion = () => parseCompanion(read(dir, 'MINE.GMC.json'));
  const settings = {
    'gm-theme': 'dark',
    'gm-library-only-type': 'maps',
    'gm-egg-taps': '4',
    ...(november24 ? { 'gm-chicken': 'lady', 'gm-project-origin': '{"p1":"nebula"}' } : {}),
  };

  if (november24) {
    it('opens the browser project ZIP with its game files and companion intact', async () => {
      const files = new GameFiles((await readZip(read(dir, 'MINE.zip'))).map(({ name, data }) => [name, data]));
      expect(takeCompanion(files)).toEqual(companion());
      expect(Object.fromEntries(files.entries().map(([name, data]) => [name, [...data]]))).toEqual({
        'mine.gam': [1, 2, 3, 5],
        'a.pic': [9, 8, 7],
        'b.pic': [5],
      });
    });
  }

  it('opens the companion with notes, to-do, release notes and reservations', () => {
    const c = companion();
    expect(aboutOf(c)).toEqual(november24 ? { title: 'My Game', credits: [{ role: 'Music', name: 'Ann' }] } : {});
    expect(exportPreviewsOf(c)).toBe(!november24);
    if (november24) {
      expect(getSection(c, 'TOWN.MAP', 'wrap', false)).toBe(true);
      expect(getSection(c, 'FOREST.BBL', 'roles', {})).toEqual({ '4': { roles: ['wall'] } });
    }
    expect(c.version).toBe(1);
    expect(getSection(c, 'MINE.GAM', 'notes', '')).toBe('Remember the key on level 2.');
    expect(getSection(c, 'MINE.GAM', 'todo', [])).toEqual([{ text: 'fix the bridge', done: false }]);
    expect(releaseNotesOf(c, '1.1')).toBe('Added a bridge.');
    expect(readReservations(getSection(c, 'MINE.GAM', 'paletteReservations', []))).toEqual([
      { role: 'character', first: 16, last: 31 },
      { role: 'monster', first: 64, last: 79 },
    ]);
  });

  it('opens the DOS save game, slot names and high scores', () => {
    const sav = parseSave(read(dir, 'GAME0.SAV'));
    expect(sav.doscene).toBe(2);
    expect(sav.world.ci.inv[0]).toBe(149);
    expect(sav.world.ci.meter.slice(0, 2)).toEqual([3, 4]);
    expect(parseSlotNames(read(dir, 'SAVNAMES.DAT'))[0]).toBe('first slot');
    expect(parseHighScoreTable(read(dir, 'BLASTER.HIS')).entries[0]).toEqual({ score: 500, name: 'ANN' });
  });

  it('opens the settings keys as the plain strings they were', () => {
    expect(JSON.parse(readFileSync(join(root, dir, 'settings.json'), 'utf8'))).toEqual(settings);
  });

  it('restores the .gmbackup with games, companion, checkpoints, saves and settings', async () => {
    const b = await readBackup(read(dir, 'game-maker.gmbackup'));
    expect(b.manifest.sections.map((s) => s.id)).toEqual([...SECTION_IDS]);
    const { next } = await planImport(
      emptyWorld(),
      b,
      { sections: Object.fromEntries(SECTION_IDS.map((id) => [id, 'merge'])), projects: {} },
      {
        newId: () => 'new-1',
      },
    );
    const p = next.stores.projects.p1 as ProjectRecord;
    expect(p.name).toBe('My Game');
    expect(Object.keys(p.files).sort()).toEqual(['A.PIC', 'B.PIC', 'MINE.GAM']);
    expect([...p.files['B.PIC']]).toEqual([5]);
    const c = parseCompanion(p.companion);
    expect(getSection(c, 'MINE.GAM', 'notes', '')).toBe('Remember the key on level 2.');
    expect(readReservations(getSection(c, 'MINE.GAM', 'paletteReservations', []))).toHaveLength(2);
    expect(c).toEqual(companion());
    const cps = checkpointList(p);
    if (november24) for (const cp of cps) expect(parseCompanion(cp.companion)).toEqual(companion());
    expect(cps.map((x) => [x.name, x.tag])).toEqual([
      ['First stamp', undefined],
      ['Second stamp', 'v1.1'],
    ]);
    const first = new GameFiles(versionAt(cps, 0));
    const second = new GameFiles(versionAt(cps, 1));
    expect([...first.get('MINE.GAM')!]).toEqual([1, 2, 3, 4]);
    expect([...second.get('MINE.GAM')!]).toEqual([1, 2, 3, 5]);
    expect(first.get('B.PIC')).toBeUndefined();
    expect([...second.get('B.PIC')!]).toEqual([5]);
    expect(getSection(parseCompanion(cps[1].companion), 'MINE.GAM', 'notes', '')).toBe('Remember the key on level 2.');
    const saves = next.stores.saves['game:blaster'] as Record<string, Uint8Array>;
    expect(parseSave(saves['game0.sav']).doscene).toBe(2);
    expect(parseSlotNames(saves['savnames.dat'])[0]).toBe('first slot');
    expect(parseHighScoreTable(saves['blaster.his']).entries[0].name).toBe('ANN');
    const ach = next.stores.saves['site:achievements'] as Record<string, Uint8Array>;
    expect((JSON.parse(new TextDecoder().decode(ach['achievements.json'])) as { unlocked: unknown }).unlocked).toEqual({ a: 1, b: 2 });
    expect(next.local).toMatchObject(settings);
  });
});
