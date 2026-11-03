// Starts shrinkWorker.ts for one FLI: its size report, or the chosen steps run. cancel() ends
// the worker on the spot, so changing an option mid-run starts over without waiting.
import type { FliReport, ShrinkStep } from '@lewismoten/gamemaker-sandbox-tools/kit/fliShrink';
import type { ShrinkOutcome } from './shrinkRun';
import type { ShrinkMessage, ShrinkRequest } from './shrinkWorker';

function run<T>(req: ShrinkRequest, pick: (m: ShrinkMessage) => T | undefined): { done: Promise<T>; cancel(): void } {
  const worker = new Worker(new URL('./shrinkWorker.ts', import.meta.url), { type: 'module', name: 'fli-shrink' });
  let stop: (e: Error) => void = () => undefined;
  const done = new Promise<T>((resolve, reject) => {
    stop = reject;
    worker.onmessage = (e: MessageEvent<ShrinkMessage>) => {
      worker.terminate();
      const v = pick(e.data);
      if (v !== undefined) resolve(v);
      else reject(new Error(e.data.kind === 'error' ? e.data.message : 'Unexpected answer.'));
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(e.message || 'Making it smaller stopped with an error.'));
    };
  });
  worker.postMessage(req);
  return {
    done,
    cancel: () => {
      worker.terminate();
      stop(new DOMException('Stopped', 'AbortError'));
    },
  };
}

export const startReport = (fli: Uint8Array) => run<FliReport>({ kind: 'report', fli }, (m) => (m.kind === 'report' ? m.report : undefined));

export const startShrink = (fli: Uint8Array, steps: ShrinkStep[]) =>
  run<ShrinkOutcome>({ kind: 'shrink', fli, steps }, (m) => (m.kind === 'shrink' ? m.outcome : undefined));
