// The walkthrough bot's Web Worker: makes a walkthrough (autoWalk.ts) off the page's thread,
// then plays it on the real engine (verify.ts) to check and time it. Posts progress, then the
// result; stopping ends the worker (walkClient.ts). It can play the author's own plays of
// scenes (mine.ts), and can walk one scene alone (the Level check's Watch the bot), the game
// then started at that scene as the play test starts it.
import { GameFiles } from '../../../project/files';
import { parseGame, serializeGame } from '../../../formats/game';
import { startingAt } from '../../editors/integrator/startAt';
import { autoWalk, type AutoWalk } from './autoWalk';
import { verifyWalk, type Verified } from './verify';
import type { Walkthrough } from '../../../walkthrough/format';

export interface WalkRequest {
  files: [string, Uint8Array][];
  gam: string;
  id: string;
  budgetMs: number;
  /** The author's plays to use, by scene (autoWalk's `mine`). */
  mine?: Record<number, string>;
  /** Walking paths to keep to, by block set (autoWalk's `paths`, walkPaths.ts). */
  paths?: Record<string, number[]>;
  /** Walk just this scene, the game started there. */
  only?: number;
  /** Don't walk: play this walkthrough on the engine, to check and time it. */
  walk?: Walkthrough;
}

export type WalkMessage = { kind: 'progress'; what: string } | { kind: 'done'; result: AutoWalk; verified?: Verified } | { kind: 'error'; message: string };

const post = (m: WalkMessage) => (self as unknown as Worker).postMessage(m);

self.onmessage = async (e: MessageEvent<WalkRequest>) => {
  try {
    const files = new GameFiles(e.data.files);
    let game = parseGame(files.get(e.data.gam)!);
    if (e.data.only !== undefined) {
      game = startingAt(game, e.data.only);
      files.set(e.data.gam, serializeGame(game));
    }
    let last = 0;
    const given = e.data.walk;
    const result: AutoWalk = given
      ? { walk: given, scenes: [], won: false }
      : await autoWalk(game, files, e.data.id, {
          budgetMs: e.data.budgetMs,
          mine: e.data.mine,
          paths: e.data.paths,
          maxScenes: e.data.only !== undefined ? 1 : undefined,
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
