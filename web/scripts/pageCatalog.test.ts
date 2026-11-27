// pageCatalog (cdGames.ts): a Starter in games/catalog.json keeps what the home page and dos.html read at load.
import type { PluginContext, EmittedFile } from 'rollup';
import { emitCdGames } from './cdGamesOutput';
import { withDetails, type CatalogEntry } from '../src/project/catalogFiles';
import { describe, expect, it, vi } from 'vitest';
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
  player: { base: 'xferplay-3.00', patches: { 'str.menu.highScores': 'Top Scores' } },
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
  it.each(['starter', undefined])('restores metadata from the emitted details for series %s', async (series) => {
    const game = { ...starter, series, gam: null, files: [], sizes: [] };
    const assets = new Map<string, string>();
    const emitFile = (file: EmittedFile) => {
      if (file.type === 'asset' && file.fileName && typeof file.source === 'string') assets.set(file.fileName, file.source);
      return '';
    };
    await emitCdGames.call({ emitFile } as PluginContext, () => ({ catalog: [game], secret: [], gm: [], files: new Map(), gates: new Map() }));
    const [lean] = JSON.parse(assets.get('games/catalog.json')!) as CatalogEntry[];
    expect(lean).not.toHaveProperty('controls');
    expect(lean).not.toHaveProperty('player');
    const detailsPath = `games/details/${game.id}.json`;
    const request = vi.fn(
      (url: string) => new Response(assets.get(url), { status: assets.has(url) ? 200 : 404, headers: { 'Content-Type': 'application/json' } }),
    );
    vi.stubGlobal('fetch', request);
    try {
      const full = await withDetails(lean, 'games/');
      expect(request.mock.calls).toEqual([[detailsPath]]);
      expect(full.player).toBeDefined();
      expect(full).toMatchObject({ player: game.player, controls: game.controls, blurb: game.blurb, original: game.original });
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('leaves the file lists to games/catalog-files.json, keeping only whether there is a demo', () => {
    const [e, d] = pageCatalog([starter, { ...starter, id: 'demo', files: ['demo.gam', 'demo.rec'], sizes: [1, 2] }]);
    expect(e).not.toHaveProperty('files');
    expect(e).not.toHaveProperty('sizes');
    expect(e.rec).toEqual([]);
    expect(d.rec).toEqual(['demo.rec']);
    expect(pageFiles([starter])).toEqual({ jump: { files: ['jump.gam'], sizes: [10] } });
  });
});
