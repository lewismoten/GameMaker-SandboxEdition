// The demo bot's Web Worker: makes the walkthrough (editor/check/walk/autoWalk.ts) as far as
// the chosen scene, unless one is given, then plays it on the engine and writes the demo
// (botDemo.ts). Posts progress, then the demo; stopping ends the worker (botDemoClient.ts).
import { GameFiles } from '../../../project/files';
import { parseGame } from '../../../formats/game';
import type { Walkthrough } from '../../../walkthrough/format';
import { autoWalk } from '../../check/walk/autoWalk';
import { walkToDemo, type BotDemo } from './botDemo';

export interface BotDemoRequest {
  files: [string, Uint8Array][];
  gam: string;
  id: string;
  scene: number;
  seconds: number;
  esc: boolean;
  /** Time the bot has for each scene (ms). */
  budgetMs: number;
  /** A walkthrough made earlier, to use instead of playing again. */
  walk?: Walkthrough;
}

export type BotDemoMessage = { kind: 'progress'; what: string } | { kind: 'done'; demo: BotDemo } | { kind: 'error'; message: string };

const post = (m: BotDemoMessage) => (self as unknown as Worker).postMessage(m);

self.onmessage = async (e: MessageEvent<BotDemoRequest>) => {
  try {
    const req = e.data;
    const files = new GameFiles(req.files);
    const game = parseGame(files.get(req.gam)!);
    let walk = req.walk;
    if (!walk) {
      let last = 0;
      let reached = false;
      const r = await autoWalk(game, files, req.id, {
        budgetMs: req.budgetMs,
        progress: (scene, style, places) => {
          // the bot has finished the chosen scene once it plays another after it
          if (scene === req.scene) reached = true;
          else if (reached) return true;
          if (performance.now() - last < 250) return;
          last = performance.now();
          post({ kind: 'progress', what: `${game.scenes[scene]?.desc.trim() || `Scene ${scene}`}: ${style}, ${places} places tried` });
        },
      });
      if (!r.walk) {
        post({ kind: 'done', demo: { ticks: 0, shown: 0, sceneAt: 0, keys: 0, truncated: false, message: r.stopped ?? 'The bot got nowhere.' } });
        return;
      }
      walk = r.walk;
    }
    post({ kind: 'progress', what: 'Playing it on the engine and writing down the keys…' });
    const demo = await walkToDemo(files, req.gam, walk, req.scene, req.seconds, req.esc);
    post({ kind: 'done', demo });
  } catch (err) {
    post({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
