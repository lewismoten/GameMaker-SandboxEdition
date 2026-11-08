// Runs the side-view bot (platformBot.ts) in its Web Worker (platformBotWorker.ts), one layout per worker, and
// plays it on the page itself where there are no workers (tests). cancel() ends a run on the spot.
import type { BotJob, BotRun } from './platformBot';
import type { PlatformBotMessage, PlatformBotRequest } from './platformBotWorker';

export interface RunningBot {
  done: Promise<BotRun>;
  cancel(): void;
}

export function startPlatformBot(job: BotJob): RunningBot {
  if (typeof Worker === 'undefined') return { done: import('./platformBot').then((m) => m.botPlays(job)), cancel: () => undefined };
  const worker = new Worker(new URL('./platformBotWorker.ts', import.meta.url), { type: 'module', name: 'platform-bot' });
  let stop: (e: Error) => void = () => undefined;
  const done = new Promise<BotRun>((resolve, reject) => {
    stop = reject;
    worker.onmessage = (e: MessageEvent<PlatformBotMessage>) => {
      worker.terminate();
      if (e.data.kind === 'done') resolve(e.data.run);
      else reject(new Error(e.data.message));
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(e.message || 'The bot stopped with an error.'));
    };
  });
  const n = job.names;
  const files: [string, Uint8Array][] = [];
  for (const name of [n.bbl, n.mbl, n.chr, n.cbl]) {
    const bytes = name ? job.files.get(name) : undefined;
    if (name && bytes) files.push([name.toLowerCase(), bytes]);
  }
  worker.postMessage({ names: n, blocks: job.blocks, result: job.result, files } satisfies PlatformBotRequest);
  return {
    done,
    cancel: () => {
      worker.terminate();
      stop(new DOMException('Stopped', 'AbortError'));
    },
  };
}
