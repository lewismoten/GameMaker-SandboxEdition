// Old saves keep opening: every dated fixture under test/fixtures/saves/ (written by that release's own code)
// is opened with the current code and nothing may be lost. See test/fixtures/saves/README.md.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { GameReader, scanImport } from '@lewismoten/gamemaker-sandbox-archives/scan';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { Recorder } from '@lewismoten/gamemaker-sandbox-engine/engine/recorder';
import { restoreSaved, type Saved } from '@lewismoten/gamemaker-sandbox-engine/engine/scene';
import { newCharInfo } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
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

function expectMineResumes(files: GameFiles, bytes: Uint8Array) {
  const game = parseGame(files.get('mine.gam')!);
  const save: Saved = JSON.parse(new TextDecoder().decode(bytes));
  expect(save.doscene).toBe(2);
  expect(game.scenes[save.doscene].desc).toBe('Mine Entrance');
  const session = { m: { files }, game, ci: newCharInfo(), rec: new Recorder(), sndClock: 0 };
  const loaded = restoreSaved(session, undefined, save);
  expect(loaded).toBeDefined();
  const { chr, ci } = loaded!.world;
  expect([chr.x[0], chr.y[0]]).toEqual([12, 7]);
  expect(ci.inv).toEqual([149, 150, 150, 150, 150, 150, 150, 150, 150, 150]);
  expect(ci.meter.slice(0, 2)).toEqual([3, 4]);
}

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
      const zip = read(dir, 'MINE.zip');
      const input = [{ path: 'MINE.zip', size: zip.length, read: () => Promise.resolve(zip) }];
      const { games } = await scanImport(input);
      expect(games).toHaveLength(1);
      const { files } = await new GameReader(input).read(games[0]);
      expect(takeCompanion(files)).toEqual(companion());
      expect([...files.get('a.pic')!]).toEqual([9, 8, 7]);
      expect([...files.get('b.pic')!]).toEqual([5]);
      expectMineResumes(files, read(dir, 'GAME0.SAV'));
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

  const projectSlotBackup = 'game-maker-project-slot.gmbackup';
  const backups = november24 ? ['game-maker.gmbackup', projectSlotBackup] : ['game-maker.gmbackup'];
  it.each(backups)('restores %s with games, companion, checkpoints, saves and settings', async (backup) => {
    const b = await readBackup(read(dir, backup));
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
    expect(Object.keys(p.files).sort()).toEqual(
      november24 ? ['A.PIC', 'B.PIC', 'FOREST.BBL', 'MINE.GAM', 'MINER.CBL', 'MINER.CHR', 'TOWN.MAP'] : ['A.PIC', 'B.PIC', 'MINE.GAM'],
    );
    expect([...p.files['B.PIC']]).toEqual([5]);
    const c = parseCompanion(p.companion);
    expect(getSection(c, 'MINE.GAM', 'notes', '')).toBe('Remember the key on level 2.');
    expect(readReservations(getSection(c, 'MINE.GAM', 'paletteReservations', []))).toHaveLength(2);
    expect(c).toEqual(companion());
    const cps = checkpointList(p);
    expect(cps.map((x) => [x.name, x.tag])).toEqual([
      ['First stamp', undefined],
      ['Second stamp', 'v1.1'],
    ]);
    const first = new GameFiles(versionAt(cps, 0));
    const second = new GameFiles(versionAt(cps, 1));
    if (november24) {
      expect(parseGame(first.get('MINE.GAM')!).scenes[2].desc).toBe('Old Shaft');
      expect(parseGame(second.get('MINE.GAM')!).scenes[2].desc).toBe('Mine Entrance');
      for (const [i, note] of ['Sketch the shaft.', 'Finish the entrance.'].entries()) {
        const expected = companion();
        expected.files['mine.gam'].notes = note;
        expect(cps[i].made).toBe([1000, 2000][i]);
        expect(parseCompanion(cps[i].companion)).toEqual(expected);
      }
    } else {
      expect([...first.get('MINE.GAM')!]).toEqual([1, 2, 3, 4]);
      expect([...second.get('MINE.GAM')!]).toEqual([1, 2, 3, 5]);
      expect(getSection(parseCompanion(cps[1].companion), 'MINE.GAM', 'notes', '')).toBe('Remember the key on level 2.');
    }
    expect(first.get('B.PIC')).toBeUndefined();
    expect([...second.get('B.PIC')!]).toEqual([5]);
    if (backup === projectSlotBackup) {
      const projectSaves = next.stores.saves[`project:${p.id}`] as Record<string, Uint8Array> | undefined;
      expect(projectSaves?.['game0.sav']).toBeDefined();
      expectMineResumes(new GameFiles(Object.entries(p.files)), projectSaves!['game0.sav']);
    } else if (november24) {
      expect(next.stores.saves[`project:${p.id}`]).toBeUndefined();
    }
    const saves = next.stores.saves['game:blaster'] as Record<string, Uint8Array>;
    expect(parseSave(saves['game0.sav']).doscene).toBe(2);
    expect(parseSlotNames(saves['savnames.dat'])[0]).toBe('first slot');
    expect(parseHighScoreTable(saves['blaster.his']).entries[0].name).toBe('ANN');
    const ach = next.stores.saves['site:achievements'] as Record<string, Uint8Array>;
    expect((JSON.parse(new TextDecoder().decode(ach['achievements.json'])) as { unlocked: unknown }).unlocked).toEqual({ a: 1, b: 2 });
    expect(next.local).toMatchObject(settings);
  });
});

vi.mock('../src/player/player', () => ({ mountPlayer: vi.fn() }));
vi.mock('../src/gfx/titlePoster', () => ({ titlePoster: vi.fn() }));
vi.mock('../src/achievements/playSaves', () => ({ playSaves: () => ({}) }));
vi.mock('../src/achievements', () => ({ playAchievements: () => ({}) }));
vi.mock('../src/offline', () => ({ registerServiceWorker: vi.fn() }));
vi.mock('../src/errorNotice/watch', () => ({ watchErrors: vi.fn() }));
vi.mock('../src/devReload', () => ({ watchForUpdates: vi.fn() }));

it('mounts the project slot when a catalog game has the same ID and slot name', async () => {
  const storage = await import('../src/project/storage');
  const { mountPlayer } = await import('../src/player/player');
  const projectSlot = Uint8Array.of(1);
  const buckets: Record<string, Record<string, Uint8Array>> = {
    'game:blaster': { 'game0.sav': Uint8Array.of(2), 'game1.sav': Uint8Array.of(3) },
    'project:blaster': { 'game0.sav': projectSlot },
  };
  const element = () => ({ style: {}, append: vi.fn(), prepend: vi.fn() });
  try {
    vi.stubGlobal('location', { search: '?project=blaster' });
    vi.stubGlobal('document', {
      querySelector: (selector: string) => (selector === '#player' ? element() : null),
      documentElement: element(),
      body: element(),
      createElement: element,
    });
    vi.spyOn(storage, 'loadProject').mockResolvedValue({
      record: { id: 'blaster', name: 'My Game', gam: 'MINE.GAM', updated: 0, files: {} },
      files: new GameFiles(),
      damage: [],
    });
    vi.spyOn(storage, 'loadSaveData').mockImplementation(async (id) => buckets[id] ?? {});
    await import('../src/play');
    await vi.waitFor(() => expect(mountPlayer).toHaveBeenCalledOnce());
    const [, files] = vi.mocked(mountPlayer).mock.calls[0];
    expect(files.get('game0.sav')).toEqual(projectSlot);
    expect(files.has('game1.sav')).toBe(false);
  } finally {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  }
});
