// Redo one level of a walkthrough, with no DOM. The bot plays the whole game again from the
// start (autoWalk), because counters, keys and inventory carry from scene to scene (PLAYGAME
// keeps the hero's meters across scenes), so a new play of one scene cannot just be pasted in
// between the old ones: the scenes after it must start from what the new play leaves. Every
// other scene's old keys are tried first (`reuse`), so those go fast and come out unchanged
// when they still reach a way on; one that no longer does is searched for again by the bot.
// `changedAfter` says which later scenes ended up different, so the person can be told.
import type { Walkthrough } from '../../../walkthrough/format';
import type { Reused, SceneOutcome } from './autoWalk';

/** A level of a walkthrough that can be redone: a scene its segments start in, with the name its chapter has. */
export interface RedoLevel {
  scene: number;
  title: string;
}

export function redoLevels(walk: Walkthrough): RedoLevel[] {
  return walk.segments.map((s) => ({
    scene: s.scene,
    title: walk.chapters.find((c) => c.scene === s.scene)?.title ?? `Scene ${s.scene}`,
  }));
}

/** The old keys of every scene but `scene`, in play order; `scene` is left out (undefined) so the bot plays it fresh. */
export function redoReuse(
  walk: Walkthrough,
  scenes: Omit<SceneOutcome, 'heat'>[] | undefined,
  scene: number,
  fallback: Reused['strategy'],
): (Reused | undefined)[] {
  return walk.segments.map((seg) => {
    if (seg.scene === scene) return undefined;
    const was = scenes?.find((s) => s.scene === seg.scene);
    return { scene: seg.scene, keys: seg.keys, strategy: was?.strategy ?? fallback, paths: was?.paths };
  });
}

/** Scenes after `scene` whose keys are not the old ones: the bot had to play them again. */
export function changedAfter(before: Walkthrough, after: Walkthrough, scene: number): number[] {
  const at = before.segments.findIndex((s) => s.scene === scene);
  if (at < 0) return [];
  return before.segments
    .slice(at + 1)
    .filter((s) => after.segments.find((a) => a.scene === s.scene)?.keys !== s.keys)
    .map((s) => s.scene);
}
