// Starts a level check in its Web Worker (worker.ts) and hands back its progress and report;
// cancel() ends the worker on the spot.
import type { GameFiles } from '../../project/files';
import type { Report } from './report';
import type { CheckMessage, CheckRequest } from './worker';

export interface RunningCheck {
  done: Promise<Report>;
  cancel(): void;
}

export function startCheck(files: GameFiles, options: CheckRequest['options'], progress?: (what: string, done: number, total: number) => void): RunningCheck {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module', name: 'level-check' });
  let stop: (e: Error) => void = () => undefined;
  const done = new Promise<Report>((resolve, reject) => {
    stop = reject;
    worker.onmessage = (e: MessageEvent<CheckMessage>) => {
      const m = e.data;
      if (m.kind === 'progress') progress?.(m.what, m.done, m.total);
      else {
        worker.terminate();
        if (m.kind === 'done') resolve(m.report);
        else reject(new Error(m.message));
      }
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(e.message || 'The level check stopped with an error.'));
    };
  });
  const req: CheckRequest = { files: files.entries(), options };
  worker.postMessage(req);
  return {
    done,
    cancel: () => {
      worker.terminate();
      stop(new DOMException('Stopped', 'AbortError'));
    },
  };
}
