// Checking a walkthrough file picked from disk (the bot's `<GAM>.walkthrough.json`) against the
// open game before the dialog plays it. Editor-only: nothing is saved to the game or companion.
import type { Walkthrough } from '../../walkthrough/format';

export type WalkFileCheck = { ok: true; walk: Walkthrough } | { ok: false; why: string };

const stem = (gam: string) => gam.replace(/\.gam$/i, '').toLowerCase();

/** Parses `text` and says plainly why it can't play on the open game (its .gam name and scene count). */
export function checkWalkFile(text: string, gam: string, sceneCount: number): WalkFileCheck {
  let w: Partial<Walkthrough> | null;
  try {
    w = JSON.parse(text) as Partial<Walkthrough> | null;
  } catch {
    return { ok: false, why: 'That file is not a walkthrough (it is not JSON).' };
  }
  if (!w || typeof w !== 'object' || !Array.isArray(w.segments) || !w.timeline || typeof w.timeline.frames !== 'number')
    return { ok: false, why: 'That file is not a walkthrough (no segments or timeline).' };
  if (w.version !== 1) return { ok: false, why: `That walkthrough is version ${String(w.version)}; only version 1 plays here.` };
  if (typeof w.game !== 'string' || w.game.toLowerCase() !== stem(gam))
    return { ok: false, why: `That walkthrough is for “${String(w.game)}”, not this game (${gam}). It was not played.` };
  if (w.segments.some((s) => !(s.scene >= 0 && s.scene < sceneCount)))
    return { ok: false, why: `That walkthrough uses scenes this game does not have (it has ${sceneCount}). It was not played.` };
  return { ok: true, walk: w as Walkthrough };
}
