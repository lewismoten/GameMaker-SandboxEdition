// The companion file: a round trip, the backup carries it, the DOS export never does.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameFiles } from './files';
import { backupEntries, emptyCompanion, getSection, isEmptyCompanion, parseCompanion, renameInCompanion, serializeCompanion, setSection, takeCompanion } from './companion';
import { withCompanion, type ProjectRecord } from './storage';
import { readZip, createZip } from './zip';
import { exportDos } from '../export/exportDos';

const game = () => new GameFiles([['quest.gam', new Uint8Array([1, 2, 3])], ['forest.bbl', new Uint8Array([4, 5])], ['level1.map', new Uint8Array([6])]]);

describe('the companion file', () => {
  it('round-trips through JSON and keeps keys it does not know', () => {
    const c = emptyCompanion();
    setSection(c, 'FOREST.BBL', 'terrains', [{ name: 'Grass', fill: 3 }]);
    const text = new TextDecoder().decode(serializeCompanion(c)).replace('"files"', '"future": {"x": 1}, "files"');
    const back = parseCompanion(text);
    expect(getSection(back, 'forest.bbl', 'terrains', [])).toEqual([{ name: 'Grass', fill: 3 }]);
    expect(back.future).toEqual({ x: 1 });
    expect(parseCompanion(serializeCompanion(back))).toEqual(back);
  });

  it('reads garbage as an empty companion', () => {
    expect(isEmptyCompanion(parseCompanion('not json'))).toBe(true);
    expect(isEmptyCompanion(parseCompanion(new Uint8Array([0xff])))).toBe(true);
  });

  it('removes empty sections and follows renamed files', () => {
    const c = emptyCompanion();
    setSection(c, 'a.bbl', 'stamps', [1]);
    renameInCompanion(c, 'a.bbl', 'b.bbl');
    expect(getSection(c, 'b.bbl', 'stamps', [])).toEqual([1]);
    setSection(c, 'b.bbl', 'stamps', undefined);
    expect(isEmptyCompanion(c)).toBe(true);
  });

  it('is kept by a save that does not know it, and replaced by one that does', () => {
    const rec = (companion?: ProjectRecord['companion']): ProjectRecord => ({ id: 'x', name: 'n', gam: 'quest.gam', updated: 0, files: {}, companion });
    const c = emptyCompanion();
    setSection(c, 'forest.bbl', 'terrains', [1]);
    expect(withCompanion(rec(), rec(c)).companion).toBe(c);
    const d = emptyCompanion();
    expect(withCompanion(rec(), rec(c), d).companion).toBe(d);
    expect(withCompanion(rec(), undefined).companion).toBeUndefined();
  });

  it('goes into the Game files backup and comes back out on import', async () => {
    const c = emptyCompanion();
    setSection(c, 'forest.bbl', 'buildings', [{ name: 'House' }]);
    const zip = await createZip(backupEntries(game(), 'quest.gam', c));
    const files = new GameFiles();
    for (const e of await readZip(zip)) files.set(e.name, e.data);
    expect(files.names()).toEqual(['forest.bbl', 'level1.map', 'quest.gam', 'quest.gmx']);
    const back = takeCompanion(files);
    expect(files.names()).toEqual(['forest.bbl', 'level1.map', 'quest.gam']);
    expect(getSection(back!, 'forest.bbl', 'buildings', [])).toEqual([{ name: 'House' }]);
    expect(backupEntries(game(), 'quest.gam', emptyCompanion()).map((e) => e.name)).toEqual(['FOREST.BBL', 'LEVEL1.MAP', 'QUEST.GAM']);
  });

  describe('the DOS export', () => {
    afterEach(() => vi.unstubAllGlobals());
    it('never carries it, even if a .gmx slipped in among the files', async () => {
      vi.stubGlobal('fetch', async () => new Response(new Uint8Array([0x4d, 0x5a])));
      const files = game();
      files.set('quest.gmx', serializeCompanion(emptyCompanion()));
      const { zip } = await exportDos(files, { title: 'Quest', gam: 'quest.gam', appBase: 'http://localhost/' });
      const names = (await readZip(zip)).map((e) => e.name);
      expect(names).toContain('LEVEL1.MAP');
      expect(names.filter((n) => /\.gmx$/i.test(n))).toEqual([]);
    });
  });
});
