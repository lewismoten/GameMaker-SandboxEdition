// Tests for bundle.ts: saves exported to a zip and imported back, one folder per game.
import { describe, expect, it } from 'vitest';
import { createZip, readZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { exportSaveZip, importSaveZip } from './bundle';

describe('save zips', () => {
  it('round-trips every game’s saves, one folder per game', async () => {
    const saves = {
      nebula: { 'nebula.his': new Uint8Array([1, 2, 3]), 'game0.sav': new Uint8Array([4, 5]) },
      castle: { 'savnames.dat': new Uint8Array(300).fill(7) },
    };
    const zip = await exportSaveZip(saves);
    expect((await readZip(zip)).map((e) => e.name)).toEqual(['castle/SAVNAMES.DAT', 'nebula/GAME0.SAV', 'nebula/NEBULA.HIS']);
    expect(await importSaveZip(zip)).toEqual(saves);
  });

  it('skips anything not shaped like a game folder of files', async () => {
    const zip = await createZip([
      { name: 'loose.his', data: new Uint8Array([1]) },
      { name: 'a/b/c.sav', data: new Uint8Array([1]) },
      { name: 'Bad Id/x.his', data: new Uint8Array([1]) },
      { name: 'ok/..', data: new Uint8Array([1]) },
      { name: 'ok/GAME1.SAV', data: new Uint8Array([9]) },
    ]);
    expect(await importSaveZip(zip)).toEqual({ ok: { 'game1.sav': new Uint8Array([9]) } });
  });
});

describe('importSaveZip prototype safety', () => {
  it('a __proto__ or constructor folder does not write onto Object.prototype or Object', async () => {
    const zip = await createZip(
      [
        { name: '__proto__/debug', data: new Uint8Array([1, 2, 3]) },
        { name: 'constructor/debug', data: new Uint8Array([4]) },
        { name: 'nebula/GAME1.SAV', data: new Uint8Array([5]) },
      ],
      new Date(),
    );
    const out = await importSaveZip(zip);
    expect(({} as Record<string, unknown>).debug).toBeUndefined();
    expect((Object as unknown as Record<string, unknown>).debug).toBeUndefined();
    expect(Object.keys(out).sort()).toContain('nebula');
    expect(out.nebula['game1.sav']).toEqual(new Uint8Array([5]));
  });
});
