// Runs deepExtract.ts in a Web Worker (one, made on first use), or on the page when workers
// are not available, so the home page's deeper search always works.
import type { DeepJob, DeepPart } from './deepExtract';

let worker: Worker | undefined;
let next = 0;
const waiting = new Map<number, (p: DeepPart[]) => void>();

function make(): Worker | undefined {
  try {
    const w = new Worker(new URL('./deepIndexWorker.ts', import.meta.url), { type: 'module', name: 'home-deep-search' });
    w.onmessage = (e: MessageEvent<{ id: number; parts: DeepPart[] }>) => {
      waiting.get(e.data.id)?.(e.data.parts);
      waiting.delete(e.data.id);
    };
    w.onerror = () => {
      for (const done of waiting.values()) done([]);
      waiting.clear();
      worker = undefined;
    };
    return w;
  } catch {
    return undefined;
  }
}

export async function extractInWorker(job: DeepJob): Promise<DeepPart[]> {
  worker ??= make();
  if (!worker) return (await import('./deepExtract')).extractDeep(job);
  const id = ++next;
  const w = worker;
  return new Promise((resolve) => {
    waiting.set(id, resolve);
    w.postMessage({ id, job });
  });
}

export function stopWorker(): void {
  worker?.terminate();
  worker = undefined;
}
