// The walkthrough bot's Web Worker: makes a walkthrough (autoWalk.ts) off the page's thread,
// then plays it on the real engine (verify.ts) to check and time it. Posts progress, then the
// result; stopping ends the worker (walkClient.ts). It can play the author's own plays of
// scenes (mine.ts), and can walk one scene alone (the Level check's Watch the bot), the game
// then started at that scene as the play test starts it. After each scene it gets through it
// sends the walkthrough so far, which is kept if it is stopped in the next (walkClient.ts).
import { GameFiles } from '../../../project/files';
import { parseGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { startingAt } from '../../editors/integrator/startAt';
import { autoWalk, type AutoWalk, type Reused } from './autoWalk';
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
  /** The walkthrough made before (autoWalk's `reuse`): its scenes' keys are tried first. */
  reuse?: Reused[];
}

export type WalkMessage =
  | { kind: 'progress'; what: string }
  | { kind: 'scene'; soFar: AutoWalk }
  | { kind: 'done'; result: AutoWalk; verified?: Verified }
  | { kind: 'error'; message: string };

const post = (m: WalkMessage) => (self as unknown as Worker).postMessage(m);

self.onmessage = async (e: MessageEvent<WalkRequest>) => {
  const req = e.data;
  try {
    const files = new GameFiles(req.files);
    let game = parseGame(files.get(req.gam)!);
    if (req.only !== undefined) {
      game = startingAt(game, req.only);
      files.set(req.gam, serializeGame(game));
    }
    let last = 0;
    const given = req.walk;
    const result: AutoWalk = given
      ? { walk: given, scenes: [], won: false }
      : await autoWalk(game, files, req.id, {
          budgetMs: req.budgetMs,
          mine: req.mine,
          paths: req.paths,
          reuse: req.reuse,
          onScene: (soFar) => post({ kind: 'scene', soFar }),
          maxScenes: req.only !== undefined ? 1 : undefined,
          progress: (scene, style, places) => {
            if (performance.now() - last < 250) return;
            last = performance.now();
            post({ kind: 'progress', what: `${game.scenes[scene]?.desc.trim() || `Scene ${scene}`}: ${style}, ${places} places tried` });
          },
        });
    let verified: Verified | undefined;
    if (result.walk) {
      post({ kind: 'progress', what: 'Playing it on the engine to check and time it…' });
      verified = await verifyWalk(files, req.gam, result.walk, { maxMinutes: 60 });
      result.walk.timeline = { fps: result.walk.timeline.fps, frames: verified.frames, chapters: verified.chapters };
    }
    post({ kind: 'done', result, verified });
  } catch (err) {
    post({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
