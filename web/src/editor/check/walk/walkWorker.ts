// The walkthrough bot's Web Worker: makes a walkthrough (autoWalk.ts) off the page's thread,
// then plays it on the real engine (verify.ts) to check and time it. Posts progress, then the
// result; stopping ends the worker (walkClient.ts).
import { GameFiles } from '../../../project/files';
import { parseGame } from '../../../formats/game';
import { autoWalk, type AutoWalk } from './autoWalk';
import { verifyWalk, type Verified } from './verify';

export interface WalkRequest {
  files: [string, Uint8Array][];
  gam: string;
  id: string;
  budgetMs: number;
}

export type WalkMessage = { kind: 'progress'; what: string } | { kind: 'done'; result: AutoWalk; verified?: Verified } | { kind: 'error'; message: string };

const post = (m: WalkMessage) => (self as unknown as Worker).postMessage(m);

self.onmessage = async (e: MessageEvent<WalkRequest>) => {
  try {
    const files = new GameFiles(e.data.files);
    const game = parseGame(files.get(e.data.gam)!);
    let last = 0;
    const result = await autoWalk(game, files, e.data.id, {
      budgetMs: e.data.budgetMs,
      progress: (scene, style, places) => {
        if (performance.now() - last < 250) return;
        last = performance.now();
        post({ kind: 'progress', what: `${game.scenes[scene]?.desc.trim() || `Scene ${scene}`}: ${style}, ${places} places tried` });
      },
    });
    let verified: Verified | undefined;
    if (result.walk) {
      post({ kind: 'progress', what: 'Playing it on the engine to check and time it…' });
      verified = await verifyWalk(files, e.data.gam, result.walk, { maxMinutes: 60 });
      result.walk.timeline = { fps: result.walk.timeline.fps, frames: verified.frames, chapters: verified.chapters };
    }
    post({ kind: 'done', result, verified });
  } catch (err) {
    post({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
