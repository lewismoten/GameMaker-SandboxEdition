// Both walkthrough consumers must request the same Vite filesystem URL on either host platform.
import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it.each([
  ['C:\\game #1\\checkout', '/@fs/C:/game%20%231/checkout'],
  ['D:\\', '/@fs/D:'],
  ['/game+tools', '/@fs/game+tools'],
  ['/game #1/checkout', '/@fs/game%20%231/checkout'],
])('loads the walkthrough and its summary from %s', async (root, prefix) => {
  vi.stubEnv('VITE_REPO_ROOT', root);
  vi.resetModules(); // Each checkout has its own cached index.
  const { localWalk, localSummary } = await import('./devLocalWalk');
  const base = prefix + '/.for-lewis/research/archive-walks';
  const index = base + '/index.tsv';
  const file = base + '/archive%20%232/G%231.GAM.walkthrough.json';
  const walk = { version: 1, game: 'g#1', segments: [], timeline: { frames: 1 } };
  const fetchFile = vi.fn((url: string) => {
    if (url === index) return new Response('zip\tgam\ttotal\twon\tstatus\narchive #2\tG#1.GAM\t1\t1\twon');
    if (url === file) return Response.json(walk);
    return new Response(null, { status: 404 });
  });
  vi.stubGlobal('fetch', fetchFile);
  const loaded = await localWalk('G#1.GAM', 1);
  const summary = await localSummary('G#1.GAM');
  expect(fetchFile.mock.calls.flat()).toEqual([index, file, index]);
  expect(loaded?.walk).toEqual(walk);
  expect(summary).toEqual({ won: 1, total: 1, complete: true });
});
