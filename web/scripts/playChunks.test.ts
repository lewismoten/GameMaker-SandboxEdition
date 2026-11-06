// Home stays a chunk-plan root after its static modernUi re-export is removed.
import { expect, it } from 'vitest';
import { resolve } from 'node:path';
import type { Rollup } from 'vite';
import config from '../vite.config';

it('does not put home-required data in the play-only runtime', () => {
  const root = resolve(__dirname, '..');
  const id = (path: string) => resolve(root, path);
  const catalog = 'src/project/files.ts';
  const graph: Record<string, string[]> = {
    [id('src/play.ts')]: [catalog],
    [id('src/editor/shell/home.ts')]: [catalog],
  };
  const output = config.build!.rollupOptions!.output as Rollup.OutputOptions;
  const chunk = output.manualChunks as Rollup.GetManualChunk;
  const meta = {
    getModuleInfo: (path: string) => ({ importedIds: (graph[path] ?? []).map(id) }),
  } as unknown as Rollup.ManualChunkMeta;
  expect(chunk(id(catalog), meta)).not.toBe('player');
});
