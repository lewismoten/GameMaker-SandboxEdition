// Plays a made walkthrough on the real engine, as the walkthrough player will (runtime.ts, with
// no screen), to check it and to time it: where it reaches the won scene, and the chapters'
// frames for the video. A walkthrough that stops partway is timed to a few seconds after its
// last key, so the video ends where the bot got to.
import { headlessCanvas, WalkRun } from '../../../walkthrough/runtime';
import { WALKTHROUGH_FPS, type Walkthrough } from '../../../walkthrough/format';
import type { GameFiles } from '../../../project/files';

export interface Verified {
  won: boolean;
  frames: number;
  chapters: { title: string; frame: number }[];
  /** Scenes play entered, in order. */
  scenes: number[];
  keysLeft: number;
  error?: string;
}

export async function verifyWalk(
  files: GameFiles,
  gam: string,
  walk: Walkthrough,
  opts: { maxMinutes?: number; progress?: (frame: number) => boolean | void } = {},
): Promise<Verified> {
  const run = new WalkRun(headlessCanvas(), files, gam, walk);
  const scenes: number[] = [];
  await run.start();
  const s = run.session!;
  const onScene = s.onScene!;
  s.onScene = (n) => {
    scenes.push(n);
    onScene(n);
  };
  const rec = s.rec as unknown as { keysLeft: number };
  const limit = (opts.maxMinutes ?? 60) * 60 * WALKTHROUGH_FPS;
  // once every key is played, a few seconds more (the last scene's link, or the hero idle where the bot stopped)
  let after = -1;
  while (run.frame < limit && (await run.step(false))) {
    if (run.frame % 600 === 0 && opts.progress?.(run.frame)) break;
    // (counted from the scene the bot stopped in: before that, a scene with no keys of its own is still to come)
    const there = scenes.length >= walk.segments.length + (walk.partial ? 1 : 0);
    if (rec.keysLeft === 0 && there && !scenes.includes(1)) {
      if (after < 0) after = run.frame;
      else if (run.frame - after > 5 * WALKTHROUGH_FPS) break;
    }
  }
  run.stop();
  return {
    won: scenes.includes(1),
    frames: run.frame,
    chapters: run.chapters,
    scenes,
    keysLeft: rec.keysLeft,
    error: run.error ? (run.error instanceof Error ? run.error.message : JSON.stringify(run.error)) : undefined,
  };
}
