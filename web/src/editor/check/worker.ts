// The level check's Web Worker: runs report.ts off the page's thread, so a long playtest never
// freezes the editor. It is sent a game's files and options and posts progress (and, about once a
// second, the live heat map: live.ts), then the report.
// Stopping is done by ending the worker (client.ts), which also frees its memory at once.
import { GameFiles } from '../../project/files';
import { runChecks, type CheckOptions, type Report } from './report';
import type { LiveProgress } from './live';

export interface CheckRequest {
  files: [string, Uint8Array][];
  options: Pick<CheckOptions, 'scene' | 'play' | 'budgetMs' | 'sameEverySide' | 'steadyMs'>;
}

export type CheckMessage =
  | { kind: 'progress'; what: string; done: number; total: number }
  | { kind: 'live'; live: LiveProgress }
  | { kind: 'done'; report: Report }
  | { kind: 'error'; message: string };

const post = (m: CheckMessage) => (self as unknown as Worker).postMessage(m);

self.onmessage = async (e: MessageEvent<CheckRequest>) => {
  try {
    const report = await runChecks(new GameFiles(e.data.files), {
      ...e.data.options,
      progress: (what, done, total) => post({ kind: 'progress', what, done, total }),
      live: (live) => post({ kind: 'live', live }),
    });
    post({ kind: 'done', report });
  } catch (err) {
    post({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
