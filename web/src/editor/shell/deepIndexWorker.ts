// The Web Worker behind the home page's deeper search: reads one game's text off the main
// thread (deepExtract.ts) and sends back its searchable lines.
import { extractDeep, type DeepJob } from './deepExtract';

self.onmessage = (e: MessageEvent<{ id: number; job: DeepJob }>) => {
  const { id, job } = e.data;
  extractDeep(job).then(
    (parts) => self.postMessage({ id, parts }),
    () => self.postMessage({ id, parts: [] }),
  );
};
