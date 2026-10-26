// The music editor's track clipboard: the last track copied, kept in this browser so it can be
// pasted into another song, after switching files or reloading. A JSON copy also goes on the
// system clipboard when the browser allows it, but pasting never needs it.
import { isTrackClip, type TrackClip } from './trackClip';

const KEY = 'gm-mus-track-clip';

function loadTrackClip(): TrackClip | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    const clip: unknown = raw ? JSON.parse(raw) : undefined;
    return isTrackClip(clip) ? clip : undefined;
  } catch {
    return undefined;
  }
}

/** Keeps the clip; false when this browser can't store it (it still lasts until the page reloads). */
export function saveTrackClip(clip: TrackClip): boolean {
  memory = clip;
  const json = JSON.stringify(clip);
  try {
    void navigator.clipboard?.writeText(json).catch(() => undefined);
  } catch {
    /* no system clipboard here */
  }
  try {
    localStorage.setItem(KEY, json);
    return true;
  } catch {
    return false;
  }
}

/** The clip in this page when storage is refused. */
let memory: TrackClip | undefined;

export const currentTrackClip = (): TrackClip | undefined => loadTrackClip() ?? memory;
