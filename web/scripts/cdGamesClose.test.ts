// Closing the dev server releases catalog requests between entries.
import { EventEmitter } from 'node:events';
import type { ViteDevServer } from 'vite';
import { expect, it, vi } from 'vitest';
import { setImmediate as yieldToServer } from 'node:timers/promises';
import { cdGames } from './cdGames';
import { gameShots } from './gameShots';

vi.mock('node:timers/promises', () => ({ setImmediate: vi.fn(() => Promise.resolve()) }));
vi.mock('./cdGamesScan', () => ({
  scan: () => ({ catalog: [{ id: 'first' }, { id: 'second' }], secret: [], files: new Map() }),
  entryFiles: () => new Map(),
  boxGameOf: () => undefined,
  quickHealth: () => undefined,
}));
vi.mock('./gameShots', () => ({ gameShots: vi.fn(() => new Map()) }));
vi.mock('./libraryFacts', () => ({ libraryFacts: () => ({}) }));
vi.mock('./archiveWorker', () => ({ archiveWorker: () => Object.assign(vi.fn(), { restart: vi.fn() }) }));

it('rejects a waiting catalog request when the server closes between entries', async () => {
  const httpServer = new EventEmitter();
  const watcher = Object.assign(new EventEmitter(), { add: vi.fn() });
  const use = vi.fn<(handler: (req: { url: string }, res: object, next: (error: Error) => void) => void) => void>();
  const configure = cdGames('/cd').configureServer;
  if (typeof configure !== 'function') throw new Error('Missing server hook');
  await configure.call({} as never, { httpServer, watcher, middlewares: { use } } as unknown as ViteDevServer);
  const next = vi.fn();
  let resume!: () => void;
  const paused = new Promise<void>((resolve) => {
    resume = resolve;
  });
  let firstDone!: () => void;
  const first = new Promise<void>((resolve) => {
    firstDone = resolve;
  });
  vi.mocked(gameShots).mockImplementationOnce(() => {
    vi.mocked(yieldToServer).mockReturnValueOnce(paused);
    firstDone();
    return new Map();
  });
  use.mock.calls[0][0]({ url: '/games/catalog.json' }, {}, next);
  await first;
  httpServer.emit('close');
  // Observe a bounded number of microtasks after preparation yields, even on regression.
  // Invalidate the stale promise afterwards so a broken retry loop can exit.
  try {
    resume();
    for (let turn = 0; turn < 12; turn++) await Promise.resolve();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/closed/i) }));
    expect(gameShots).toHaveBeenCalledTimes(1);
  } finally {
    watcher.emit('change', '/cd/file');
  }
});
