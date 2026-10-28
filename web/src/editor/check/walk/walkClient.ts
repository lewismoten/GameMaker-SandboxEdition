// Starts the walkthrough bot in its Web Worker (walkWorker.ts); stop() asks it to stop where it
// is and keep the scenes it got through, cancel() ends it on the spot.
import type { GameFiles } from '../../../project/files';
import type { AutoWalk } from './autoWalk';
import type { Verified } from './verify';
import type { WalkMessage, WalkRequest, WalkStop } from './walkWorker';

export interface RunningWalk {
  done: Promise<{ result: AutoWalk; verified?: Verified }>;
  /** Stops after the scene it is in, keeping the walkthrough of the scenes before it. */
  stop(): void;
  cancel(): void;
}

export function startWalk(files: GameFiles, req: Omit<WalkRequest, 'files'>, progress?: (what: string) => void): RunningWalk {
  const worker = new Worker(new URL('./walkWorker.ts', import.meta.url), { type: 'module', name: 'walkthrough-bot' });
  let stop: (e: Error) => void = () => undefined;
  const done = new Promise<{ result: AutoWalk; verified?: Verified }>((resolve, reject) => {
    stop = reject;
    worker.onmessage = (e: MessageEvent<WalkMessage>) => {
      const m = e.data;
      if (m.kind === 'progress') progress?.(m.what);
      else {
        worker.terminate();
        if (m.kind === 'done') resolve({ result: m.result, verified: m.verified });
        else reject(new Error(m.message));
      }
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(e.message || 'The walkthrough bot stopped with an error.'));
    };
  });
  worker.postMessage({ ...req, files: files.entries() } satisfies WalkRequest);
  return {
    done,
    stop: () => worker.postMessage({ stop: true } satisfies WalkStop),
    cancel: () => {
      worker.terminate();
      stop(new DOMException('Stopped', 'AbortError'));
    },
  };
}
