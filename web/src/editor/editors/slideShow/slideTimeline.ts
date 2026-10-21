// The timing of a slide show (.LST) as PLAYGAME's ShowGraphic plays it, for the timeline.
//
// Each line is "NAME [seconds]". After a slide is shown the game waits:
//  - no number: for a key (the pause is left at 0xFFFF seconds; FileListClass meant to use the
//    caller's default, but it checks the next, empty entry, so it never does);
//  - 0: not at all, it goes straight on;
//  - N: up to N seconds, or until a key. Esc stops the whole show.
// Pictures (.gif/.bkd) first fade in from black (65 retraces); animations (.fli) play once
// first; text screens (.txt) wait that long on every page; a slide show inside a slide show
// plays its own timing and the number after it is not used.
import type { SlideEntry } from '../../../formats/graphicScripts';

export type ClipKind = 'gif' | 'bkd' | 'fli' | 'txt' | 'lst' | 'other';
export type Then = 'key' | 'none' | 'seconds';

/** Most lines FileListClass holds. */
export const MAX_SLIDES = 100;
/** Longest name FileEntry keeps. */
export const MAX_NAME = 15;
/** FadeTo: 65 steps of a 70 Hz retrace. */
export const FADE_SECONDS = 65 / 70;

export interface ClipFacts {
  kind: ClipKind;
  /** The file is in the game. */
  exists: boolean;
  /** Seconds an animation plays (frames x speed / 70). */
  playSeconds?: number;
  /** Pages of a text screen. */
  pages?: number;
}

export interface ClipTiming {
  then: Then;
  /** Seconds waited per page (seconds mode). */
  seconds: number;
  /** Seconds it shows before waiting (fade in, or the animation). */
  lead: number;
  /** How many times it waits (pages of a text screen). */
  waits: number;
  /** The number after it is not used (a slide show inside a slide show). */
  ignored: boolean;
  /** Seconds it takes when it does not wait for a key. */
  total: number;
}

export function thenOf(e: SlideEntry): Then {
  if (e.pause === undefined) return 'key';
  return e.pause === 0 ? 'none' : 'seconds';
}

export function clipKind(name: string): ClipKind {
  const ext = (/\.([^.]*)/.exec(name)?.[1] ?? '').toLowerCase();
  return (['gif', 'bkd', 'fli', 'txt', 'lst'].includes(ext) ? ext : 'other') as ClipKind;
}

export function clipTiming(e: SlideEntry, facts: ClipFacts): ClipTiming {
  const then = thenOf(e);
  const seconds = then === 'seconds' ? e.pause! : 0;
  const ignored = facts.kind === 'lst';
  let lead = 0;
  let waits = 1;
  if (facts.exists) {
    if (facts.kind === 'gif' || facts.kind === 'bkd') lead = FADE_SECONDS;
    else if (facts.kind === 'fli') lead = facts.playSeconds ?? 0;
    else if (facts.kind === 'txt') waits = Math.max(1, facts.pages ?? 1);
  } else if (facts.kind !== 'txt') waits = 0; // a missing picture or animation: the game goes straight on
  return { then, seconds, lead, waits, ignored, total: lead + (ignored ? 0 : seconds * waits) };
}

/** Width of a clip on the timeline: a whole thumbnail unless it waits a number of seconds. */
export function clipWidth(t: ClipTiming, pxPerSecond: number, thumbWidth: number, minWidth = 28): number {
  if (t.then !== 'seconds' || t.ignored || !t.waits) return thumbWidth;
  return Math.max(minWidth, Math.round(t.total * pxPerSecond));
}

/** The seconds to wait (1..32767) that make a clip about `width` pixels wide. */
export function secondsForWidth(width: number, t: ClipTiming, pxPerSecond: number): number {
  const s = (width / pxPerSecond - t.lead) / Math.max(1, t.waits);
  return Math.max(1, Math.min(32767, Math.round(s)));
}

/** Moves the entry at `from` to sit before what was at `to` (to may be entries.length). */
export function moveEntry<T>(list: T[], from: number, to: number): T[] {
  const out = list.slice();
  const [item] = out.splice(from, 1);
  out.splice(to > from ? to - 1 : to, 0, item);
  return out;
}

/** "1:05", "12s" */
export function formatSeconds(s: number): string {
  const r = Math.round(s);
  return r >= 60 ? `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}` : `${r}s`;
}

/** "About 1:05, plus 3 key presses" */
export function showLength(timings: ClipTiming[]): string {
  const total = timings.reduce((n, t) => n + t.total, 0);
  const keys = timings.filter((t) => t.then === 'key' && !t.ignored && t.waits).reduce((n, t) => n + t.waits, 0);
  const parts = [`about ${formatSeconds(total)}`];
  if (keys) parts.push(`${keys} key press${keys === 1 ? '' : 'es'}`);
  return parts.join(' + ');
}
