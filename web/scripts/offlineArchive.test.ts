// The offline ZIP is stable across input ordering and changes with its payload.
import { expect, it } from 'vitest';
import { readZip } from '@lewismoten/gamemaker-sandbox-archives';
import { buildOfflineArchive } from './offlineArchive';
import type { Plugin, Rollup } from 'vite';
import config from '../vite.config';

it('builds one reproducible ZIP with exact site-relative names and content-derived identity', async () => {
  const entries = [
    { name: 'assets/Mixed-Case.js', data: new TextEncoder().encode('export const value = 1;') },
    { name: 'index.html', data: new TextEncoder().encode('<html>Offline</html>') },
  ];
  const a = await buildOfflineArchive(entries);
  const b = await buildOfflineArchive([...entries].reverse());
  expect(a).toEqual(b);
  expect(a.path).toBe(`offline.${a.sha256}.zip`);
  expect(a.bytes).toBe(a.data.length);
  expect(await readZip(a.data)).toEqual(entries);
  const changed = await buildOfflineArchive([...entries, { name: 'new.json', data: new Uint8Array([1]) }]);
  expect(changed.path).not.toBe(a.path);
});

it('emits a production manifest without an archive and no offline ZIP', () => {
  const plugin = config.plugins!.find((p) => (p as Plugin)?.name === 'gamemaker-offline') as Plugin;
  const hook = plugin.generateBundle!;
  const handler = typeof hook === 'function' ? hook : hook.handler;
  const emitted: Rollup.EmittedFile[] = [];
  const bundle = {
    'index.html': { type: 'asset', fileName: 'index.html', source: '<html>Home</html>' },
  };
  Reflect.apply(handler, { emitFile: (file: Rollup.EmittedFile) => emitted.push(file) }, [{}, bundle, false]);
  const manifest = emitted.find((file) => file.type === 'asset' && file.fileName === 'offline.json') as Rollup.EmittedAsset;
  expect(JSON.parse(String(manifest.source))).toEqual({
    version: expect.any(String),
    shell: expect.arrayContaining(['./']),
    files: expect.arrayContaining([
      expect.objectContaining({
        path: 'index.html',
        tier: 'core',
        stored: expect.any(Number),
        wire: expect.any(Number),
        sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    ]),
  });
  expect(emitted.some((file) => /^offline\..*\.zip$/.test(file.fileName ?? ''))).toBe(false);
});
