// The public inventory must never disclose gated game names or their private dependencies.
import { expect, it } from 'vitest';
import { resolve } from 'node:path';
import { cdSecretCatalog } from './cdGames';
import { offlineInventory } from './offlineManifest';
import { encodePart } from '../src/project/zipParts';
import { tierOf } from '../src/offline/tiers';

it('excludes every real secret folder from the public manifest and keeps private inventories separate', () => {
  const secret = cdSecretCatalog(resolve(import.meta.dirname, '../../cd')).map((e) => e.path);
  expect(secret.length).toBeGreaterThan(0);
  const paths = [
    'index.html',
    'games/originals/public/public.zip',
    'games/extra-1.json',
    ...secret.flatMap((dir) => [`${dir}game.zip`, `${dir}walkthrough.json.gz`]),
  ];
  const { files, extras } = offlineInventory(paths, () => new TextEncoder().encode('sample'), secret);
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
    'pocket/fw.bin',
    'tour/voice/list.json',
    'tour/voice/one.ogg',
    'trinkets/model.pack',
  ];
  const { files } = offlineInventory(paths, (p) => (p.endsWith('.zpart') ? part : new Uint8Array([1])), []);
  expect(files.map((f) => f.path)).toEqual([
    'games/originals/test/test.zpart',
    'games/shared/public.bin',
    'index.html',
    'pocket/fw.bin',
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
