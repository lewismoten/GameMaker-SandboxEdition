import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { catalogDownloadable, RSD_COMPANY } from './downloadable';
import { cdCatalog } from '../../scripts/cdGames';

describe('which catalog games may be downloaded', () => {
  it('offers this project’s own games and RSD’s samples only', () => {
    expect(catalogDownloadable({ gam: 'sample.gam', kind: 'gameware', company: RSD_COMPANY })).toBe(true);
    expect(catalogDownloadable({ gam: 'teddy.gam', kind: 'shareware', original: {} })).toBe(true);
    expect(catalogDownloadable({ gam: 'zark.gam', kind: 'gameware', company: 'A-J Games' })).toBe(false);
    expect(catalogDownloadable({ gam: 'other.gam', kind: 'shareware', company: 'Someone' })).toBe(false);
    expect(catalogDownloadable({ gam: null, kind: 'gameware', company: RSD_COMPANY })).toBe(false);
  });

  it('leaves out every other author’s game on the CD, as the release scripts’ --all does', () => {
    const catalog = cdCatalog(resolve(__dirname, '../../../cd'));
    const picked = catalog.filter(catalogDownloadable);
    const ids = picked.map((e) => e.id);
    for (const id of ['zark', 'bcuda', 'donut', 'warrior', 'outerlim']) expect(ids).not.toContain(id);
    expect(ids).toContain('sample');
    expect(ids).toContain('teddy');
    for (const e of picked) expect(!!e.original || e.company === RSD_COMPANY).toBe(true);
    // no CD shareware by other authors
    expect(picked.filter((e) => e.kind === 'shareware' && !e.original)).toEqual([]);
  });
});
