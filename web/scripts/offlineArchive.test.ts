// The offline ZIP is stable across input ordering and changes with its payload.
import { expect, it } from 'vitest';
import { readZip } from '@lewismoten/gamemaker-sandbox-archives';
import { buildOfflineArchive } from './offlineArchive';

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
