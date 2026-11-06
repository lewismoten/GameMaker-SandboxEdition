// Manual chunks must not turn a pure player-data import into an engine download.
import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import type { Rollup } from 'vite';
import config from '../vite.config';

const root = resolve(__dirname, '..');
const id = (path: string) => resolve(root, path);

function classify(graph: Record<string, string[]>): (path: string) => string | null | undefined {
  const output = config.build!.rollupOptions!.output as Rollup.OutputOptions;
  const chunk = output.manualChunks as Rollup.GetManualChunk;
  const meta = {
    getModuleInfo: (path: string) => ({ importedIds: (graph[path] ?? []).map(id) }),
  } as unknown as Rollup.ManualChunkMeta;
  // These tests share one graph, like the callback's cached closures in one build.
  return (path) => chunk(id(path), meta);
}

const table = 'packages/engine/src/player/patchTable.ts';
const rules = 'packages/engine/src/player/patchRules.ts';
const game = 'packages/engine/src/engine/game.ts';
const graph = {
  [id('src/play.ts')]: [table, rules, game],
  [id('src/editor/shell/home.ts')]: [table],
};

describe('player chunk boundaries', () => {
  it('does not put home-required data in the play-only runtime', () => {
    expect(classify(graph)(table)).not.toBe('player');
  });
});
