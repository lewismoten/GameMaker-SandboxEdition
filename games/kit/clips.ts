// Do the digital sounds play to the end? A walkthrough's run on the real engine, with its
// sound written down (web/src/walkthrough/runtime.ts' WalkAudio), checked for two ways a .VOC
// clip gets cut off as PLAYGAME plays it:
//
//   end    a clip still playing when its scene ends. PLAYGAME fades out (about 0.9 s here)
//          and keeps the Sound Blaster going, but ShowGraphic (the scene's exit picture or
//          the next scene's intro) calls FreeSoundSample, and a sound in the next scene cuts
//          it too (PlaySbVocFile stops the one playing). So a level's last clip has to start
//          early enough to finish before then.
//   start  the clip a level starts with (its first: before the walkthrough's first key, or a
//          voice in its first second) cut off by the next digital sound, often the bot's own
//          first jump or pickup.
//
//   cd web && npx vite-node ../games/kit/clipCheck.ts <id>...   (exits 1 when a clip is cut)
import { decodeVoc } from '../../web/src/formats/voc';
import type { AudioEvent } from '../../web/src/walkthrough/runtime';

/** How long after a level's first frame a clip still counts as the one it starts with. */
export const START_WINDOW_MS = 1000;
/** A clip this long is a voice (a line or a lyric), not an effect. */
export const VOICE_MS = 1000;

/** A clip may lose this much of its tail (its last few samples, a frame of the clock). */
export const SLACK_MS = 30;

export interface ClipCut {
  kind: 'end' | 'start';
  /** The scene the clip started in. */
  scene: number;
  clip: string;
  /** The clip's length and how much of it played, in ms. */
  ms: number;
  played: number;
  /** What cut it: 'picture' (ShowGraphic or the end of the run) or the clip that played over it. */
  by: string;
  /** When it started, in ms of the walkthrough's clock. */
  at: number;
  /** A start clip: ms from the level's first frame. */
  since?: number;
}

export interface ClipLog {
  events: AudioEvent[];
  /** When play entered each scene (before its intro picture). */
  scenes: { t: number; n: number }[];
  /** Each scene's first frame of play (after the intro and the fade in). */
  starts: { t: number; n: number }[];
  /** When the walkthrough pressed or let go of keys in play. */
  keys: number[];
  /** File names of the disk's clips, by their bytes. */
  names: Map<Uint8Array, string>;
}

/** A .VOC clip's length in ms. */
export function vocMs(bytes: Uint8Array): number {
  const v = decodeVoc(bytes);
  return v.sampleRate ? (v.samples.length / v.sampleRate) * 1000 : 0;
}

/** Every clip the run cut off at a scene's end or at a level's start. */
export function clipCuts(log: ClipLog): ClipCut[] {
  const { events, scenes, starts, names } = log;
  const sceneAt = (t: number) => {
    let n = -1;
    for (const s of scenes) if (s.t <= t) n = s.n;
    return n;
  };
  const cuts: ClipCut[] = [];
  events.forEach((e, i) => {
    if (e.kind !== 'voc' || !e.bytes) return;
    const ms = vocMs(e.bytes);
    let end = Infinity;
    let by = 'picture';
    for (const f of events.slice(i + 1)) {
      if (f.kind === 'voc') {
        end = f.t;
        by = (f.bytes && names.get(f.bytes)) ?? 'a clip';
        break;
      }
      if (f.kind === 'stopVoc') {
        end = f.t;
        break;
      }
    }
    const played = end - e.t;
    if (played + SLACK_MS >= ms) return;
    const scene = sceneAt(e.t);
    const clip = names.get(e.bytes) ?? '?';
    const crossed = by === 'picture' || sceneAt(end) !== scene;
    const start = [...starts].reverse().find((s) => s.t <= e.t);
    // Only the level's own first clip: one it plays before the walkthrough's first key there,
    // or a voice (a second or more) in its first second. Later ones are play's.
    const firstKey = start && log.keys.find((k) => k >= start.t);
    const early =
      start &&
      start.n === scene &&
      e.t - start.t <= START_WINDOW_MS &&
      !scenes.some((s) => s.t > start.t && s.t <= e.t) &&
      !events.slice(0, i).some((f) => f.kind === 'voc' && f.t >= start.t) &&
      (firstKey === undefined || e.t < firstKey || ms >= VOICE_MS);
    if (crossed) cuts.push({ kind: 'end', scene, clip, ms, played, by, at: e.t });
    else if (early) cuts.push({ kind: 'start', scene, clip, ms, played, by, at: e.t, since: e.t - start.t });
  });
  return cuts;
}

export function describeCut(c: ClipCut): string {
  const what = c.kind === 'end' ? `scene ${c.scene} ends during ${c.clip}` : `scene ${c.scene} starts with ${c.clip}`;
  return `${what}: ${Math.round(c.played)} of ${Math.round(c.ms)} ms played, cut by ${c.by} (at ${(c.at / 1000).toFixed(1)} s${c.since === undefined ? '' : `, ${Math.round(c.since)} ms into the level`})`;
}
