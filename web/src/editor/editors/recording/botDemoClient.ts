// Starts the demo bot in its Web Worker (botDemoWorker.ts); cancel() ends it on the spot.
import type { GameFiles } from '../../../project/files';
import type { BotDemo } from './botDemo';
import type { BotDemoMessage, BotDemoRequest } from './botDemoWorker';

export interface RunningDemo {
  done: Promise<BotDemo>;
  cancel(): void;
}

export function startBotDemo(files: GameFiles, req: Omit<BotDemoRequest, 'files'>, progress?: (what: string) => void): RunningDemo {
  const worker = new Worker(new URL('./botDemoWorker.ts', import.meta.url), { type: 'module', name: 'demo-bot' });
  let stop: (e: Error) => void = () => undefined;
  const done = new Promise<BotDemo>((resolve, reject) => {
    stop = reject;
    worker.onmessage = (e: MessageEvent<BotDemoMessage>) => {
      const m = e.data;
      if (m.kind === 'progress') progress?.(m.what);
      else {
        worker.terminate();
        if (m.kind === 'done') resolve(m.demo);
        else reject(new Error(m.message));
      }
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(e.message || 'The demo bot stopped with an error.'));
    };
  });
  worker.postMessage({ ...req, files: files.entries() } satisfies BotDemoRequest);
  return {
    done,
    cancel: () => {
      worker.terminate();
      stop(new DOMException('Stopped', 'AbortError'));
    },
  };
}
