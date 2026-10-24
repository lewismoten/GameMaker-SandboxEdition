import { describe, expect, it } from 'vitest';
import { createZip, readZip } from '../project/zip';
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
