// pageCatalog (cdGames.ts): a Starter in games/catalog.json keeps what the home page and dos.html read at load.
import { describe, expect, it } from 'vitest';
import { pageCatalog, pageFiles, type CdCatalogEntry } from './cdGames';

const starter = {
  id: 'jump',
  title: 'Jump',
  kind: 'shareware',
  path: 'games/originals/jump/',
  gam: 'jump.gam',
  files: ['jump.gam'],
  sizes: [10],
  blurb: 'A blurb',
  controls: { keys: 1 },
  series: 'starter',
  original: {
    sound: 'sb',
    label: { background: '#000', band: '#111', ink: '#fff' },
    box: { background: '#000', accent: '#111', ink: '#fff', tagline: 't', back: 'b', features: [] },
    manual: { title: 'M', pages: [{ head: 'h', html: 'x' }] },
  },
} as unknown as CdCatalogEntry;

describe('pageCatalog', () => {
  it('leaves a Starter its DOS fields and manual title, and puts the rest in its details', () => {
    const [e] = pageCatalog([starter]);
    expect(e).toMatchObject({ id: 'jump', gam: 'jump.gam', series: 'starter', details: true });
    expect(e.blurb).toBeUndefined();
    expect(e.controls).toBeUndefined();
    expect(e.original?.box).toBeUndefined();
    expect(e.original?.label).toBeUndefined();
    expect(e.original?.manual).toEqual({ title: 'M', pages: [] });
  });
  it('leaves other games as slimCatalog does', () => {
    const [e] = pageCatalog([{ ...starter, series: undefined }]);
    expect(e.blurb).toBe('A blurb');
    expect(e.original?.box).toBeDefined();
    expect(e.controls).toBeUndefined(); // every original game's controls are in its details
    expect(e.details).toBe(true);
  });
  it('leaves the file lists to games/catalog-files.json, keeping only whether there is a demo', () => {
    const [e, d] = pageCatalog([starter, { ...starter, id: 'demo', files: ['demo.gam', 'demo.rec'], sizes: [1, 2] }]);
    expect(e).not.toHaveProperty('files');
    expect(e).not.toHaveProperty('sizes');
    expect(e.rec).toBeUndefined();
    expect(d.rec).toBe(true);
    expect(pageFiles([starter])).toEqual({ jump: { files: ['jump.gam'], sizes: [10] } });
  });
});
