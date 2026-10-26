// Starts unrollWorker.ts for one map and hands back its progress and what it found; cancel()
// ends the worker on the spot.
import type { GameFiles } from '../../project/files';
import type { MapUnroll } from './unrollMap';
import type { UnrollMessage, UnrollRequest } from './unrollWorker';

export function startUnroll(
  files: GameFiles,
  req: Omit<UnrollRequest, 'files'>,
  progress?: (done: number, total: number) => void,
): { done: Promise<MapUnroll>; cancel(): void } {
  const worker = new Worker(new URL('./unrollWorker.ts', import.meta.url), { type: 'module', name: 'map-unroll' });
  let stop: (e: Error) => void = () => undefined;
  const done = new Promise<MapUnroll>((resolve, reject) => {
    stop = reject;
    worker.onmessage = (e: MessageEvent<UnrollMessage>) => {
      const m = e.data;
      if (m.kind === 'progress') return progress?.(m.done, m.total);
      worker.terminate();
      if (m.kind === 'done') resolve(m.found);
      else reject(new Error(m.message));
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(e.message || 'Playing the map stopped with an error.'));
    };
  });
  worker.postMessage({ ...req, files: files.entries() } satisfies UnrollRequest);
  return {
    done,
    cancel: () => {
      worker.terminate();
      stop(new DOMException('Stopped', 'AbortError'));
    },
  };
}
