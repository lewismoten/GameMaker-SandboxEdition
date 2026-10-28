// Starts the walkthrough bot in its Web Worker (walkWorker.ts). cancel() ends it on the spot;
// stop() ends it too but keeps the walkthrough of the scenes it got through (the worker sends
// it after each), played on the engine in a fresh worker to check and time it.
import type { GameFiles } from '../../../project/files';
import type { AutoWalk } from './autoWalk';
import type { Verified } from './verify';
import type { WalkMessage, WalkRequest } from './walkWorker';

type WalkDone = { result: AutoWalk; verified?: Verified };

export interface RunningWalk {
  done: Promise<WalkDone>;
  /** Stops now, keeping the walkthrough of the scenes it got through (none got through: as cancel()). */
  stop(): void;
  cancel(): void;
}

/** Runs one request in a worker; `scene` hears each walkthrough so far. */
function run(files: GameFiles, req: Omit<WalkRequest, 'files'>, progress?: (what: string) => void, scene?: (soFar: AutoWalk) => void) {
  const worker = new Worker(new URL('./walkWorker.ts', import.meta.url), { type: 'module', name: 'walkthrough-bot' });
  let fail: (e: Error) => void = () => undefined;
  const done = new Promise<WalkDone>((resolve, reject) => {
    fail = reject;
    worker.onmessage = (e: MessageEvent<WalkMessage>) => {
      const m = e.data;
      if (m.kind === 'progress') progress?.(m.what);
      else if (m.kind === 'scene') scene?.(m.soFar);
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
    end: (e: Error) => {
      worker.terminate();
      fail(e);
    },
  };
}

export function startWalk(files: GameFiles, req: Omit<WalkRequest, 'files'>, progress?: (what: string) => void): RunningWalk {
  let soFar: AutoWalk | undefined;
  const bot = run(files, req, progress, (s) => (soFar = s));
  let settle: { resolve: (d: WalkDone) => void; reject: (e: Error) => void } | undefined;
  let check: ReturnType<typeof run> | undefined;
  const done = new Promise<WalkDone>((resolve, reject) => {
    settle = { resolve, reject };
    // once stopped, what it got through comes from the check instead
    bot.done.then(resolve, (e: Error) => !check && reject(e));
  });
  const abort = () => new DOMException('Stopped', 'AbortError');
  return {
    done,
    stop: () => {
      const kept = soFar;
      if (check) return;
      if (!kept?.walk) return void bot.end(abort());
      // the scenes it got through, timed on the engine
      check = run(files, { gam: req.gam, id: req.id, budgetMs: 0, only: req.only, walk: kept.walk }, progress);
      bot.end(abort());
      check.done.then(({ result, verified }) => settle?.resolve({ result: { ...kept, walk: result.walk }, verified }), settle?.reject);
    },
    cancel: () => {
      bot.end(abort());
      check?.end(abort());
      settle?.reject(abort());
    },
  };
}
