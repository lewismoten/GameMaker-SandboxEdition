// The public inventory must never disclose gated game names or their private dependencies.
import { expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { cdSecretCatalog } from './cdGames';
import { offlineInventory } from './offlineManifest';
import { encodePart } from '../src/project/zipParts';
import { offlineTiers, selectedFiles, tierOf, type OfflineTier } from '../src/offline/tiers';

it('excludes every real secret folder from the public manifest and keeps private inventories separate', () => {
  const secret = cdSecretCatalog(resolve(import.meta.dirname, '../../cd')).map((e) => e.path);
  expect(secret.length).toBeGreaterThan(0);
  const paths = [
    'index.html',
    'games/originals/public/public.zip',
    'games/extra-1.json',
    ...secret.flatMap((dir) => [`${dir}game.zip`, `${dir}walkthrough.json.gz`]),
  ];
  const { files, extras } = offlineInventory(paths, (p) => new TextEncoder().encode(p.includes('extra-') ? '[]' : 'sample'), secret);
  const publicText = JSON.stringify(files);
  for (const dir of secret) expect(publicText).not.toContain(dir.split('/').filter(Boolean).at(-1));
  expect(files.map((f) => f.path)).toEqual(['games/originals/public/public.zip', 'index.html']);
  expect(extras.size).toBe(secret.length);
  expect(files.every((f) => /^[a-f0-9]{64}$/.test(f.sha256))).toBe(true);
});
it('includes optional tiers, drops crawlers, archive captures, ZIP aliases and private-only shared blobs', () => {
  const part = encodePart(new Uint8Array([1, 2]), [[0, 1, 'public']]);
  const paths = [
    'index.html',
    'og/test.png',
    'robots.txt',
    'archive.html',
    'offline.old.zip',
    'games/originals/test/test.zip',
    'games/originals/test/test.zpart',
    'games/shared/public.bin',
    'games/shared/private.bin',
    'pocket/index.html',
    'pocket/fw/cyd-2432s028/firmware.bin',
    'tour/voice/list.json',
    'tour/voice/one.ogg',
    'trinkets/model.pack',
  ];
  const { files } = offlineInventory(paths, (p) => (p.endsWith('.zpart') ? part : new Uint8Array([1])), []);
  expect(files.map((f) => f.path)).toEqual([
    'games/originals/test/test.zpart',
    'games/shared/public.bin',
    'index.html',
    'tour/voice/list.json',
    'tour/voice/one.ogg',
    'trinkets/model.pack',
  ]);
  expect(tierOf('tour/voice/list.json')).toBe('core');
  expect(tierOf('phone/voice/list.json')).toBe('core');
  expect(tierOf('phone/voice/call/one.ogg')).toBe('speech');
  expect(tierOf('cast/sprites.json')).toBe('feelies');
});

it('uses the catalog canonical pack rather than duplicate legacy aliases', () => {
  const catalog = new TextEncoder().encode(JSON.stringify([{ path: 'games/originals/test/', pack: 'short.zip' }]));
  const { files } = offlineInventory(
    ['games/catalog.json', 'games/originals/test/short.zip', 'games/originals/test/longname.zip'],
    (p) => (p === 'games/catalog.json' ? catalog : new Uint8Array([1])),
    [],
  );
  expect(files.map((f) => f.path)).toEqual(['games/catalog.json', 'games/originals/test/short.zip']);
});

it('assigns packs and walkthroughs by catalog group and shared ZIP data by its consumers', () => {
  const catalog = [
    { path: 'games/originals/start/', original: {}, series: 'starter' },
    { path: 'games/originals/sand/', original: {}, company: 'Sandbox Software' },
    { path: 'games/originals/season/', original: {}, series: 'special' },
    { path: 'games/originals/bard/', original: {}, series: 'bizarre' },
    { path: 'games/gameware/cd/' },
  ];
  const data = new Map<string, Uint8Array>([['games/catalog.json', new TextEncoder().encode(JSON.stringify(catalog))]]);
  for (const [i, game] of catalog.entries()) {
    data.set(`${game.path}game.zpart`, encodePart(new Uint8Array([1, 2]), [[0, 1, i === 0 ? 'kit' : 'common']]));
    data.set(`${game.path}walkthrough.json.gz`, new Uint8Array([1]));
  }
  for (const name of ['kit', 'common', 'private']) data.set(`games/shared/${name}.bin`, new Uint8Array([1]));
  const { files } = offlineInventory([...data.keys()], (p) => data.get(p)!, []);
  const tiers = new Map(files.map((f) => [f.path, f.tier]));
  for (const [i, game] of catalog.entries()) {
    for (const suffix of ['game.zpart', 'walkthrough.json.gz'])
      expect(tiers.get(game.path + suffix)).toBe(['starters', 'sandbox', 'specials', 'bizarre', 'cd'][i]);
  }
  expect(tiers.get('games/shared/kit.bin')).toBe('starters');
  expect(tiers.get('games/shared/common.bin')).toBe('core');
  expect(tiers.has('games/shared/private.bin')).toBe(false);
  for (const tier of ['starters', 'sandbox', 'specials', 'bizarre', 'cd'] as OfflineTier[]) {
    const picked = selectedFiles(files, [tier]);
    expect(picked.filter((f) => f.path.endsWith('.zpart'))).toHaveLength(1);
    expect(picked.every((f) => f.tier === 'core' || f.tier === tier)).toBe(true);
    expect(picked.some((f) => f.path === 'games/shared/common.bin')).toBe(true);
    expect(picked.some((f) => f.path === 'games/shared/kit.bin')).toBe(tier === 'starters');
  }
});

it.each(['starter', 'special', 'bizarre', undefined])('classifies gated %s inventories without publishing their catalog or private blobs', (series) => {
  const tier = series === 'starter' ? 'starters' : series === 'special' ? 'specials' : series === 'bizarre' ? 'bizarre' : 'sandbox';
  const dir = 'games/originals/hidden/';
  const data = new Map([
    ['games/extra-1.json', new TextEncoder().encode(JSON.stringify([{ path: dir, original: {}, series }]))],
    [dir + 'game.zpart', encodePart(new Uint8Array([1, 2]), [[0, 1, 'private']])],
    ['games/shared/private.bin', new Uint8Array([1])],
  ]);
  const { files, extras } = offlineInventory([...data.keys()], (p) => data.get(p)!, [dir]);
  expect(files).toEqual([]);
  expect(extras.get(dir)?.map((f) => [f.path, f.tier])).toEqual([
    [dir + 'game.zpart', tier],
    ['games/shared/private.bin', tier],
  ]);
});

it('offers only the public tiers, with no separate gated tier or count', () => {
  expect(Object.keys(offlineTiers)).toEqual(['core', 'starters', 'sandbox', 'specials', 'bizarre', 'cd', 'feelies', 'speech', 'hardware']);
});

it('never lists a secret game walkthrough descriptor (videos/walk-HASH.json), which holds its title', () => {
  const dir = resolve(import.meta.dirname, '../public/videos');
  const walks = readdirSync(dir).filter((f) => /^walk-[0-9a-f]+\.json$/.test(f));
  expect(walks.length).toBeGreaterThan(0);
  const paths = ['index.html', ...walks.map((f) => `videos/${f}`)];
  const { files, extras } = offlineInventory(paths, (p) => new TextEncoder().encode(p), []);
  expect(files.map((f) => f.path)).toEqual(['index.html']);
  expect([...extras.values()].flat()).toEqual([]);
});

it('no walkthrough descriptor leaks into the offline file list of the build config', () => {
  expect(readFileSync(resolve(import.meta.dirname, '../vite.config.ts'), 'utf8')).toContain('videos\\/walk-[0-9a-f]+');
});
