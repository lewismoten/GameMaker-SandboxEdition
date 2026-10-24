// The map clipboard: blocks copied or cut from one map, to paste into any map (kept for this browser tab).
import type { Stamp } from './stamps';

export type Clip = Pick<Stamp, 'w' | 'h' | 'cells'> & { bbl: string };

const KEY = 'gm-map-clip';
let clip: Clip | undefined;

export function setClip(c: Clip): void {
  clip = c;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* the clipboard still works on this page */
  }
}

/** What was copied last (on this page, else earlier in this tab). */
export function getClip(): Clip | undefined {
  if (clip) return clip;
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Clip | null;
    if (v && v.w > 0 && v.h > 0 && Array.isArray(v.cells) && v.cells.length === v.w * v.h) clip = v;
  } catch {
    /* nothing to paste */
  }
  return clip;
}
