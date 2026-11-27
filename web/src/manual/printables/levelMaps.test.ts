// Level Maps keep successful loads and share pending work, including after a failed request.
import { afterEach, expect, it, vi } from 'vitest';
import { ADVTYPE, emptyScene, newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { newBlockSet, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { FakeDoc } from '../../../test/fakeDom';
import * as files from '../../project/files';
import { levelMaps } from './levelMaps';
import { SECRET_FILES, VIEW_FILES } from './levelMetadataLazy';
import type { PrintContext } from './kit';

const ctx: PrintContext = {
  entry: { id: 'test-map', title: 'Test Map', kind: 'gameware', path: '', gam: 'test.gam' },
  family: [],
  printables: {},
  manual: { title: '', pages: [] },
  shot: async () => undefined,
};

vi.mock('./levelMetadataLazy', async (original) => ({
  ...(await original<typeof import('./levelMetadataLazy')>()),
  SECRET_FILES: { 'test-map': async () => ({}) },
  VIEW_FILES: { 'test-map': async () => ({ maps: {} }) },
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('retries failed thumbnail metadata on the same printable and shares the successful preview load', async () => {
  const game = newGame();
  const scene = emptyScene(ADVTYPE);
  scene.files[1] = 'test.map';
  scene.files[2] = 'test.bbl';
  game.scenes.push(scene);
  const disk: Record<string, Uint8Array> = {
    'test.gam': serializeGame(game),
    'test.map': serializeMap(newMap()),
    'test.bbl': serializeBlocks(newBlockSet('bbl')),
  };
  const peek = vi.spyOn(files, 'peekGameFile').mockImplementation(async (_entry, name) => disk[name]);
  const views = vi.spyOn(VIEW_FILES, ctx.entry.id).mockRejectedValueOnce(new Error('offline'));
  const doc = new FakeDoc();
  vi.stubGlobal('document', {
    createElement: (tag: string) =>
      tag === 'canvas' ? { toBlob: (cb: BlobCallback) => cb(null), toDataURL: () => 'data:image/png;base64,' } : doc.createElement(tag),
  });
  vi.stubGlobal(
    'Image',
    class {
      async decode() {}
    },
  );

  const maps = levelMaps(ctx)!;
  await expect(maps.first()).rejects.toThrow('offline');
  const previews = await Promise.all([maps.preview(), maps.preview()]);
  expect(previews.every((p) => p?.el)).toBe(true);
  maps.release();
  expect(await maps.preview()).toBeDefined();
  expect(views).toHaveBeenCalledTimes(2);
  expect(peek).toHaveBeenCalledTimes(Object.keys(disk).length);
});

it('retries a failed game file shared by the viewer and thumbnail', async () => {
  const peek = vi.spyOn(files, 'peekGameFile').mockRejectedValueOnce(new Error('offline')).mockResolvedValue(serializeGame(newGame()));
  const maps = levelMaps(ctx)!;
  const failures = await Promise.allSettled([maps.first(), maps.render()]);
  expect(failures.map((f) => f.status)).toEqual(['rejected', 'rejected']);
  expect(peek).toHaveBeenCalledOnce();
  await expect(maps.render()).resolves.toEqual([]);
  await expect(maps.preview()).resolves.toBeUndefined();
  expect(peek).toHaveBeenCalledTimes(2);
});

it('keeps the reopened viewer cached when the released viewer fails later', async () => {
  vi.spyOn(files, 'peekGameFile').mockResolvedValue(serializeGame(newGame()));
  let fail!: (error: Error) => void;
  const pending = new Promise<Record<string, number[]>>((_resolve, reject) => {
    fail = reject;
  });
  const secrets = vi.spyOn(SECRET_FILES, ctx.entry.id).mockReturnValueOnce(pending);
  const maps = levelMaps(ctx)!;
  const old = maps.render();
  maps.release();
  await expect(maps.render()).resolves.toEqual([]);
  fail(new Error('offline'));
  await expect(old).rejects.toThrow('offline');
  await maps.render();
  expect(secrets).toHaveBeenCalledTimes(2);
});
